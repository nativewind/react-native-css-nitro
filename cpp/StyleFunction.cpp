//
// Created on October 15, 2025.
//

#include "StyleFunction.hpp"
#include <NitroModules/AnyMap.hpp>

namespace margelo::nitro::cssnitro {

    AnyValue StyleFunction::resolveStyleFn(
            const std::string &fnName,
            const AnyArray &fnArgs,
            typename reactnativecss::Effect::GetProxy &get
    ) {
        (void) fnName;
        (void) fnArgs;
        (void) get;


        return AnyValue("purple");
    }

} // namespace margelo::nitro::cssnitro
