#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include "Styled.hpp"
#include "HybridStyleRule.hpp"
#include "Observable.hpp"
#include "Computed.hpp"

namespace margelo::nitro::cssnitro {

    class ShadowTreeUpdateManager;

// Build a Computed<Styled> that resolves styles from classNames against the styleRuleMap
// and notifies ShadowTreeUpdateManager with the value of next.style for the given componentId.
    std::shared_ptr<reactnativecss::Computed<Styled>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            ShadowTreeUpdateManager &shadowUpdates,
            const std::string &variableScope,
            const std::string &containerScope);

} // namespace margelo::nitro::cssnitro
