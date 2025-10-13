#include "ShadowTreeUpdateManager.hpp"

#include "Observable.hpp"
#include "Effect.hpp"

#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>
#include <NitroModules/AnyMap.hpp>
#include <variant>
#include <functional>
#include <cctype>

#if __has_include(<react/renderer/uimanager/UIManagerBinding.h>)

#include <react/renderer/uimanager/UIManagerBinding.h>

#define HAS_UIMANAGER_BINDING 1
#else
#define HAS_UIMANAGER_BINDING 0
#endif

namespace margelo {
    namespace nitro {
        namespace cssnitro {

            using jsi::Runtime;
            using reactnativecss::Observable;
            namespace nitro_ns = ::margelo::nitro;

            namespace {
                static bool containsColorInsensitive(const std::string &key) {
                    if (key.size() < 5) return false;
                    std::string lower;
                    lower.reserve(key.size());
                    for (char c: key)
                        lower.push_back(
                                static_cast<char>(::tolower(static_cast<unsigned char>(c))));
                    return lower.find("color") != std::string::npos;
                }
            }

            // Hook-aware conversion: allow a key-based transform of dynamic values during object conversion
            static folly::dynamic variantToDynamicWithHook(
                    const nitro_ns::VariantType &var,
                    const std::function<folly::dynamic(const std::string &,
                                                       const folly::dynamic &)> &hook) {
                return std::visit(
                        [&hook](auto &&arg) -> folly::dynamic {
                            using T = std::decay_t<decltype(arg)>;
                            if constexpr (std::is_same_v<T, std::monostate>) {
                                return folly::dynamic(nullptr);
                            } else if constexpr (std::is_same_v<T, bool>) {
                                return folly::dynamic(arg);
                            } else if constexpr (std::is_same_v<T, double>) {
                                return folly::dynamic(arg);
                            } else if constexpr (std::is_same_v<T, int64_t>) {
                                return folly::dynamic(static_cast<int64_t>(arg));
                            } else if constexpr (std::is_same_v<T, std::string>) {
                                return folly::dynamic(arg);
                            } else if constexpr (std::is_same_v<T, nitro_ns::AnyArray>) {
                                folly::dynamic arr = folly::dynamic::array();
                                for (const auto &elem: arg) {
                                    const nitro_ns::VariantType &v = static_cast<const nitro_ns::VariantType &>(elem);
                                    arr.push_back(variantToDynamicWithHook(v, hook));
                                }
                                return arr;
                            } else if constexpr (std::is_same_v<T, nitro_ns::AnyObject>) {
                                folly::dynamic obj = folly::dynamic::object();
                                for (const auto &kv: arg) {
                                    auto dynVal = variantToDynamicWithHook(
                                            static_cast<const nitro_ns::VariantType &>(kv.second),
                                            hook);
                                    if (containsColorInsensitive(kv.first)) {
                                        obj[kv.first] = hook(kv.first, dynVal);
                                    } else {
                                        obj[kv.first] = std::move(dynVal);
                                    }
                                }
                                return obj;
                            } else {
                                return folly::dynamic(nullptr);
                            }
                        },
                        var);
            }

            // Convert a single style entry (AnyMap) into an update object, applying color processing for string values on color keys
            folly::dynamic ShadowTreeUpdateManager::styleEntryToUpdate(Runtime &runtime,
                                                                       const nitro_ns::AnyMap &entry) {
                // Define a small key-aware transformer that applies string color processing when needed
                auto transform = [this, &runtime](const std::string &key,
                                                  const folly::dynamic &value) -> folly::dynamic {
                    if (!containsColorInsensitive(key)) return value;
                    return processColorDynamic(runtime, value);
                };

                folly::dynamic obj = folly::dynamic::object();
                const auto &map = entry.getMap();
                for (const auto &kv: map) {
                    const nitro_ns::VariantType &var = static_cast<const nitro_ns::VariantType &>(kv.second);
                    auto dynVal = variantToDynamicWithHook(var, transform);
                    if (containsColorInsensitive(kv.first)) {
                        obj[kv.first] = transform(kv.first, dynVal);
                    } else {
                        obj[kv.first] = std::move(dynVal);
                    }
                }
                return obj;
            }

            ShadowTreeUpdateManager::ShadowTreeUpdateManager() = default;

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
                    const std::vector<std::shared_ptr<nitro_ns::AnyMap>> &styleEntries) {
                auto it = component_links_.find(componentId);
                if (it == component_links_.end()) return;

                ComponentLink &link = it->second;
                if (link.runtime == nullptr) return;

                auto &obs = runtime_updates_[link.runtime];
                if (!obs) {
                    obs = Observable<UpdatesMap>::create(UpdatesMap{});
                }

                // Convert each style entry into a dynamic update object
                folly::dynamic payload = folly::dynamic::array();
                payload.reserve(styleEntries.size());
                for (const auto &p: styleEntries) {
                    if (!p) {
                        payload.push_back(folly::dynamic::object());
                        continue;
                    }
                    payload.push_back(styleEntryToUpdate(*link.runtime, *p));
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
                    auto holder = std::make_shared<RuntimeEffectHolder>();
                    holder->effect = std::make_shared<reactnativecss::Effect>(
                            [this, obs, rt, holder]() {
                                const UpdatesMap &updates = obs->get(*holder->effect);
                                if (updates.empty()) return;
                                applyUpdates(*rt, updates);
                                obs->set(UpdatesMap{});
                            });
                    holder->effect->run();
                    runtime_effects_.emplace(rt, std::move(holder));
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
                    return folly::dynamic(it->second);
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
                return folly::dynamic(processed);
            }

            void
            ShadowTreeUpdateManager::applyUpdates(Runtime &runtime, const UpdatesMap &updates) {
#if HAS_UIMANAGER_BINDING
                if (updates.empty()) return;
                auto binding = facebook::react::UIManagerBinding::getBinding(runtime);
                if (!binding) return;
                auto &uiManager = binding->getUIManager();
                uiManager.updateShadowTree(updates);
#else
                (void) runtime; (void) updates;
#endif
            }

        }
    }
} // namespace margelo::nitro::cssnitro
