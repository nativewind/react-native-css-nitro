#include "HybridStyleRegistry.hpp"
#include "Computed.hpp"
#include "Observable.hpp"
#include "ShadowTreeUpdateManager.hpp"

#include <regex>
#include <string>
#include <variant>
#include <vector>
#include <optional>
#include <unordered_map>
#include <mutex>

// New: dynamic payloads (now handled by ShadowTreeUpdateManager)
#include <folly/dynamic.h>

// React Tag and optional UIManagerBinding (guarded)
#include <react/renderer/core/ReactPrimitives.h> // facebook::react::Tag

#if __has_include(<react/renderer/uimanager/UIManagerBinding.h>)

#include <react/renderer/uimanager/UIManagerBinding.h>

#define HAS_UIMANAGER_BINDING 1
#else
#define HAS_UIMANAGER_BINDING 0
#endif

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;

    struct HybridStyleRegistry::Impl {
        Impl();

        void set(const std::string &className, const StyleRule &styleRule);

        Declarations
        getDeclarations(const std::string &componentId, const std::string &classNames,
                        const std::string &variableScope, const std::string &containerScope);

        Styled
        registerComponent(const std::string &componentId, const std::function<void()> &rerender,
                          const std::string &classNames, const std::string &variableScope,
                          const std::string &containerScope);

        void deregisterComponent(const std::string &componentId);

        void updateComponentState(const std::string &componentId, UpdateComponentStateFns type);

        jsi::Value linkComponent(jsi::Runtime &runtime,
                                 const jsi::Value &thisValue,
                                 const jsi::Value *args, size_t count);

        void unlinkComponent(const std::string &componentId);

    private:
        // Per-component link info and update source
        struct ComponentLink {
            facebook::react::Tag tag{0};
            jsi::Runtime *runtime{nullptr};
            std::shared_ptr<reactnativecss::Observable<folly::dynamic>> updates;
        };
        // componentId -> {tag, runtime*, updates-observable}
        std::unordered_map<std::string, ComponentLink> component_linking_;

        // Per-runtime updates observable: Tag -> payload
        using UpdatesMap = std::unordered_map<facebook::react::Tag, folly::dynamic>;
        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Observable<UpdatesMap>>> runtime_updates_;
        // Per-runtime effect (kept alive)
        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Computed<bool>>> runtime_effects_;

        void ensureRuntimeEffect(jsi::Runtime &runtime);

        void applyUpdates(jsi::Runtime &runtime, const UpdatesMap &updates);

        void addUpdates(const std::string &componentId, const folly::dynamic &payload);

    public:
        static std::once_flag flag_;
        static std::shared_ptr<Impl> inst_;

        static std::shared_ptr<Impl> get();

        // Manager that owns per-runtime effects and updates batching
        std::unique_ptr<ShadowTreeUpdateManager> shadowUpdates_;

        std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<Styled>>> computedMap_;
        std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<StyleRule>>> styleRuleMap_;
    };


    // Storage for static members
    std::once_flag HybridStyleRegistry::Impl::flag_;
    std::shared_ptr<HybridStyleRegistry::Impl> HybridStyleRegistry::Impl::inst_;

    std::shared_ptr<HybridStyleRegistry::Impl> HybridStyleRegistry::Impl::get() {
        std::call_once(flag_, [] { inst_ = std::make_shared<Impl>(); });
        return inst_;
    }

    // Constructor, Destructor, and Method Implementations
    HybridStyleRegistry::HybridStyleRegistry() : HybridObject("HybridStyleRegistry"),
                                                 impl_(Impl::get()) {}

    HybridStyleRegistry::~HybridStyleRegistry() = default;

    void HybridStyleRegistry::set(const std::string &className, const StyleRule &styleRule) {
        impl_->set(className, styleRule);
    }

    Declarations HybridStyleRegistry::getDeclarations(const std::string &componentId,
                                                      const std::string &classNames,
                                                      const std::string &variableScope,
                                                      const std::string &containerScope) {
        return impl_->getDeclarations(componentId, classNames, variableScope, containerScope);
    }

    Styled HybridStyleRegistry::registerComponent(const std::string &componentId,
                                                  const std::function<void()> &rerender,
                                                  const std::string &classNames,
                                                  const std::string &variableScope,
                                                  const std::string &containerScope) {
        return impl_->registerComponent(componentId, rerender, classNames, variableScope,
                                        containerScope);
    }

    void HybridStyleRegistry::deregisterComponent(const std::string &componentId) {
        impl_->deregisterComponent(componentId);
    }

    void HybridStyleRegistry::updateComponentState(const std::string &componentId,
                                                   UpdateComponentStateFns type) {
        impl_->updateComponentState(componentId, type);
    }

    void HybridStyleRegistry::unlinkComponent(const std::string &componentId) {
        impl_->unlinkComponent(componentId);
    }

    jsi::Value
    HybridStyleRegistry::linkComponent(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                       const jsi::Value *args, size_t count) {
        return impl_->linkComponent(runtime, thisValue, args, count);
    }

    void HybridStyleRegistry::loadHybridMethods() {
        HybridStyleRegistrySpec::loadHybridMethods();
        registerHybrids(this, [](Prototype &prototype) {
            prototype.registerRawHybridMethod(
                    "linkComponent",
                    2,
                    &HybridStyleRegistry::linkComponent);
        });
    }

    // PIMPL Method Implementations

    HybridStyleRegistry::Impl::Impl() {
        shadowUpdates_ = std::make_unique<ShadowTreeUpdateManager>();
    }

    void HybridStyleRegistry::Impl::set(const std::string &className,
                                        const StyleRule &styleRule) {
        auto it = styleRuleMap_.find(className);
        if (it == styleRuleMap_.end()) {
            auto observable = reactnativecss::Observable<StyleRule>::create(styleRule);
            styleRuleMap_.emplace(className, std::move(observable));
        } else if (it->second) {
            it->second->set(styleRule);
        }
    }


    Declarations HybridStyleRegistry::Impl::getDeclarations(const std::string &componentId,
                                                            const std::string &classNames,
                                                            const std::string &variableScope,
                                                            const std::string &containerScope) {
        Declarations declarations;
        declarations.classNames = classNames;
        declarations.variableScope = variableScope;

        std::regex whitespace{"\\s+"};
        std::sregex_token_iterator tokenIt(classNames.begin(), classNames.end(), whitespace, -1);
        std::sregex_token_iterator end;

        for (; tokenIt != end; ++tokenIt) {
            const std::string className = tokenIt->str();
            if (className.empty()) {
                continue;
            }

            auto styleIt = styleRuleMap_.find(className);
            if (styleIt == styleRuleMap_.end() || !styleIt->second) {
                continue;
            }

            const StyleRule &styleRule = styleIt->second->get();
            if (styleRule.v.has_value()) {
                declarations.variableScope = componentId;
                break;
            }
        }

        return declarations;
    }

    Styled
    HybridStyleRegistry::Impl::registerComponent(const std::string &componentId,
                                                 const std::function<void()> &rerender,
                                                 const std::string &classNames,
                                                 const std::string &variableScope,
                                                 const std::string &containerScope) {
        if (auto existing = computedMap_.find(componentId); existing != computedMap_.end()) {
            if (existing->second) {
                existing->second->dispose();
            }
            computedMap_.erase(existing);
        }

        (void) rerender;

        auto computed = reactnativecss::Computed<Styled>::create(
                [this, classNames](const Styled &prev,
                                   typename reactnativecss::Computed<Styled>::GetProxy &get) {
                    (void) prev;

                    Styled next{};
                    std::vector<std::shared_ptr<AnyMap>> styleEntries;

                    std::regex whitespace{"\\s+"};
                    std::sregex_token_iterator tokenIt(classNames.begin(), classNames.end(),
                                                       whitespace, -1);
                    std::sregex_token_iterator end;

                    for (; tokenIt != end; ++tokenIt) {
                        const std::string className = tokenIt->str();
                        if (className.empty()) {
                            continue;
                        }

                        auto styleIt = styleRuleMap_.find(className);
                        if (styleIt == styleRuleMap_.end() || !styleIt->second) {
                            continue;
                        }

                        const StyleRule &styleRule = get(*styleIt->second);

                        if (styleRule.d.has_value()) {
                            std::vector<std::variant<std::shared_ptr<AnyMap>, std::vector<std::shared_ptr<AnyMap>>>> stack(
                                    styleRule.d->begin(), styleRule.d->end());

                            while (!stack.empty()) {
                                auto current = std::move(stack.back());
                                stack.pop_back();

                                std::visit(
                                        [&stack, &styleEntries](auto &&value) {
                                            using ValueType = std::decay_t<decltype(value)>;

                                            if constexpr (std::is_same_v<ValueType, std::shared_ptr<AnyMap>>) {
                                                if (value) {
                                                    styleEntries.push_back(value);
                                                }
                                            } else if constexpr (std::is_same_v<ValueType, std::vector<std::shared_ptr<AnyMap>>>) {
                                                for (const auto &nested: value) {
                                                    if (nested) {
                                                        stack.emplace_back(nested);
                                                    }
                                                }
                                            }
                                        },
                                        current);
                            }
                        }
                    }

                    if (!styleEntries.empty()) {
                        next.style = std::move(styleEntries);
                    }

                    return next;
                },
                Styled{}
        );

        computedMap_[componentId] = computed;

        return computed->get();
    }

    void HybridStyleRegistry::Impl::deregisterComponent(const std::string &componentId) {
        auto it = computedMap_.find(componentId);
        if (it != computedMap_.end()) {
            if (it->second) {
                it->second->dispose();
            }
            computedMap_.erase(it);
        }
    }

    void HybridStyleRegistry::Impl::updateComponentState(const std::string &componentId,
                                                         UpdateComponentStateFns type) {
        // TODO: Implement this
    }


    jsi::Value HybridStyleRegistry::Impl::linkComponent(
            jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args,
            size_t count) {
        (void) thisValue;
        if (count < 2) {
            return jsi::Value::undefined();
        }
        // args: [componentId: string, tag: number]
        if (!args[0].isString() || !args[1].isNumber()) {
            return jsi::Value::undefined();
        }
        std::string componentId = args[0].getString(runtime).utf8(runtime);
        auto tagValue = static_cast<facebook::react::Tag>(static_cast<int64_t>(args[1].getNumber()));

        shadowUpdates_->linkComponent(runtime, componentId, tagValue);

        return jsi::Value::undefined();
    }

    void HybridStyleRegistry::Impl::unlinkComponent(const std::string &componentId) {
        shadowUpdates_->unlinkComponent(componentId);
    }

    // Update application is handled by ShadowTreeUpdateManager.

    void HybridStyleRegistry::updateComponentInlineStyleKeys(
            const std::string &componentId,
            const std::vector<std::string> &inlineStyleKeys) {
        (void) componentId;
        (void) inlineStyleKeys;
        // TODO: Integrate with style computation/ShadowTreeUpdateManager if needed.
    }

} // namespace margelo::nitro::cssnitro
