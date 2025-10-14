#include "StyledComputedFactory.hpp"
#include "Styled+Equality.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "Rules.hpp"
#include "Helpers.hpp"

#include <regex>
#include <variant>
#include <vector>
#include <string>
#include <folly/dynamic.h>
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;

    std::shared_ptr<reactnativecss::Computed<Styled>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            ShadowTreeUpdateManager &shadowUpdates) {
        auto computed = reactnativecss::Computed<Styled>::create(
                [&styleRuleMap, classNames, componentId, &shadowUpdates](const Styled &prev,
                                                                         typename reactnativecss::Effect::GetProxy &get) {
                    (void) prev;

                    Styled next{};
                    /**
                     * Ideally this should an AnyMap, but settings values on an AnyMap doesn't work?
                     * So we use an unordered_map and convert it to AnyMap at the end.
                     */
                    std::unordered_map<std::string, AnyValue> mergedStyles;

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

                        for (const HybridStyleRule &styleRule: styleRules) {
                            // Skip rule if its media conditions don't pass
                            if (!Rules::testRule(styleRule, get)) {
                                continue;
                            }

                            if (styleRule.d.has_value()) {
                                // Get the tuple from styleRule.d
                                const auto &dTuple = styleRule.d.value();

                                // Merge styleRule.d[0] into mergedStyles
                                const auto &firstMap = std::get<0>(std::get<0>(dTuple));
                                for (const auto &kv: firstMap->getMap()) {
                                    mergedStyles[kv.first] = kv.second;
                                }
                                // Ignore the other entries for now

                            }
                        }
                    }

                    // Convert mergedStyles to AnyMap and set next.style
                    if (!mergedStyles.empty()) {
                        auto anyMap = AnyMap::make(mergedStyles.size());
                        for (const auto &kv: mergedStyles) {
                            if (kv.first == "rotate") {
                                if (!anyMap->contains("transform")) {
                                    anyMap->setArray("transform", AnyArray{});
                                }

                                const auto &transformArray = anyMap->getArray("transform");
                                // find the value in the array with the key "rotate" and set the key "rotate" to kv.second
                            }

                            anyMap->setAny(kv.first, kv.second);
                        }
                        next.style = anyMap;
                    }

                    // Notify ShadowTreeUpdateManager with the resolved style
                    if (next.style.has_value()) {
                        shadowUpdates.addUpdates(componentId, next.style.value());
                    }

                    return next;
                },
                Styled{});

        return computed;
    }

} // namespace margelo::nitro::cssnitro
