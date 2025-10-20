//
// Created on October 19, 2025.
//

#include "StyleResolver.hpp"
#include "StyleFunction.hpp"
#include "Animations.hpp"
#include <variant>
#include <unordered_set>

namespace margelo::nitro::cssnitro {

    using AnyObject = ::margelo::nitro::AnyObject;

    AnyValue StyleResolver::resolveStyle(
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

    std::shared_ptr<AnyMap> StyleResolver::applyStyleMapping(
            const std::unordered_map<std::string, AnyValue> &inputMap,
            const std::string &variableScope,
            typename reactnativecss::Effect::GetProxy &get,
            bool processAnimations
    ) {
        static const std::unordered_set<std::string> transformProps = {
                "translateX", "translateY", "translateZ",
                "rotate", "rotateX", "rotateY", "rotateZ",
                "scaleX", "scaleY", "scaleZ",
                "skewX", "skewY",
                "perspective"
        };

        auto anyMap = AnyMap::make(inputMap.size());

        for (const auto &kv: inputMap) {
            // Handle animationName property only if processAnimations is true
            if (processAnimations && kv.first == "animationName") {
                // animationName can be a string or a vector of strings
                if (std::holds_alternative<std::string>(kv.second)) {
                    // Single animation name
                    const std::string &animName = std::get<std::string>(kv.second);
                    auto keyframes = reactnativecss::animations::getKeyframes(animName,
                                                                              variableScope, get);

                    // Set animationName to the resolved keyframes object
                    anyMap->setObject("animationName", keyframes->getMap());
                } else if (std::holds_alternative<AnyArray>(kv.second)) {
                    // Array of animation names
                    const AnyArray &animNames = std::get<AnyArray>(kv.second);
                    AnyArray keyframesArray;

                    for (const auto &animNameValue: animNames) {
                        if (std::holds_alternative<std::string>(animNameValue)) {
                            const std::string &animName = std::get<std::string>(animNameValue);
                            auto keyframes = reactnativecss::animations::getKeyframes(animName,
                                                                                      variableScope,
                                                                                      get);
                            keyframesArray.push_back(keyframes->getMap());
                        }
                    }

                    // Set animationName to the array of resolved keyframes
                    anyMap->setArray("animationName", keyframesArray);
                } else {
                    // Invalid type for animationName, just pass through as-is
                    anyMap->setAny("animationName", kv.second);
                }
                continue;
            }

            // Handle transform properties
            if (transformProps.count(kv.first) > 0) {
                AnyArray transformArray;

                // Get existing transform array if it exists
                if (anyMap->contains("transform")) {
                    transformArray = anyMap->getArray("transform");
                }

                // Find the value in the array with the key matching kv.first and set it to kv.second
                bool foundTransform = false;
                for (size_t i = 0; i < transformArray.size(); i++) {
                    if (std::holds_alternative<AnyObject>(transformArray[i])) {
                        auto obj = std::get<AnyObject>(transformArray[i]);
                        if (obj.count(kv.first) > 0) {
                            obj[kv.first] = kv.second;
                            transformArray[i] = obj;
                            foundTransform = true;
                            break;
                        }
                    }
                }

                // If transform property not found in array, add a new transform object
                if (!foundTransform) {
                    AnyObject transformObj;
                    transformObj[kv.first] = kv.second;
                    transformArray.emplace_back(transformObj);
                }

                anyMap->setArray("transform", transformArray);
                continue;
            }

            // For all other properties, just pass through as-is
            anyMap->setAny(kv.first, kv.second);
        }

        return anyMap;
    }

} // namespace margelo::nitro::cssnitro
