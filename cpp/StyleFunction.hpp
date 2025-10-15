//
// Created on October 15, 2025.
//

#pragma once

#include <string>
#include <unordered_map>
#include <vector>
#include <variant>
#include "Effect.hpp"

namespace margelo::nitro {
    struct AnyValue;
    using AnyArray = std::vector<AnyValue>;
    using AnyObject = std::unordered_map<std::string, AnyValue>;
}

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;
    using AnyArray = ::margelo::nitro::AnyArray;

    class StyleFunction {
    public:
        /**
         * Resolve a style function with the given arguments.
         *
         * @param fnArgs The arguments array (first element should be the function name)
         * @param get The Effect::GetProxy for reactive dependencies
         * @param variableScope The variable scope context for resolving variables
         * @return The resolved style value
         */
        static AnyValue resolveStyleFn(
                const AnyArray &fnArgs,
                typename reactnativecss::Effect::GetProxy &get,
                const std::string &variableScope
        );

        /**
         * Resolve a CSS variable from the variable context.
         *
         * @param name The name of the variable to resolve
         * @param fallback The fallback value if the variable is not found
         * @param get The Effect::GetProxy for reactive dependencies
         * @param variableScope The variable scope context for resolving variables
         * @return The resolved variable value or fallback
         */
        static AnyValue resolveVar(
                const std::string &name,
                const AnyValue &fallback,
                typename reactnativecss::Effect::GetProxy &get,
                const std::string &variableScope
        );

        /**
         * Resolve an AnyValue, checking if it contains a "var" function call.
         *
         * @param value The value to resolve
         * @param get The Effect::GetProxy for reactive dependencies
         * @param variableScope The variable scope context for resolving variables
         * @return The resolved value
         */
        static AnyValue resolveAnyValue(
                const AnyValue &value,
                typename reactnativecss::Effect::GetProxy &get,
                const std::string &variableScope
        );
    };

} // namespace margelo::nitro::cssnitro
