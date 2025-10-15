#include "HybridStyleRegistry.hpp"
#include "Computed.hpp"
#include "Observable.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "StyledComputedFactory.hpp"
#include "Environment.hpp"
#include "VariableContext.hpp"

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

    // Initialize static members
    std::unique_ptr<ShadowTreeUpdateManager> HybridStyleRegistry::shadowUpdates_ =
            std::make_unique<ShadowTreeUpdateManager>();
    std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<Styled>>> HybridStyleRegistry::computedMap_;
    std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> HybridStyleRegistry::styleRuleMap_;

    // Constructor, Destructor, and Method Implementations
    HybridStyleRegistry::HybridStyleRegistry() : HybridObject("HybridStyleRegistry") {}

    HybridStyleRegistry::~HybridStyleRegistry() = default;

    void HybridStyleRegistry::setClassname(const std::string &className,
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

    void HybridStyleRegistry::addStyleSheet(const HybridStyleSheet &stylesheet) {
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

                    // Call setClassname with a vector containing the single styleRule
                    setClassname(className, styleRule);
                }
            }
        });
    }

    void HybridStyleRegistry::setRootVariable(const std::string &name,
                                              const std::vector<HybridRootVariableRule> &value) {
        // Call setTopLevelVariable with key="root"
        VariableContext::setTopLevelVariable("root", name, value);
    }

    Declarations HybridStyleRegistry::getDeclarations(const std::string &componentId,
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
    HybridStyleRegistry::registerComponent(const std::string &componentId,
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

    void HybridStyleRegistry::deregisterComponent(const std::string &componentId) {
        auto it = computedMap_.find(componentId);
        if (it != computedMap_.end()) {
            if (it->second) {
                it->second->dispose();
            }
            computedMap_.erase(it);
        }
    }

    void HybridStyleRegistry::updateComponentState(const std::string &componentId,
                                                   UpdateComponentStateFns type) {
        // TODO: Implement this
    }

    void HybridStyleRegistry::unlinkComponent(const std::string &componentId) {
        shadowUpdates_->unlinkComponent(componentId);
    }

    void HybridStyleRegistry::setWindowDimensions(double width, double height, double scale,
                                                  double fontScale) {
        reactnativecss::env::setWindowDimensions(width, height, scale, fontScale);
    }

    jsi::Value
    HybridStyleRegistry::linkComponent(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                       const jsi::Value *args, size_t count) {
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

    jsi::Value
    HybridStyleRegistry::registerExternalMethods(jsi::Runtime &runtime, const jsi::Value &thisValue,
                                                 const jsi::Value *args, size_t count) {
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

    void HybridStyleRegistry::updateComponentInlineStyleKeys(
            const std::string &componentId,
            const std::vector<std::string> &inlineStyleKeys) {
        (void) componentId;
        (void) inlineStyleKeys;
        // TODO: Integrate with style computation/ShadowTreeUpdateManager if needed.
    }

} // namespace margelo::nitro::cssnitro
