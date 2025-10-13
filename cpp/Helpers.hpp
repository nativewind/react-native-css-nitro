#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>
#include <unordered_set>
#include <algorithm>
#include <cctype>
#include <optional>
#include <string>
#include <type_traits>
#include <vector>

using namespace facebook;

namespace margelo::nitro::cssnitro::helpers {

    using Variants = std::vector<std::pair<std::string, std::string>>;

    inline void assertThat(jsi::Runtime &rt, bool condition, const std::string &message) {
        if (!condition) {
            throw jsi::JSError(rt, message);
        }
    }

    // Convert supported string-like values to std::string; otherwise std::nullopt.
    // Supported: std::string, any type convertible to const char*
    template<typename T>
    inline std::optional<std::string> toString(const T &v) {
        using U = std::decay_t<T>;
        if constexpr (std::is_same_v<U, std::string>) {
            return v;
        } else if constexpr (std::is_convertible_v<U, const char *>) {
            return std::string(v);
        } else {
            return std::nullopt;
        }
    }

    // Convert arithmetic types to double; otherwise std::nullopt.
    template<typename T>
    inline std::optional<double> toNumber(const T &v) {
        using U = std::decay_t<T>;
        if constexpr (std::is_arithmetic_v<U>) {
            return static_cast<double>(v);
        } else {
            return std::nullopt;
        }
    }

    // Lower-case a string in-place and return it (ASCII only).
    inline std::string lower(std::string s) {
        std::transform(s.begin(), s.end(), s.begin(),
                       [](unsigned char c) { return static_cast<char>(std::tolower(c)); });
        return s;
    }
}
