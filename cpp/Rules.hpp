#pragma once

#include <memory>
#include <utility>
#include <type_traits>
#include <vector>
#include <string>
#include <optional>
#include <algorithm>
#include <cctype>

#include "Effect.hpp"
#include "StyleRule.hpp"
#include "Environment.hpp"

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
            auto lhs = toNumber(left, get);
            auto rhs = toNumber(right, get);
            if (!lhs.has_value() || !rhs.has_value()) {
                return false;
            }
            const double a = *lhs;
            const double b = *rhs;
            if (op == "=") return nearlyEqual(a, b);
            if (op == ">") return a > b;
            if (op == ">=") return a >= b || nearlyEqual(a, b);
            if (op == "<") return a < b;
            if (op == "<=") return a <= b || nearlyEqual(a, b);
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

        static std::string lower(std::string s) {
            std::transform(s.begin(), s.end(), s.begin(),
                           [](unsigned char c) { return (char) std::tolower(c); });
            return s;
        }

        static std::optional<double>
        tokenToNumberFromEnv(const std::string &tok, reactnativecss::Effect::GetProxy &get) {
            const auto t = lower(tok);
            if (t == "w" || t == "width" || t == "screenwidth") {
                return get(reactnativecss::env::windowWidth());
            }
            if (t == "h" || t == "height" || t == "screenheight") {
                return get(reactnativecss::env::windowHeight());
            }
            if (t == "scale" || t == "dpr" || t == "pixelratio") {
                return get(reactnativecss::env::windowScale());
            }
            if (t == "fontscale" || t == "fs") {
                return get(reactnativecss::env::windowFontScale());
            }
            return std::nullopt;
        }

        static std::optional<double> parseNumberString(const std::string &s) {
            size_t start = 0, end = s.size();
            while (start < end && std::isspace((unsigned char) s[start])) ++start;
            while (end > start && std::isspace((unsigned char) s[end - 1])) --end;
            if (start >= end) return std::nullopt;
            size_t i = start;
            if (s[i] == '+' || s[i] == '-') ++i;
            bool dot = false;
            while (i < end) {
                char c = s[i];
                if (std::isdigit((unsigned char) c)) ++i;
                else if (c == '.' && !dot) {
                    dot = true;
                    ++i;
                }
                else break;
            }
            if (i == start || (i == start + 1 && (s[start] == '+' || s[start] == '-')))
                return std::nullopt;
            try { return std::stod(std::string{s.begin() + (long) start, s.begin() + (long) i}); }
            catch (...) { return std::nullopt; }
        }

        template<class T>
        static std::optional<double>
        toNumber(const T &value, reactnativecss::Effect::GetProxy &get) {
            using Decayed = std::decay_t<T>;
            if constexpr (std::is_arithmetic_v<Decayed>) {
                return static_cast<double>(value);
            } else if constexpr (std::is_same_v<Decayed, bool>) {
                return value ? 1.0 : 0.0;
            } else if constexpr (std::is_same_v<Decayed, std::string>) {
                if (auto env = tokenToNumberFromEnv(value, get)) return env;
                return parseNumberString(value);
            } else if constexpr (std::is_same_v<Decayed, const char *>) {
                return toNumber(std::string(value), get);
            } else {
                return std::nullopt;
            }
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
