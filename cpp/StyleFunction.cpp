//
// Created on October 15, 2025.
//

#include "StyleFunction.hpp"
#include "VariableContext.hpp"
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    AnyValue StyleFunction::resolveStyleFn(
            const AnyArray &fnArgs,
            typename reactnativecss::Effect::GetProxy &get,
            const std::string &variableScope
    ) {
        // Check if fnArgs has at least 3 elements and first is "fn"
        if (fnArgs.size() >= 3 &&
            std::holds_alternative<std::string>(fnArgs[0]) &&
            std::get<std::string>(fnArgs[0]) == "fn") {

            // Check if second element is "var"
            if (std::holds_alternative<std::string>(fnArgs[1]) &&
                std::get<std::string>(fnArgs[1]) == "var") {

                // Need at least ["fn", "var", name]
                if (fnArgs.size() >= 3 && std::holds_alternative<std::string>(fnArgs[2])) {
                    const std::string &varName = std::get<std::string>(fnArgs[2]);

                    // Get fallback value (if exists, it's at index 3)
                    AnyValue fallback;
                    if (fnArgs.size() >= 4) {
                        fallback = fnArgs[3];
                    }

                    return resolveVar(varName, fallback, get, variableScope);
                }
            }
        }

        return AnyValue();
    }

    AnyValue StyleFunction::resolveVar(
            const std::string &name,
            const AnyValue &fallback,
            typename reactnativecss::Effect::GetProxy &get,
            const std::string &variableScope
    ) {
        auto result = VariableContext::getVariable(variableScope, name, get);

        if (result.has_value()) {
            return result.value();
        }

        return resolveAnyValue(fallback, get, variableScope);
    }

    AnyValue StyleFunction::resolveAnyValue(
            const AnyValue &value,
            typename reactnativecss::Effect::GetProxy &get,
            const std::string &variableScope
    ) {
        // Check if value is an array
        if (std::holds_alternative<AnyArray>(value)) {
            const auto &arr = std::get<AnyArray>(value);
            return resolveStyleFn(arr, get, variableScope);
        }

        // Return the value as-is if it's not an array
        return value;
    }

} // namespace margelo::nitro::cssnitro
