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
         * Resolve a style function by name with the given arguments.
         *
         * @param fnName The name of the function to resolve
         * @param fnArgs The arguments to pass to the function
         * @param get The Effect::GetProxy for reactive dependencies
         * @param variableScope The variable scope context for resolving variables
         * @return The resolved style value
         */
        static AnyValue resolveStyleFn(
                const std::string &fnName,
                const AnyArray &fnArgs,
                typename reactnativecss::Effect::GetProxy &get,
                const std::string &variableScope
        );
    };

} // namespace margelo::nitro::cssnitro
