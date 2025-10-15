#pragma once

#include <memory>
#include <utility>
#include <type_traits>
#include <vector>
#include <string>
#include <optional>
#include <algorithm>
#include <cctype>
#include <cmath>

#include "Effect.hpp"
#include "HybridStyleRule.hpp"
#include "Environment.hpp"
#include "Helpers.hpp"
#include "PseudoClasses.hpp"
#include "ContainerContext.hpp"
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;
    using AnyArray = ::margelo::nitro::AnyArray;
    using AnyValue = ::margelo::nitro::AnyValue;

    class Rules {
    public:
        static bool testRule(const HybridStyleRule &rule, reactnativecss::Effect::GetProxy &get,
                             const std::string &componentId, const std::string &containerScope) {
            // Check pseudo-classes first (rule.p)
            if (rule.p.has_value()) {
                if (!testPseudoClasses(rule.p.value(), componentId, get)) {
                    return false;
                }
            }

            // Check media queries (rule.m)
            if (rule.m.has_value() && rule.m.value()) {
                auto &mediaMap = *rule.m.value();
                if (!testMediaMap(mediaMap, get)) {
                    return false;
                }
            }

            // Check container queries (rule.cq)
            if (rule.cq.has_value()) {
                const auto &containerQueryMap = rule.cq.value();
                if (!testContainerQueries(containerQueryMap, get, containerScope)) {
                    return false;
                }
            }

            return true;
        }

        static bool
        testRule(const std::shared_ptr<AnyMap> &mediaMap, reactnativecss::Effect::GetProxy &get) {
            if (!mediaMap) {
                return true;
            }
            return testMediaMap(*mediaMap, get);
        }

    private:
        /**
         * Test if pseudo-class conditions match.
         * Returns false if any pseudo-class doesn't match the expected state.
         */
        static bool
        testPseudoClasses(const PseudoClass &pseudoClass, const std::string &componentId,
                          reactnativecss::Effect::GetProxy &get) {
            // Check active state
            if (pseudoClass.a.has_value()) {
                bool expectedActive = pseudoClass.a.value();
                bool actualActive = PseudoClasses::get(componentId, PseudoClassType::ACTIVE, get);
                if (actualActive != expectedActive) {
                    return false;
                }
            }

            // Check hover state
            if (pseudoClass.h.has_value()) {
                bool expectedHover = pseudoClass.h.value();
                bool actualHover = PseudoClasses::get(componentId, PseudoClassType::HOVER, get);
                if (actualHover != expectedHover) {
                    return false;
                }
            }

            // Check focus state
            if (pseudoClass.f.has_value()) {
                bool expectedFocus = pseudoClass.f.value();
                bool actualFocus = PseudoClasses::get(componentId, PseudoClassType::FOCUS, get);
                if (actualFocus != expectedFocus) {
                    return false;
                }
            }

            return true;
        }

        static bool testMediaMap(const AnyMap &mediaMap, reactnativecss::Effect::GetProxy &get) {
            // Get all keys to check if empty
            auto keys = mediaMap.getAllKeys();
            if (keys.empty()) {
                return true;
            }

            // Check for $$op to determine logic mode
            std::string logicOp = "and"; // default is "and"
            bool negate = false;

            if (mediaMap.contains("$$op")) {
                if (mediaMap.isString("$$op")) {
                    logicOp = mediaMap.getString("$$op");
                    if (logicOp == "not") {
                        negate = true;
                        logicOp = "and"; // "not" just negates the result, logic is still "and"
                    }
                }
            }

            // Track test results
            std::vector<bool> results;

            // Loop over all keys
            for (const auto &key: keys) {
                // Skip the $$op key
                if (key == "$$op") {
                    continue;
                }

                // Value should be an array with [operator, expectedValue]
                if (!mediaMap.isArray(key)) {
                    continue;
                }

                AnyArray valueArray = mediaMap.getArray(key);
                if (valueArray.size() < 2) {
                    continue;
                }

                // Extract operator and expected value
                std::string op;
                if (std::holds_alternative<std::string>(valueArray[0])) {
                    op = std::get<std::string>(valueArray[0]);
                }

                bool testResult = testMediaQuery(key, op, valueArray[1], get);
                results.push_back(testResult);
            }

            // If no tests were run, return true
            if (results.empty()) {
                return true;
            }

            // Apply logic
            bool finalResult;
            if (logicOp == "or") {
                // "or" - at least one must pass
                finalResult = false;
                for (bool result: results) {
                    if (result) {
                        finalResult = true;
                        break;
                    }
                }
            } else {
                // "and" - all must pass (default)
                finalResult = true;
                for (bool result: results) {
                    if (!result) {
                        finalResult = false;
                        break;
                    }
                }
            }

            // Apply negation if needed
            if (negate) {
                finalResult = !finalResult;
            }

            return finalResult;
        }

        static bool
        testMediaQuery(const std::string &key, const std::string &op, const AnyValue &value,
                       reactnativecss::Effect::GetProxy &get) {
            if (op == "=") {
                if (key == "min-width") {
                    if (std::holds_alternative<double>(value)) {
                        double vw = get(reactnativecss::env::windowWidth());
                        return vw >= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "max-width") {
                    if (std::holds_alternative<double>(value)) {
                        double vw = get(reactnativecss::env::windowWidth());
                        return vw <= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "min-height") {
                    if (std::holds_alternative<double>(value)) {
                        double vh = get(reactnativecss::env::windowHeight());
                        return vh >= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "max-height") {
                    if (std::holds_alternative<double>(value)) {
                        double vh = get(reactnativecss::env::windowHeight());
                        return vh <= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "orientation") {
                    if (std::holds_alternative<std::string>(value)) {
                        std::string orientation = std::get<std::string>(value);
                        double vw = get(reactnativecss::env::windowWidth());
                        double vh = get(reactnativecss::env::windowHeight());
                        if (orientation == "landscape") {
                            return vh < vw;
                        } else {
                            return vh >= vw;
                        }
                    }
                    return false;
                }
            }

            // For other operators, value must be a number
            if (!std::holds_alternative<double>(value)) {
                return false;
            }

            double right = std::get<double>(value);
            double left = 0.0;

            // Determine left value based on key and fetch only what's needed
            if (key == "width") {
                left = get(reactnativecss::env::windowWidth());
            } else if (key == "height") {
                left = get(reactnativecss::env::windowHeight());
            } else if (key == "resolution") {
                // TODO: Need to get PixelRatio - for now return 1.0
                left = 1.0; // PixelRatio.get()
            } else {
                return false;
            }

            // Apply operator
            if (op == "=") {
                return left == right;
            } else if (op == ">") {
                return left > right;
            } else if (op == ">=") {
                return left >= right;
            } else if (op == "<") {
                return left < right;
            } else if (op == "<=") {
                return left <= right;
            }

            return false;
        }

        static bool
        testContainerQueries(
                const std::vector<ContainerQuery> &containerQueries,
                reactnativecss::Effect::GetProxy &get,
                const std::string &containerScope) {
            // Loop over all container queries and return false if any fail
            for (const auto &containerQuery: containerQueries) {
                if (!testContainerQuery(containerQuery, get, containerScope)) {
                    return false;
                }
            }
            return true;
        }

        static bool
        testContainerQuery(const ContainerQuery &containerQuery,
                           reactnativecss::Effect::GetProxy &get,
                           const std::string &containerScope) {
            std::optional<std::string> containerName = std::nullopt;

            // Access the 'n' field directly if it exists
            if (containerQuery.n.has_value()) {
                containerName = containerQuery.n.value();
            }

            // Resolve the actual container scope using findInScope
            auto resolvedScope = ContainerContext::findInScope(containerScope, containerName);

            // If we can't resolve the scope, the query fails
            if (!resolvedScope.has_value()) {
                return false;
            }

            // Test pseudo-classes if containerQuery.p is set
            if (containerQuery.p.has_value()) {
                if (!testPseudoClasses(containerQuery.p.value(), resolvedScope.value(), get)) {
                    return false;
                }
            }

            // Only test media queries if containerQuery.m is set
            if (containerQuery.m.has_value()) {
                return testContainerMediaMap(*containerQuery.m.value(), get, resolvedScope.value());
            }

            // If no media queries, the container query passes
            return true;
        }

        static bool testContainerMediaMap(const AnyMap &containerMediaMap,
                                          reactnativecss::Effect::GetProxy &get,
                                          const std::string &containerScope) {
            // Get all keys to check if empty
            auto keys = containerMediaMap.getAllKeys();
            if (keys.empty()) {
                return true;
            }

            // Check for $$op to determine logic mode
            std::string logicOp = "and"; // default is "and"
            bool negate = false;

            if (containerMediaMap.contains("$$op")) {
                if (containerMediaMap.isString("$$op")) {
                    logicOp = containerMediaMap.getString("$$op");
                    if (logicOp == "not") {
                        negate = true;
                        logicOp = "and"; // "not" just negates the result, logic is still "and"
                    }
                }
            }

            // Track test results
            std::vector<bool> results;

            // Loop over all keys
            for (const auto &key: keys) {
                // Skip the $$op key
                if (key == "$$op") {
                    continue;
                }

                // Value should be an array with [operator, expectedValue]
                if (!containerMediaMap.isArray(key)) {
                    continue;
                }

                AnyArray valueArray = containerMediaMap.getArray(key);
                if (valueArray.size() < 2) {
                    continue;
                }

                // Extract operator and expected value
                std::string op;
                if (std::holds_alternative<std::string>(valueArray[0])) {
                    op = std::get<std::string>(valueArray[0]);
                }

                bool testResult = testContainerMediaQuery(key, op, valueArray[1], get,
                                                          containerScope);
                results.push_back(testResult);
            }

            // If no tests were run, return true
            if (results.empty()) {
                return true;
            }

            // Apply logic
            bool finalResult;
            if (logicOp == "or") {
                // "or" - at least one must pass
                finalResult = false;
                for (bool result: results) {
                    if (result) {
                        finalResult = true;
                        break;
                    }
                }
            } else {
                // "and" - all must pass (default)
                finalResult = true;
                for (bool result: results) {
                    if (!result) {
                        finalResult = false;
                        break;
                    }
                }
            }

            // Apply negation if needed
            if (negate) {
                finalResult = !finalResult;
            }

            return finalResult;
        }

        static bool
        testContainerMediaQuery(const std::string &key, const std::string &op,
                                const AnyValue &value,
                                reactnativecss::Effect::GetProxy &get,
                                const std::string &containerScope) {
            if (op == "=") {
                if (key == "min-width") {
                    if (std::holds_alternative<double>(value)) {
                        auto cw = ContainerContext::getWidth(containerScope, std::nullopt, get);
                        if (!cw.has_value()) return false;
                        return cw.value() >= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "max-width") {
                    if (std::holds_alternative<double>(value)) {
                        auto cw = ContainerContext::getWidth(containerScope, std::nullopt, get);
                        if (!cw.has_value()) return false;
                        return cw.value() <= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "min-height") {
                    if (std::holds_alternative<double>(value)) {
                        auto ch = ContainerContext::getHeight(containerScope, std::nullopt, get);
                        if (!ch.has_value()) return false;
                        return ch.value() >= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "max-height") {
                    if (std::holds_alternative<double>(value)) {
                        auto ch = ContainerContext::getHeight(containerScope, std::nullopt, get);
                        if (!ch.has_value()) return false;
                        return ch.value() <= std::get<double>(value);
                    }
                    return false;
                }
                if (key == "orientation") {
                    if (std::holds_alternative<std::string>(value)) {
                        std::string orientation = std::get<std::string>(value);
                        auto cw = ContainerContext::getWidth(containerScope, std::nullopt, get);
                        auto ch = ContainerContext::getHeight(containerScope, std::nullopt, get);
                        if (!cw.has_value() || !ch.has_value()) return false;
                        if (orientation == "landscape") {
                            return ch.value() < cw.value();
                        } else {
                            return ch.value() >= cw.value();
                        }
                    }
                    return false;
                }
            }

            // For other operators, value must be a number
            if (!std::holds_alternative<double>(value)) {
                return false;
            }

            double right = std::get<double>(value);
            std::optional<double> leftOpt;

            // Determine left value based on key and fetch only what's needed
            if (key == "width") {
                leftOpt = ContainerContext::getWidth(containerScope, std::nullopt, get);
            } else if (key == "height") {
                leftOpt = ContainerContext::getHeight(containerScope, std::nullopt, get);
            } else {
                return false;
            }

            // Check if we got a value
            if (!leftOpt.has_value()) {
                return false;
            }

            double left = leftOpt.value();

            // Apply operator
            if (op == "=") {
                return left == right;
            } else if (op == ">") {
                return left > right;
            } else if (op == ">=") {
                return left >= right;
            } else if (op == "<") {
                return left < right;
            } else if (op == "<=") {
                return left <= right;
            }

            return false;
        }
    };

} // namespace margelo::nitro::cssnitro
