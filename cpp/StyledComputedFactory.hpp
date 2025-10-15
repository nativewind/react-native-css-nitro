#pragma once

#include <memory>
#include <string>
#include <unordered_map>

#include "Styled.hpp"
#include "HybridStyleRule.hpp"
#include "ShadowTreeUpdateManager.hpp"
#include "Observable.hpp"
#include "Computed.hpp"

namespace margelo::nitro::cssnitro {

    class StyledComputedFactory;

// Build a Computed<Styled> that resolves styles from classNames against the styleRuleMap
// and notifies ShadowTreeUpdateManager with the value of next.style for the given componentId.
    std::shared_ptr<reactnativecss::Computed<Styled>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            const std::function<void()> &rerender,
            ShadowTreeUpdateManager &shadowUpdates,
            const std::string &variableScope,
            const std::string &containerScope);

    bool shouldRerender(const Styled &styled);

} // namespace margelo::nitro::cssnitro
