#include "HybridStyleRegistry.hpp"
#include "Computed.hpp"
#include "Observable.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "StyledComputedFactory.hpp"
#include "Environment.hpp"

#include <regex>
#include <string>
#include <variant>
#include <vector>
#include <optional>
#include <unordered_map>
#include <mutex>

// New: dynamic payloads (now handled by ShadowTreeUpdateManager)
#include <folly/dynamic.h>

// React Tag
#include <react/renderer/core/ReactPrimitives.h> // facebook::react::Tag


namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;

    struct HybridStyleRegistry::Impl {
        Impl();

        void set(const std::string &className, const std::vector<HybridStyleRule> &styleRule);

        void addStyleSheet(const HybridStyleSheet &stylesheet);

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

        jsi::Value registerExternalMethods(jsi::Runtime &runtime,
                                           const jsi::Value &thisValue,
                                           const jsi::Value *args, size_t count);

        void setWindowDimensions(double width, double height, double scale, double fontScale);

    private:
        // Per-component link info and update source
        struct ComponentLink {
            facebook::react::Tag tag{0};
            jsi::Runtime *runtime{nullptr};
            std::shared_ptr<reactnativecss::Observable<folly::dynamic>> updates;
        };

        std::unordered_map<std::string, ComponentLink> component_linking_;
        using UpdatesMap = std::unordered_map<facebook::react::Tag, folly::dynamic>;
        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Observable<UpdatesMap>>> runtime_updates_;
        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Computed<bool>>> runtime_effects_;

    public:
        static std::once_flag flag_;
        static std::shared_ptr<Impl> inst_;

        static std::shared_ptr<Impl> get();

    private:
        std::unique_ptr<ShadowTreeUpdateManager> shadowUpdates_;
        std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<Styled>>> computedMap_;
        std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> styleRuleMap_;
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

    void HybridStyleRegistry::set(const std::string &className,
                                  const std::vector<HybridStyleRule> &styleRule) {
        impl_->set(className, styleRule);
    }

    void HybridStyleRegistry::addStyleSheet(const HybridStyleSheet &stylesheet) {
        impl_->addStyleSheet(stylesheet);
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

    void HybridStyleRegistry::setWindowDimensions(double width, double height, double scale,
                                                  double fontScale) {
        impl_->setWindowDimensions(width, height, scale, fontScale);
    }

    jsi::Value
    HybridStyleRegistry::linkComponent(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                       const jsi::Value *args, size_t count) {
        return impl_->linkComponent(runtime, thisValue, args, count);
    }

    jsi::Value
    HybridStyleRegistry::registerExternalMethods(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                                 const jsi::Value *args, size_t count) {
        return impl_->registerExternalMethods(runtime, thisValue, args, count);
    }

    void HybridStyleRegistry::loadHybridMethods() {
        HybridStyleRegistrySpec::loadHybridMethods();
        registerHybrids(this, [](Prototype &prototype) {
            prototype.registerRawHybridMethod(
                    "linkComponent",
                    2,
                    &HybridStyleRegistry::linkComponent);

            prototype.registerRawHybridMethod(
                    "registerExternalMethods",
                    1,
                    &HybridStyleRegistry::registerExternalMethods);
        });
    }

    // PIMPL Method Implementations

    HybridStyleRegistry::Impl::Impl() {
        shadowUpdates_ = std::make_unique<ShadowTreeUpdateManager>();
    }

    void HybridStyleRegistry::Impl::set(const std::string &className,
                                        const std::vector<HybridStyleRule> &styleRules) {
        // Reverse the style rules, this way later on we can bail early if values are already set
        auto reversedRules = styleRules;
        std::reverse(reversedRules.begin(), reversedRules.end());

        auto it = styleRuleMap_.find(className);
        if (it == styleRuleMap_.end()) {
            auto observable = reactnativecss::Observable<std::vector<HybridStyleRule>>::create(
                    reversedRules);
            styleRuleMap_.emplace(className, std::move(observable));
        } else if (it->second) {
            it->second->set(reversedRules);
        }
    }

    void HybridStyleRegistry::Impl::addStyleSheet(const HybridStyleSheet &stylesheet) {
        // Create an Effect batch to process all style updates together
        reactnativecss::Effect::batch([this, &stylesheet]() {
            // If the key "s" exists, loop over every entry
            if (stylesheet.s.has_value()) {
                const auto &styles = stylesheet.s.value();
                for (const auto &entry: styles) {
                    // entry is a tuple<string, HybridStyleRule>
                    // entry[0] is the className, entry[1] is the styleRule
                    const std::string &className = std::get<0>(entry);
                    const std::vector<HybridStyleRule> &styleRule = std::get<1>(entry);

                    // Call set with a vector containing the single styleRule
                    set(className, styleRule);
                }
            }
        });
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

            const std::vector<HybridStyleRule> &styleRules = styleIt->second->get();
            bool hasVars = false;
            for (const auto &sr: styleRules) {
                if (sr.v.has_value()) {
                    hasVars = true;
                    break;
                }
            }
            if (hasVars) {
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

        // Build computed Styled via factory
        auto computed = ::margelo::nitro::cssnitro::makeStyledComputed(styleRuleMap_, classNames,
                                                                       componentId,
                                                                       *shadowUpdates_);

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

    void HybridStyleRegistry::Impl::setWindowDimensions(double width, double height, double scale,
                                                        double fontScale) {
        reactnativecss::env::setWindowDimensions(width, height, scale, fontScale);
    }

    jsi::Value HybridStyleRegistry::Impl::registerExternalMethods(
            jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args,
            size_t count) {
        (void) thisValue;

        if (!args[0].isObject()) {
            return jsi::Value::undefined();
        }

        /** processColor **/
        auto maybeProcessColorFn = args[0].asObject(runtime).getProperty(runtime, "processColor");
        jsi::Function processColorFn = maybeProcessColorFn.asObject(runtime).asFunction(runtime);

        shadowUpdates_->registerProcessColorFunction(std::move(processColorFn));

        return jsi::Value::undefined();
    }

    void HybridStyleRegistry::updateComponentInlineStyleKeys(
            const std::string &componentId,
            const std::vector<std::string> &inlineStyleKeys) {
        (void) componentId;
        (void) inlineStyleKeys;
        // TODO: Integrate with style computation/ShadowTreeUpdateManager if needed.
    }

} // namespace margelo::nitro::cssnitro
