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

    std::shared_ptr<reactnativecss::Computed<Styled>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            const std::function<void()> &rerender,
            ShadowTreeUpdateManager &shadowUpdates,
            const std::string &variableScope,
            const std::string &containerScope,
            const std::vector<std::string> &validAttributeQueries) {
        auto computed = reactnativecss::Computed<Styled>::create(
                [&styleRuleMap, classNames, componentId, &rerender, &shadowUpdates, variableScope, containerScope, validAttributeQueries](
                        const Styled &prev,
                        typename reactnativecss::Effect::GetProxy &get) {
                    (void) prev;

                    Styled next{};
                    /**
                     * Ideally this should an AnyMap, but settings values on an AnyMap doesn't work?
                     * So we use an unordered_map and convert it to AnyMap at the end.
                     */
                    std::unordered_map<std::string, AnyValue> mergedStyles;
                    std::unordered_map<std::string, AnyValue> mergedProps;

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

                            // declarations is a variant that can hold either:
                            // - tuple with 1 item (single declaration)
                            // - tuple with 2 items (multiple declarations)
                            // We use std::visit to safely access it
                            std::visit([&mergedStyles, &mergedProps, &get, &variableScope](
                                    const auto &decl) {
                                // decl is a tuple, get the first element (the styles)
                                const auto &dStyles = std::get<0>(decl);

                                // Check if dStyles is valid before accessing
                                if (dStyles) {
                                    for (const auto &kv: dStyles->getMap()) {
                                        // Only set if key doesn't already exist
                                        if (mergedStyles.count(kv.first) == 0) {
                                            // if kv.second is an array with "fn" as the first key, resolve it
                                            if (dStyles->isArray(kv.first)) {
                                                const auto &arr = dStyles->getArray(kv.first);
                                                if (!arr.empty() &&
                                                    std::holds_alternative<std::string>(
                                                            arr[0]) &&
                                                    std::get<std::string>(arr[0]) == "fn") {
                                                    auto result = StyleFunction::resolveStyleFn(
                                                            arr, get, variableScope);

                                                    // Skip if resolveStyleFn returns nullptr
                                                    if (std::holds_alternative<std::monostate>(
                                                            result)) {
                                                        return;
                                                    }

                                                    mergedStyles[kv.first] = result;
                                                    return;
                                                }
                                            }
                                            mergedStyles[kv.first] = kv.second;
                                        }
                                    }
                                }

                                // Check if there's a second element in the tuple (props)
                                if constexpr (std::tuple_size<std::decay_t<decltype(decl)>>::value >
                                              1) {
                                    const auto &dPropsOpt = std::get<1>(decl);

                                    // dPropsOpt is optional, check if it has a value
                                    if (dPropsOpt.has_value()) {
                                        const auto &dProps = dPropsOpt.value();

                                        // Check if dProps is valid before accessing
                                        if (dProps) {
                                            for (const auto &kv: dProps->getMap()) {
                                                // Only set if key doesn't already exist
                                                if (mergedProps.count(kv.first) == 0) {
                                                    // if kv.second is an array with "fn" as the first key, resolve it
                                                    if (dProps->isArray(kv.first)) {
                                                        const auto &arr = dProps->getArray(
                                                                kv.first);
                                                        if (!arr.empty() &&
                                                            std::holds_alternative<std::string>(
                                                                    arr[0]) &&
                                                            std::get<std::string>(arr[0]) == "fn") {
                                                            auto result = StyleFunction::resolveStyleFn(
                                                                    arr, get, variableScope);

                                                            // Skip if resolveStyleFn returns nullptr
                                                            if (std::holds_alternative<std::monostate>(
                                                                    result)) {
                                                                continue;
                                                            }

                                                            mergedProps[kv.first] = result;
                                                            continue;
                                                        }
                                                    }
                                                    mergedProps[kv.first] = kv.second;
                                                }
                                            }
                                        }
                                    }
                                }
                            }, declarations);
                        }
                    }

                    // Convert mergedStyles to AnyMap and set next.style
                    if (!mergedStyles.empty()) {
                        auto anyMap = AnyMap::make(mergedStyles.size());

                        static const std::unordered_set<std::string> transformProps = {
                                "translateX", "translateY", "translateZ",
                                "rotate", "rotateX", "rotateY", "rotateZ",
                                "scaleX", "scaleY", "scaleZ",
                                "skewX", "skewY",
                                "perspective"
                        };

                        for (const auto &kv: mergedStyles) {
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
                        next.style = anyMap;
                    }

                    // Convert mergedProps to AnyMap and set next.props
                    if (!mergedProps.empty()) {
                        auto anyMap = AnyMap::make(mergedProps.size());

                        for (const auto &kv: mergedProps) {
                            anyMap->setAny(kv.first, kv.second);
                        }
                        next.props = anyMap;
                    }

                    if (shouldRerender(next)) {
                        (void) rerender();
                    }

                    if (next.style.has_value()) {
                        // Notify ShadowTreeUpdateManager with the resolved style
                        shadowUpdates.addUpdates(componentId, next.style.value());
                    }

                    return next;
                },
                Styled{});

        return computed;
    }

    bool shouldRerender(const Styled &styled) {
        // Check if props has a value - if it does, we should rerender
        return styled.props.has_value();
    }

} // namespace margelo::nitro::cssnitro
