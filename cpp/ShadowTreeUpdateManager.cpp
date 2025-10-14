#include "ShadowTreeUpdateManager.hpp"

#include "Observable.hpp"
#include "Effect.hpp"

#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <NitroModules/AnyMap.hpp>
#include <variant>
#include <functional>
#include <type_traits>
#include <string>
#include <cctype>
#include <react/renderer/uimanager/UIManagerBinding.h>
#include <cassert>

namespace margelo::nitro::cssnitro {

    using jsi::Runtime;
    using reactnativecss::Observable;
    namespace nitro_ns = ::margelo::nitro;

    ShadowTreeUpdateManager::ShadowTreeUpdateManager() = default;

    struct VariantConverter {
    private:
        static bool containsColorInsensitive(const std::string &key) {
            if (key.size() < 5) return false;
            std::string lower;
            lower.reserve(key.size());
            for (char c: key)
                lower.push_back(
                        static_cast<char>(::tolower(static_cast<unsigned char>(c))));
            return lower.find("color") != std::string::npos;
        }

    public:
        static folly::dynamic convert(ShadowTreeUpdateManager &self,
                                      Runtime &runtime,
                                      const nitro_ns::VariantType &var) {
            return std::visit(
                    [&self, &runtime](auto &&arg) -> folly::dynamic {
                        using T = std::decay_t<decltype(arg)>;
                        if constexpr (std::is_same_v<T, int64_t>) {
                            return folly::dynamic(static_cast<int64_t>(arg));
                        } else if constexpr (
                                std::is_same_v<T, bool> ||
                                std::is_same_v<T, double> ||
                                std::is_same_v<T, std::string>
                                ) {
                            return folly::dynamic(arg);
                        } else if constexpr (std::is_same_v<T, nitro_ns::AnyArray>) {
                            folly::dynamic arr = folly::dynamic::array();
                            for (const auto &elem: arg) {
                                const auto &v = static_cast<const nitro_ns::VariantType &>(elem);
                                arr.push_back(convert(self, runtime, v));
                            }
                            return arr;
                        } else if constexpr (std::is_same_v<T, nitro_ns::AnyObject>) {
                            folly::dynamic obj = folly::dynamic::object();
                            for (const auto &kv: arg) {
                                auto dynVal = convert(self, runtime,
                                                      static_cast<const nitro_ns::VariantType &>(kv.second));
                                if (containsColorInsensitive(kv.first)) {
                                    obj[kv.first] = self.processColorDynamic(runtime, dynVal);
                                } else {
                                    obj[kv.first] = std::move(dynVal);
                                }
                            }
                            return obj;
                        } else {
                            return {nullptr};
                        }
                    },
                    var);
        }

        // Overload: convert an AnyMap directly (top-level style entry)
        static folly::dynamic convert(ShadowTreeUpdateManager &self,
                                      Runtime &runtime,
                                      const std::shared_ptr<::margelo::nitro::AnyMap> &entry) {
            folly::dynamic obj = folly::dynamic::object();
            for (const auto &kv: entry->getMap()) {
                const auto &v = static_cast<const nitro_ns::VariantType &>(kv.second);
                auto dynVal = convert(self, runtime, v);
                if (containsColorInsensitive(kv.first)) {
                    obj[kv.first] = self.processColorDynamic(runtime, dynVal);
                } else {
                    obj[kv.first] = std::move(dynVal);
                }
            }
            return obj;
        }
    };

    void ShadowTreeUpdateManager::linkComponent(Runtime &runtime,
                                                const std::string &componentId,
                                                facebook::react::Tag tag) {
        component_links_[componentId] = ComponentLink{tag, &runtime};
        ensureRuntimeEffect(runtime);
    }

    void ShadowTreeUpdateManager::unlinkComponent(const std::string &componentId) {
        auto it = component_links_.find(componentId);
        if (it != component_links_.end()) component_links_.erase(it);
    }

    void ShadowTreeUpdateManager::addUpdates(
            const std::string &componentId,
            const std::shared_ptr<::margelo::nitro::AnyMap> &styleMap) {
        auto it = component_links_.find(componentId);
        if (it == component_links_.end()) return;

        ComponentLink &link = it->second;
        if (link.runtime == nullptr) return;

        // Convert the single AnyMap to folly::dynamic
        auto payload = VariantConverter::convert(*this, *link.runtime, styleMap);

        auto &obs = runtime_updates_[link.runtime];
        if (!obs) {
            obs = Observable<UpdatesMap>::create(UpdatesMap{});
        }

        UpdatesMap cur = obs->get();
        cur[link.tag] = std::move(payload);
        obs->set(std::move(cur));
    }

    void ShadowTreeUpdateManager::registerProcessColorFunction(jsi::Function &&fn) {
        this->process_color_ = std::make_shared<jsi::Function>(std::move(fn));
        process_color_cache_.clear();
    }

    void ShadowTreeUpdateManager::ensureRuntimeEffect(Runtime &runtime) {
        auto *rt = &runtime;
        auto rtObsIt = runtime_updates_.find(rt);
        if (rtObsIt == runtime_updates_.end()) {
            auto obs = Observable<UpdatesMap>::create(UpdatesMap{});
            rtObsIt = runtime_updates_.emplace(rt, std::move(obs)).first;
        }
        if (runtime_effects_.find(rt) == runtime_effects_.end()) {
            auto obs = rtObsIt->second;
            auto effect = std::make_shared<reactnativecss::Effect>(
                    [obs, rt](reactnativecss::Effect::GetProxy &get) {
                        const ShadowTreeUpdateManager::UpdatesMap &updates = get(*obs);
                        if (updates.empty()) return;
                        ShadowTreeUpdateManager::applyUpdates(*rt, updates);
                        obs->set(ShadowTreeUpdateManager::UpdatesMap{});
                    });
            // Setup the subscription by doing a dummy get()
            (void) obs->get(*effect);
            runtime_effects_.emplace(rt, std::move(effect));
        }
    }

    // Process a single dynamic color value: if string -> call JSI fn (cached), else return as-is
    folly::dynamic ShadowTreeUpdateManager::processColorDynamic(Runtime &runtime,
                                                                const folly::dynamic &value) {
        if (!value.isString()) {
            return value;
        }
        const std::string &colorStr = value.getString();
        auto it = process_color_cache_.find(colorStr);
        if (it != process_color_cache_.end()) {
            return {it->second};
        }
        if (!process_color_) {
            return value;
        }
        jsi::String str = jsi::String::createFromUtf8(runtime, colorStr);
        jsi::Value result = process_color_->call(runtime, jsi::Value(runtime, str));
        if (!result.isNumber()) {
            return value;
        }
        int processed = static_cast<int>(result.asNumber());
        process_color_cache_.emplace(colorStr, processed);
        return {processed};
    }

    void
    ShadowTreeUpdateManager::applyUpdates(Runtime &runtime, const UpdatesMap &updates) {
        if (updates.empty()) return;
        auto binding = facebook::react::UIManagerBinding::getBinding(runtime);
        if (!binding) return;
        auto &uiManager = binding->getUIManager();
        uiManager.updateShadowTree(updates);
    }

} // namespace margelo::nitro::cssnitro
