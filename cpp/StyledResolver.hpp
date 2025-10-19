//
// Created on October 19, 2025.
//

#pragma once

#include <string>
#include "Effect.hpp"
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro {
    struct AnyValue;
    using AnyArray = std::vector<AnyValue>;
}

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;
    using AnyArray = ::margelo::nitro::AnyArray;

    class StyledResolver {
    public:
        /**
         * Resolve a style value, checking if it's a function that needs to be resolved.
         *
         * @param value The value to resolve
         * @param variableScope The variable scope context for resolving variables
         * @param get The Effect::GetProxy for reactive dependencies
         * @return The resolved style value
         */
        static AnyValue resolveStyle(
                const AnyValue &value,
                const std::string &variableScope,
                typename reactnativecss::Effect::GetProxy &get
        );
    };

} // namespace margelo::nitro::cssnitro

