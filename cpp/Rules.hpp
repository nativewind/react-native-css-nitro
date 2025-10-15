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
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    using AnyMap = ::margelo::nitro::AnyMap;
    using AnyArray = ::margelo::nitro::AnyArray;
    using AnyValue = ::margelo::nitro::AnyValue;

    class Rules {
    public:
        static bool testRule(const HybridStyleRule &rule, reactnativecss::Effect::GetProxy &get) {
            // If m is not defined, return true
            if (!rule.m.has_value() || !rule.m.value()) {
                return true;
            }

            auto &mediaMap = *rule.m.value();
            return testMediaMap(mediaMap, get);
        }

        static bool
        testRule(const std::shared_ptr<AnyMap> &mediaMap, reactnativecss::Effect::GetProxy &get) {
            if (!mediaMap) {
                return true;
            }
            return testMediaMap(*mediaMap, get);
        }

    private:
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
    };

} // namespace margelo::nitro::cssnitro
