//
// Created on October 19, 2025.
//

#pragma once

#include <string>
#include "Effect.hpp"
#include <NitroModules/AnyMap.hpp>
#include <unordered_map>

namespace margelo::nitro {
    struct AnyValue;
    using AnyArray = std::vector<AnyValue>;
}

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;
    using AnyArray = ::margelo::nitro::AnyArray;
    using AnyMap = ::margelo::nitro::AnyMap;

    class StyleResolver {
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

        /**
         * Apply style mapping to a map of styles, converting individual transform
         * properties (like scaleX, rotateZ, translateY) into a transform array.
         * Also handles animationName by fetching keyframes.
         *
         * @param inputMap The map of style properties to process
         * @param variableScope The variable scope context for resolving animations
         * @param get The Effect::GetProxy for reactive dependencies
         * @param processAnimations Whether to process animationName properties (default true)
         * @return A new AnyMap with transform properties mapped into a transform array
         */
        static std::shared_ptr<AnyMap> applyStyleMapping(
                const std::unordered_map<std::string, AnyValue> &inputMap,
                const std::string &variableScope,
                typename reactnativecss::Effect::GetProxy &get,
                bool processAnimations = true
        );
    };

} // namespace margelo::nitro::cssnitro
