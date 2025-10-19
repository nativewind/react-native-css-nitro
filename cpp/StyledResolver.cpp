//
// Created on October 19, 2025.
//

#include "StyledResolver.hpp"
#include "StyleFunction.hpp"
#include <variant>

namespace margelo::nitro::cssnitro {

    AnyValue StyledResolver::resolveStyle(
            const AnyValue &value,
            const std::string &variableScope,
            typename reactnativecss::Effect::GetProxy &get
    ) {
        // Check if value is an array
        if (std::holds_alternative<AnyArray>(value)) {
            const auto &arr = std::get<AnyArray>(value);

            // Check if array has at least one element and first element is "fn"
            if (!arr.empty() &&
                std::holds_alternative<std::string>(arr[0]) &&
                std::get<std::string>(arr[0]) == "fn") {

                // Resolve the function
                return StyleFunction::resolveStyleFn(arr, get, variableScope);
            }
        }

        // Otherwise return the value as-is
        return value;
    }

} // namespace margelo::nitro::cssnitro

