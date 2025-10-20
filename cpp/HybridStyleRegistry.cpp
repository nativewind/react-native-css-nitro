#include "HybridStyleRegistry.hpp"
#include "Computed.hpp"
#include "ContainerContext.hpp"
#include "Observable.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "StyledComputedFactory.hpp"
#include "Environment.hpp"
#include "VariableContext.hpp"
#include "PseudoClasses.hpp"
#include "JSLogger.hpp"

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
    std::unordered_map<std::string, HybridStyleRegistry::ComputedEntry> HybridStyleRegistry::computedMap_;
    std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> HybridStyleRegistry::styleRuleMap_;
    std::atomic<uint64_t> HybridStyleRegistry::nextStyleRuleId_{1};

    // Constructor, Destructor, and Method Implementations
    HybridStyleRegistry::HybridStyleRegistry() : HybridObject("HybridStyleRegistry") {}

    HybridStyleRegistry::~HybridStyleRegistry() = default;

    void HybridStyleRegistry::setClassname(const std::string &className,
                                           const std::vector<HybridStyleRule> &styleRules) {
        // Create a copy of the style rules to modify them
        auto rulesWithIds = styleRules;

        // Assign unique IDs to any rules that don't have one
        for (auto &rule: rulesWithIds) {
            if (!rule.id.has_value()) {
                rule.id = std::to_string(nextStyleRuleId_++);
            }
        }

        // Reverse the style rules, this way later on we can bail early if values are already set
        auto reversedRules = rulesWithIds;
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

    void HybridStyleRegistry::setRootVariables(const std::shared_ptr<AnyMap> &variables) {

        // Loop over all entries in the AnyMap
        for (const auto &entry: variables->getMap()) {
            const std::string &key = entry.first;
            const AnyValue &value = entry.second;

            // Call setTopLevelVariable with key="root"
            VariableContext::setTopLevelVariable("root", key, value);
        }
    }

    void HybridStyleRegistry::setUniversalVariables(const std::shared_ptr<AnyMap> &variables) {

        // Loop over all entries in the AnyMap
        for (const auto &entry: variables->getMap()) {
            const std::string &key = entry.first;
            const AnyValue &value = entry.second;

            // Call setTopLevelVariable with key="universal"
            VariableContext::setTopLevelVariable("universal", key, value);
        }
    }

    Declarations HybridStyleRegistry::getDeclarations(const std::string &componentId,
                                                      const std::string &classNames,
                                                      const std::string &variableScope,
                                                      const std::string &containerScope) {
        Declarations declarations;
        declarations.variableScope = variableScope;

        std::regex whitespace{"\\s+"};
        std::sregex_token_iterator tokenIt(classNames.begin(), classNames.end(), whitespace, -1);
        std::sregex_token_iterator end;

        std::vector<std::tuple<std::string, AttributeQuery>> attributeQueriesVec;

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
                // Check for attribute queries
                if (sr.aq.has_value() && sr.id.has_value()) {
                    // The style rule id is already a string
                    attributeQueriesVec.emplace_back(sr.id.value(), sr.aq.value());
                }

                // Check for variables
                if (sr.v.has_value()) {
                    hasVars = true;
                }

                // Check for pseudo-classes
                if (sr.p.has_value()) {
                    const auto &pseudoClass = sr.p.value();

                    // Check if active pseudo-class is set
                    if (pseudoClass.a.has_value()) {
                        declarations.active = true;
                    }

                    // Check if hover pseudo-class is set
                    if (pseudoClass.h.has_value()) {
                        declarations.hover = true;
                    }

                    // Check if focus pseudo-class is set
                    if (pseudoClass.f.has_value()) {
                        declarations.focus = true;
                    }
                }
            }
            if (hasVars) {
                declarations.variableScope = componentId;
            }
        }

        // Set attributeQueries if we found any
        if (!attributeQueriesVec.empty()) {
            declarations.attributeQueries = std::move(attributeQueriesVec);
        }

        return declarations;
    }

    Styled
    HybridStyleRegistry::registerComponent(const std::string &componentId,
                                           const std::function<void()> &rerender,
                                           const std::string &classNames,
                                           const std::string &variableScope,
                                           const std::string &containerScope,
                                           const std::vector<std::string> &validAttributeQueries) {
        // Check if an entry exists for this component
        auto existing = computedMap_.find(componentId);

        // Only recreate computed if parameters have changed or it doesn't exist
        bool shouldRecreate = false;
        if (existing == computedMap_.end()) {
            shouldRecreate = true;
        } else {
            // Check if any of the parameters have changed
            const auto &entry = existing->second;
            if (entry.classNames != classNames ||
                entry.variableScope != variableScope ||
                entry.containerScope != containerScope) {
                shouldRecreate = true;
            }
        }

        std::shared_ptr<reactnativecss::Computed<Styled *>> computed;

        if (shouldRecreate) {
            // Dispose old computed if it exists
            if (existing != computedMap_.end() && existing->second.computed) {
                existing->second.computed->dispose();
            }

            // Build new computed Styled via factory
            computed = ::margelo::nitro::cssnitro::makeStyledComputed(styleRuleMap_, classNames,
                                                                      componentId,
                                                                      rerender,
                                                                      *shadowUpdates_,
                                                                      variableScope,
                                                                      containerScope,
                                                                      validAttributeQueries);

            // Store the new computed with its parameters
            computedMap_[componentId] = ComputedEntry{
                    computed,
                    classNames,
                    variableScope,
                    containerScope
            };
        } else {
            // Reuse existing computed
            computed = existing->second.computed;
        }

        // Get the value from computed - it's a Styled* that may be nullptr
        Styled *styledPtr = computed->get();

        // If nullptr, return empty Styled{}
        if (styledPtr == nullptr) {
            return Styled{};
        }

        // Otherwise dereference and return the value
        return *styledPtr;
    }

    void HybridStyleRegistry::deregisterComponent(const std::string &componentId) {
        auto it = computedMap_.find(componentId);
        if (it != computedMap_.end()) {
            if (it->second.computed) {
                it->second.computed->dispose();
            }
            computedMap_.erase(it);
        }
    }

    void HybridStyleRegistry::updateComponentState(const std::string &componentId,
                                                   PseudoClassType type, bool value) {
        PseudoClasses::set(componentId, type, value);
    }

    void HybridStyleRegistry::updateComponentLayout(const std::string &componentId,
                                                    const margelo::nitro::cssnitro::LayoutRectangle &value) {

        ContainerContext::setLayout(componentId, value.x, value.y, value.width, value.height);
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

        // Initialize JSLogger on first call with runtime access
        static bool jsLoggerInitialized = false;
        if (!jsLoggerInitialized) {
            JSLogger::initialize(runtime);
            jsLoggerInitialized = true;

        }

        if (!args[0].isObject()) {
            return jsi::Value::undefined();
        }

        /** processColor **/
        auto maybeProcessColorFn = args[0].asObject(runtime).getProperty(runtime, "processColor");
        jsi::Function processColorFn = maybeProcessColorFn.asObject(runtime).asFunction(runtime);

        shadowUpdates_->registerProcessColorFunction(std::move(processColorFn));
        JSLOGD("processColor was registered in HybridStyleRegistry");

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
