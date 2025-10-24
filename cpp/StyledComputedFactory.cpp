#include "StyledComputedFactory.hpp"
#include "Styled+Equality.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "Rules.hpp"
#include "Helpers.hpp"
#include "StyleFunction.hpp"
#include "Specificity.hpp"
#include "StyleResolver.hpp"
#include "VariableContext.hpp"

#include <regex>
#include <variant>
#include <vector>
#include <string>
#include <algorithm>
#include <folly/dynamic.h>
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;


    std::shared_ptr<reactnativecss::Computed<Styled *>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            const std::function<void()> &rerender,
            ShadowTreeUpdateManager &shadowUpdates,
            const std::string &variableScope,
            const std::string &containerScope,
            const std::vector<std::string> &validAttributeQueries) {

        // Capture rerender by value (copy) so it persists through fast refresh
        // Capture shadowUpdates by pointer since it's a stable singleton
        auto shadowUpdatesPtr = &shadowUpdates;

        auto computed = reactnativecss::Computed<Styled *>::create(
                [&styleRuleMap, classNames, componentId, rerender, shadowUpdatesPtr, variableScope, containerScope, validAttributeQueries](
                        Styled *const &prev,
                        typename reactnativecss::Effect::GetProxy &get) {
                    Styled *next = new Styled{};
                    std::unordered_map<std::string, AnyValue> mergedStyles;
                    std::unordered_map<std::string, AnyValue> mergedProps;
                    std::unordered_map<std::string, AnyValue> mergedImportantStyles;
                    std::unordered_map<std::string, AnyValue> mergedImportantProps;

                    // Collect all style rules from all classNames
                    std::vector<HybridStyleRule> allStyleRules;

                    std::regex whitespace{"\\s+"};
                    std::sregex_token_iterator tokenIt(classNames.begin(), classNames.end(),
                                                       whitespace, -1);
                    std::sregex_token_iterator end;

                    for (; tokenIt != end; ++tokenIt) {
                        const std::string className = tokenIt->str();
                        if (className.empty()) {
                            continue;
                        }

                        auto styleIt = styleRuleMap.find(className);
                        if (styleIt == styleRuleMap.end() || !styleIt->second) {
                            continue;
                        }

                        const std::vector<HybridStyleRule> &styleRules = get(*styleIt->second);

                        // Add only style rules that pass the test
                        for (const HybridStyleRule &styleRule: styleRules) {
                            if (Rules::testRule(styleRule, get, componentId, containerScope,
                                                validAttributeQueries)) {
                                allStyleRules.push_back(styleRule);
                            }
                        }
                    }

                    // Sort all style rules by specificity (highest specificity first)
                    std::sort(allStyleRules.begin(), allStyleRules.end(),
                              [](const HybridStyleRule &a, const HybridStyleRule &b) {
                                  return Specificity::sort(a.s, b.s);
                              });

                    // Process the inline variables
                    for (const HybridStyleRule &styleRule: allStyleRules) {
                        if (styleRule.v.has_value()) {
                            const auto &inlineVariables = styleRule.v.value();
                            for (const auto &kv: inlineVariables->getMap()) {
                                VariableContext::setVariable(variableScope, kv.first, kv.second);
                            }
                        }

                    }

                    // Process the declarations and props
                    for (const HybridStyleRule &styleRule: allStyleRules) {
                        // Check if this is an important rule (s[0] > 0)
                        const bool isImportant = std::get<0>(styleRule.s) > 0;

                        // Process declarations (styles) from the "d" key
                        if (styleRule.d.has_value()) {
                            const auto &declarations = styleRule.d.value();
                            auto &targetStyles = isImportant ? mergedImportantStyles : mergedStyles;

                            StyledComputedFactory::processDeclarations(
                                    declarations, targetStyles, get, variableScope);
                        }

                        // Process props from the "p" key
                        if (styleRule.p.has_value()) {
                            const auto &props = styleRule.p.value();
                            auto &targetProps = isImportant ? mergedImportantProps : mergedProps;

                            StyledComputedFactory::processDeclarations(
                                    props, targetProps, get, variableScope);
                        }
                    }

                    // Convert and assign all maps using the helper function
                    if (!mergedStyles.empty()) {
                        next->style = StyledComputedFactory::convertToAnyMap(mergedStyles, true,
                                                                             variableScope, get);
                    }

                    if (!mergedProps.empty()) {
                        next->props = StyledComputedFactory::convertToAnyMap(mergedProps, false,
                                                                             variableScope, get);
                    }

                    if (!mergedImportantStyles.empty()) {
                        next->importantStyle = StyledComputedFactory::convertToAnyMap(
                                mergedImportantStyles, true, variableScope, get);
                    }

                    if (!mergedImportantProps.empty()) {
                        next->importantProps = StyledComputedFactory::convertToAnyMap(
                                mergedImportantProps, false, variableScope, get);
                    }

                    // Only perform these actions if this is a recompute (prev exists)
                    if (prev != nullptr) {
                        // Check if animations or transitions are present
                        bool hasAnimations = false;
                        if (next->style.has_value()) {
                            hasAnimations = next->style.value()->contains("animationName") ||
                                            next->style.value()->contains("transitionProperty");
                        }
                        if (!hasAnimations && next->importantStyle.has_value()) {
                            hasAnimations =
                                    next->importantStyle.value()->contains("animationName") ||
                                    next->importantStyle.value()->contains("transitionProperty");
                        }

                        // If animations/transitions are present, or props changed, we must rerender
                        if (hasAnimations || next->props.has_value() ||
                            next->importantProps.has_value()) {
                            (void) rerender();
                        } else {
                            // Only update shadow tree if no animations (shadow tree can't handle them)
                            reactnativecss::Effect::batch([&]() {
                                if (next->style.has_value()) {
                                    shadowUpdatesPtr->addUpdates(componentId, next->style.value());
                                }
                                if (next->importantStyle.has_value()) {
                                    shadowUpdatesPtr->addUpdates(componentId,
                                                                 next->importantStyle.value());
                                }
                            });
                        }

                        // Now safe to delete prev
                        delete prev;
                    }

                    return next;
                },
                nullptr);

        return computed;
    }

    void StyledComputedFactory::processDeclarations(
            const std::shared_ptr<AnyMap> &declarations,
            std::unordered_map<std::string, AnyValue> &targetMap,
            reactnativecss::Effect::GetProxy &get,
            const std::string &variableScope) {

        // declarations is a shared_ptr<AnyMap> containing the style or prop values
        if (!declarations) {
            return;
        }

        // Get the map of all key-value pairs from the AnyMap
        const auto &map = declarations->getMap();

        for (const auto &kv: map) {
            // Only set if key doesn't already exist
            if (targetMap.count(kv.first) == 0) {
                // Use StyleResolver to resolve the value (handles functions, variables, etc.)
                auto resolvedValue = StyleResolver::resolveStyle(kv.second, variableScope, get);

                // Skip if resolveStyle returns monostate (unresolved)
                if (std::holds_alternative<std::monostate>(resolvedValue)) {
                    continue;
                }

                targetMap[kv.first] = resolvedValue;
            }
        }
    }


    std::shared_ptr<AnyMap> StyledComputedFactory::convertToAnyMap(
            const std::unordered_map<std::string, AnyValue> &mergedMap,
            bool applyStyleMapping,
            const std::string &variableScope,
            reactnativecss::Effect::GetProxy &get) {
        if (applyStyleMapping) {
            // Use StyleResolver's helper function to apply style mapping
            return StyleResolver::applyStyleMapping(mergedMap, variableScope, get);
        } else {
            // For props, just copy all values directly without transform mapping
            auto anyMap = AnyMap::make(mergedMap.size());
            for (const auto &kv: mergedMap) {
                anyMap->setAny(kv.first, kv.second);
            }
            return anyMap;
        }
    }


} // namespace margelo::nitro::cssnitro
