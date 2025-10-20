#include "Animations.hpp"
#include "StyleResolver.hpp"
#include <unordered_map>
#include <mutex>

namespace reactnativecss::animations {

    using AnyMap = ::margelo::nitro::AnyMap;
    using AnyValue = ::margelo::nitro::AnyValue;
    using AnyObject = ::margelo::nitro::AnyObject;

    // Map to store the shared keyframes observables (one per keyframe name)
    static std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::shared_ptr<AnyMap>>>> keyframesObservables;

    // Map to store scope-specific computeds: Map<variableScope, Map<name, Computed<AnyMap>>>
    static std::unordered_map<std::string, std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<std::shared_ptr<AnyMap>>>>> scopedComputeds;

    static std::mutex keyframesMutex;

    void setKeyframes(const std::string &name, const std::shared_ptr<AnyMap> &keyframes) {
        std::lock_guard<std::mutex> lock(keyframesMutex);

        // Find or create the observable for this keyframe name
        auto it = keyframesObservables.find(name);

        if (it != keyframesObservables.end()) {
            // Update existing observable
            it->second->set(keyframes);
        } else {
            // Create new observable
            keyframesObservables[name] = reactnativecss::Observable<std::shared_ptr<AnyMap>>::create(
                    keyframes);
        }
    }

    std::shared_ptr<AnyMap> getKeyframes(const std::string &name, const std::string &variableScope,
                                         reactnativecss::Effect::GetProxy &get) {
        std::lock_guard<std::mutex> lock(keyframesMutex);

        // First, ensure the Observable exists for this keyframe name
        auto obsIt = keyframesObservables.find(name);
        if (obsIt == keyframesObservables.end()) {
            // Create a new observable with an empty AnyMap
            keyframesObservables[name] = reactnativecss::Observable<std::shared_ptr<AnyMap>>::create(
                    AnyMap::make());
            obsIt = keyframesObservables.find(name);
        }

        // Get the observable for this keyframe name
        auto observable = obsIt->second;

        // Now check if a Computed exists within the variableScope for this name
        auto scopeIt = scopedComputeds.find(variableScope);
        if (scopeIt == scopedComputeds.end()) {
            // Create the scope map if it doesn't exist
            scopedComputeds[variableScope] = std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<std::shared_ptr<AnyMap>>>>();
            scopeIt = scopedComputeds.find(variableScope);
        }

        auto &scopeMap = scopeIt->second;
        auto computedIt = scopeMap.find(name);

        if (computedIt == scopeMap.end()) {
            // Create a new Computed that gets the AnyMap from the observable and processes it
            auto computed = reactnativecss::Computed<std::shared_ptr<AnyMap>>::create(
                    [observable, variableScope](const std::shared_ptr<AnyMap> &prev,
                                                reactnativecss::Effect::GetProxy &get) {
                        // Get the raw keyframes from the observable
                        auto rawKeyframes = get(*observable);

                        // Create a new AnyMap to hold the resolved keyframes
                        auto resolvedKeyframes = AnyMap::make(rawKeyframes->getMap().size());

                        // Loop over the entries of the rawKeyframes
                        for (const auto &entry: rawKeyframes->getMap()) {
                            const std::string &key = entry.first;
                            const AnyValue &value = entry.second;

                            // Each value should be an AnyObject, if not skip that entry
                            if (!std::holds_alternative<AnyObject>(value)) {
                                continue;
                            }

                            const auto &frameMap = std::get<AnyObject>(value);

                            // Create a temporary map to hold resolved frame values
                            std::unordered_map<std::string, AnyValue> resolvedFrameMap;
                            resolvedFrameMap.reserve(frameMap.size());

                            // Loop over each entry of the frame and resolve values
                            for (const auto &frameEntry: frameMap) {
                                const std::string &frameKey = frameEntry.first;
                                const AnyValue &frameValue = frameEntry.second;

                                // Resolve the value using StyleResolver
                                AnyValue resolvedValue = margelo::nitro::cssnitro::StyleResolver::resolveStyle(
                                        frameValue, variableScope, get
                                );

                                resolvedFrameMap[frameKey] = resolvedValue;
                            }

                            // Apply style mapping to the resolved frame
                            auto transformedFrame = margelo::nitro::cssnitro::StyleResolver::applyStyleMapping(
                                    resolvedFrameMap, variableScope, get
                            );

                            // Convert the transformed frame back to an AnyObject
                            AnyObject finalFrame;
                            for (const auto &transformedEntry: transformedFrame->getMap()) {
                                finalFrame[transformedEntry.first] = transformedEntry.second;
                            }

                            // Set the resolved and transformed frame in the result
                            resolvedKeyframes->setObject(key, finalFrame);
                        }

                        return resolvedKeyframes;
                    },
                    AnyMap::make()
            );

            scopeMap[name] = computed;
            computedIt = scopeMap.find(name);
        }

        // Return get(computed) to subscribe to it
        return get(*computedIt->second);
    }

    void deleteScope(const std::string &name) {
        std::lock_guard<std::mutex> lock(keyframesMutex);
        scopedComputeds.erase(name);
    }

} // namespace reactnativecss::animations
