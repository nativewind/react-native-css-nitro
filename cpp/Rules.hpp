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
#include "StyleRule.hpp"
#include "Environment.hpp"
#include "Helpers.hpp"

namespace margelo::nitro::cssnitro {

    // Trait to detect std::vector<T, Alloc>
    template<typename T>
    struct is_std_vector : std::false_type {
    };
    template<typename T, typename Alloc>
    struct is_std_vector<std::vector<T, Alloc>> : std::true_type {
    };

    class Rules {
    public:
        static bool testRule(const StyleRule &rule, reactnativecss::Effect::GetProxy &get) {
            if (rule.m && !rule.m->empty() && !testMediaQuery(*rule.m, get)) {
                return false;
            }
            return true;
        }

        template<class Cond>
        static bool
        testMediaQuery(const std::vector<Cond> &media, reactnativecss::Effect::GetProxy &get) {
            for (const auto &cond: media) {
                if (!testMediaConditionDispatch(cond, get)) {
                    return false;
                }
            }
            return true;
        }

        template<class L, class R>
        static bool testMediaComparison(const std::string &op, const L &left, const R &right,
                                        reactnativecss::Effect::GetProxy &get) {
            using helpers::lower;
            using helpers::toNumber;
            using helpers::toString;

            // Accessors for environment
            auto getWidth = [&]() -> double { return get(reactnativecss::env::windowWidth()); };
            auto getHeight = [&]() -> double { return get(reactnativecss::env::windowHeight()); };

            // Special cases when left is a string keyword
            if (auto leftStr = toString(left)) {
                const std::string key = lower(*leftStr);

                if (key == "min-width") {
                    auto v = toNumber(right);
                    return v.has_value() && getWidth() >= *v;
                }
                if (key == "max-width") {
                    auto v = toNumber(right);
                    return v.has_value() && getWidth() <= *v;
                }
                if (key == "min-height") {
                    auto v = toNumber(right);
                    return v.has_value() && getHeight() >= *v;
                }
                if (key == "max-height") {
                    auto v = toNumber(right);
                    return v.has_value() && getHeight() <= *v;
                }
                if (key == "orientation") {
                    auto vStr = toString(right);
                    const double w = getWidth();
                    const double h = getHeight();
                    return vStr.has_value() && lower(*vStr) == "landscape" ? (h < w) : (h >= w);
                }
            }

            // For general comparisons, right must be numeric
            auto rightValOpt = toNumber(right);
            if (!rightValOpt.has_value()) {
                return false;
            }

            // Left can be numeric or a string referring to width/height
            std::optional<double> leftValOpt = toNumber(left);
            if (!leftValOpt.has_value()) {
                if (auto leftStr = toString(left)) {
                    const std::string key = lower(*leftStr);
                    if (key == "width") {
                        leftValOpt = getWidth();
                    } else if (key == "height") {
                        leftValOpt = getHeight();
                    } else {
                        return false;
                    }
                } else {
                    return false;
                }
            }

            const double a = *leftValOpt;
            const double b = *rightValOpt;

            if (op == "=") return nearlyEqual(a, b);
            if (op == ">") return a > b;
            if (op == ">=") return a > b || nearlyEqual(a, b);
            if (op == "<") return a < b;
            if (op == "<=") return a < b || nearlyEqual(a, b);
            return false;
        }

        template<class Elem>
        static bool testMediaCondition(const std::vector<Elem> &condition,
                                       reactnativecss::Effect::GetProxy &get) {
            if (condition.empty()) return true;
            const std::string &op = condition[0];
            if (op == "[]" || op == "!!") return false;
            if (op == "=" || op == ">" || op == ">=" || op == "<" || op == "<=") {
                if (condition.size() >= 3) {
                    const auto &left = condition[1];
                    const auto &right = condition[2];
                    return testMediaComparison(op, left, right, get);
                }
                return false;
            }
            return false;
        }

    private:
        static bool nearlyEqual(double a, double b, double eps = 1e-9) {
            return std::abs(a - b) <= eps * std::max(1.0, std::max(std::abs(a), std::abs(b)));
        }

        template<class Cond>
        static bool
        testMediaConditionDispatch(const Cond &cond, reactnativecss::Effect::GetProxy &get) {
            if constexpr (is_std_vector<std::decay_t<Cond>>::value) {
                return testMediaCondition(cond, get);
            } else {
                return true;
            }
        }

    };

} // namespace margelo::nitro::cssnitro
