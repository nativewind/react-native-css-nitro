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

    class StyledComputedFactory {
    public:
        /**
         * Convert an unordered_map to AnyMap with optional transform property handling.
         * @param mergedMap The source map to convert
         * @param applyTransformMapping If true, applies special handling for transform properties and animations
         * @param variableScope The scope for variable resolution and animation keyframes
         * @param get The Effect GetProxy for reactive dependencies
         * @return The converted AnyMap
         */
        static std::shared_ptr<margelo::nitro::AnyMap> convertToAnyMap(
                const std::unordered_map<std::string, margelo::nitro::AnyValue> &mergedMap,
                bool applyTransformMapping,
                const std::string &variableScope,
                reactnativecss::Effect::GetProxy &get);

        /**
         * Process declarations from a style rule and merge them into target maps.
         * @param declarations The variant containing style/prop declarations
         * @param targetStyles The map to store style declarations
         * @param targetProps The map to store prop declarations
         * @param get The Effect GetProxy for resolving reactive values
         * @param variableScope The scope for variable resolution
         */
        static void processDeclarations(
                const auto &declarations,
                std::unordered_map<std::string, margelo::nitro::AnyValue> &targetStyles,
                std::unordered_map<std::string, margelo::nitro::AnyValue> &targetProps,
                reactnativecss::Effect::GetProxy &get,
                const std::string &variableScope);
    };

// Build a Computed<Styled*> that resolves styles from classNames against the styleRuleMap
// and notifies ShadowTreeUpdateManager with the value of next.style for the given componentId.
    std::shared_ptr<reactnativecss::Computed<Styled *>> makeStyledComputed(
            const std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> &styleRuleMap,
            const std::string &classNames,
            const std::string &componentId,
            const std::function<void()> &rerender,
            ShadowTreeUpdateManager &shadowUpdates,
            const std::string &variableScope,
            const std::string &containerScope,
            const std::vector<std::string> &validAttributeQueries);

    bool shouldRerender(const Styled &styled);

} // namespace margelo::nitro::cssnitro
