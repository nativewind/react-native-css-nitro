#include "StyledComputedFactory.hpp"
#include "Styled+Equality.hpp"
#include "ShadowTreeUpdateManager.hpp"

#include <regex>
#include <variant>
#include <vector>
#include <string>
#include <folly/dynamic.h>
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;

    std::shared_ptr<reactnativecss::Computed<Styled>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<StyleRule>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            ShadowTreeUpdateManager &shadowUpdates) {
        auto computed = reactnativecss::Computed<Styled>::create(
                [&styleRuleMap, classNames, componentId, &shadowUpdates](const Styled &prev,
                                                                         typename reactnativecss::Effect::GetProxy &get) {
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

                        auto styleIt = styleRuleMap.find(className);
                        if (styleIt == styleRuleMap.end() || !styleIt->second) {
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

                    // Notify ShadowTreeUpdateManager with the resolved style entries
                    if (next.style.has_value()) {
                        shadowUpdates.addUpdates(componentId, next.style.value());
                    }

                    return next;
                },
                Styled{});

        return computed;
    }

} // namespace margelo::nitro::cssnitro
