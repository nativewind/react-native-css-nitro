#include "StyledComputedFactory.hpp"
#include "Styled+Equality.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "Rules.hpp"
#include "Helpers.hpp"
#include "StyleFunction.hpp"
#include "Specificity.hpp"

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

                        // Add all style rules to the collection
                        allStyleRules.insert(allStyleRules.end(), styleRules.begin(),
                                             styleRules.end());
                    }

                    // Sort all style rules by specificity (highest specificity first)
                    std::sort(allStyleRules.begin(), allStyleRules.end(),
                              [](const HybridStyleRule &a, const HybridStyleRule &b) {
                                  return Specificity::sort(a.s, b.s);
                              });

                    // Now process the sorted style rules
                    for (const HybridStyleRule &styleRule: allStyleRules) {
                        // Skip rule if its conditions are not valid
                        if (!Rules::testRule(styleRule, get, componentId, containerScope,
                                             validAttributeQueries)) {
                            continue;
                        }

                        if (styleRule.d.has_value()) {
                            const auto &declarations = styleRule.d.value();

                            // Check if this is an important rule (s[0] > 0)
                            const bool isImportant = std::get<0>(styleRule.s) > 0;

                            // Determine which maps to use based on importance
                            auto &targetStyles = isImportant ? mergedImportantStyles : mergedStyles;
                            auto &targetProps = isImportant ? mergedImportantProps : mergedProps;

                            // Process declarations using the helper function
                            StyledComputedFactory::processDeclarations(
                                    declarations, targetStyles, targetProps, get, variableScope);
                        }
                    }

                    // Convert and assign all maps using the helper function
                    if (!mergedStyles.empty()) {
                        next->style = StyledComputedFactory::convertToAnyMap(mergedStyles, true);
                    }

                    if (!mergedProps.empty()) {
                        next->props = StyledComputedFactory::convertToAnyMap(mergedProps, false);
                    }

                    if (!mergedImportantStyles.empty()) {
                        next->importantStyle = StyledComputedFactory::convertToAnyMap(
                                mergedImportantStyles, true);
                    }

                    if (!mergedImportantProps.empty()) {
                        next->importantProps = StyledComputedFactory::convertToAnyMap(
                                mergedImportantProps, false);
                    }

                    // Only perform these actions if this is a recompute (prev exists)
                    if (prev != nullptr) {
                        // Check if we should rerender before deleting prev
                        if (shouldRerender(*next)) {
                            (void) rerender();
                        }

                        // Notify ShadowTreeUpdateManager of style changes in a batch
                        reactnativecss::Effect::batch([&]() {
                            if (next->style.has_value()) {
                                shadowUpdatesPtr->addUpdates(componentId, next->style.value());
                            }
                            if (next->importantStyle.has_value()) {
                                shadowUpdatesPtr->addUpdates(componentId,
                                                             next->importantStyle.value());
                            }
                        });

                        // Now safe to delete prev
                        delete prev;
                    }

                    return next;
                },
                nullptr);

        return computed;
    }

    bool shouldRerender(const Styled &styled) {
        // Check if props has a value - if it does, we should rerender
        return styled.props.has_value();
    }

    void StyledComputedFactory::processDeclarations(
            const auto &declarations,
            std::unordered_map<std::string, AnyValue> &targetStyles,
            std::unordered_map<std::string, AnyValue> &targetProps,
            reactnativecss::Effect::GetProxy &get,
            const std::string &variableScope) {

        std::visit([&targetStyles, &targetProps, &get, &variableScope](const auto &decl) {
            // decl is a tuple, get the first element (the styles)
            const auto &dStyles = std::get<0>(decl);

            // Check if dStyles is valid before accessing
            if (dStyles) {
                for (const auto &kv: dStyles->getMap()) {
                    // Only set if key doesn't already exist
                    if (targetStyles.count(kv.first) == 0) {
                        // if kv.second is an array with "fn" as the first key, resolve it
                        if (dStyles->isArray(kv.first)) {
                            const auto &arr = dStyles->getArray(kv.first);
                            if (!arr.empty() &&
                                std::holds_alternative<std::string>(arr[0]) &&
                                std::get<std::string>(arr[0]) == "fn") {
                                auto result = StyleFunction::resolveStyleFn(
                                        arr, get, variableScope);

                                // Skip if resolveStyleFn returns nullptr
                                if (std::holds_alternative<std::monostate>(result)) {
                                    return;
                                }

                                targetStyles[kv.first] = result;
                                return;
                            }
                        }
                        targetStyles[kv.first] = kv.second;
                    }
                }
            }

            // Check if there's a second element in the tuple (props)
            if constexpr (std::tuple_size<std::decay_t<decltype(decl)>>::value > 1) {
                const auto &dPropsOpt = std::get<1>(decl);

                // dPropsOpt is optional, check if it has a value
                if (dPropsOpt.has_value()) {
                    const auto &dProps = dPropsOpt.value();

                    // Check if dProps is valid before accessing
                    if (dProps) {
                        for (const auto &kv: dProps->getMap()) {
                            // Only set if key doesn't already exist
                            if (targetProps.count(kv.first) == 0) {
                                // if kv.second is an array with "fn" as the first key, resolve it
                                if (dProps->isArray(kv.first)) {
                                    const auto &arr = dProps->getArray(kv.first);
                                    if (!arr.empty() &&
                                        std::holds_alternative<std::string>(arr[0]) &&
                                        std::get<std::string>(arr[0]) == "fn") {
                                        auto result = StyleFunction::resolveStyleFn(
                                                arr, get, variableScope);

                                        // Skip if resolveStyleFn returns nullptr
                                        if (std::holds_alternative<std::monostate>(result)) {
                                            continue;
                                        }

                                        targetProps[kv.first] = result;
                                        continue;
                                    }
                                }
                                targetProps[kv.first] = kv.second;
                            }
                        }
                    }
                }
            }
        }, declarations);
    }


    std::shared_ptr<AnyMap> StyledComputedFactory::convertToAnyMap(
            const std::unordered_map<std::string, AnyValue> &mergedMap,
            bool applyTransformMapping) {
        auto anyMap = AnyMap::make(mergedMap.size());

        if (applyTransformMapping) {
            static const std::unordered_set<std::string> transformProps = {
                    "translateX", "translateY", "translateZ",
                    "rotate", "rotateX", "rotateY", "rotateZ",
                    "scaleX", "scaleY", "scaleZ",
                    "skewX", "skewY",
                    "perspective"
            };

            for (const auto &kv: mergedMap) {
                if (transformProps.count(kv.first) > 0) {
                    AnyArray transformArray;

                    // Get existing transform array if it exists
                    if (anyMap->contains("transform")) {
                        transformArray = anyMap->getArray("transform");
                    }

                    // find the value in the array with the key matching kv.first and set it to kv.second
                    bool foundTransform = false;
                    for (size_t i = 0; i < transformArray.size(); i++) {
                        if (std::holds_alternative<AnyObject>(transformArray[i])) {
                            auto obj = std::get<AnyObject>(transformArray[i]);
                            if (obj.count(kv.first) > 0) {
                                obj[kv.first] = kv.second;
                                transformArray[i] = obj;
                                foundTransform = true;
                                break;
                            }
                        }
                    }

                    // If transform property not found in array, add a new transform object
                    if (!foundTransform) {
                        AnyObject transformObj;
                        transformObj[kv.first] = kv.second;
                        transformArray.emplace_back(transformObj);
                    }

                    anyMap->setArray("transform", transformArray);
                    continue;
                }

                anyMap->setAny(kv.first, kv.second);
            }
        } else {
            for (const auto &kv: mergedMap) {
                anyMap->setAny(kv.first, kv.second);
            }
        }

        return anyMap;
    }


} // namespace margelo::nitro::cssnitro
