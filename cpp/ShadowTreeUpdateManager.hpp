#pragma once

#include <string>
#include <memory>
#include <unordered_map>

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h> // facebook::react::Tag
#include <jsi/jsi.h>

#include "Observable.hpp"
#include "Computed.hpp"
#include "Effect.hpp"

// Provide a convenient alias matching React Native's JSI namespace
namespace jsi = facebook::jsi;

namespace margelo {
    namespace nitro {
        namespace cssnitro {

            class ShadowTreeUpdateManager final {
            public:
                using UpdatesMap = std::unordered_map<facebook::react::Tag, folly::dynamic>;

                ShadowTreeUpdateManager();

                void linkComponent(jsi::Runtime &runtime,
                                   const std::string &componentId,
                                   facebook::react::Tag tag);

                void unlinkComponent(const std::string &componentId);

                void addUpdates(const std::string &componentId, const folly::dynamic &payload);

            private:
                struct ComponentLink {
                    facebook::react::Tag tag{0};
                    jsi::Runtime *runtime{nullptr};
                };

                // componentId -> {tag, runtime*}
                std::unordered_map<std::string, ComponentLink> component_links_;

                // Per-runtime updates observable/effect
                std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Observable<UpdatesMap>>> runtime_updates_;

                struct RuntimeEffectHolder {
                    std::shared_ptr<reactnativecss::Effect> effect;
                };
                std::unordered_map<jsi::Runtime *, std::shared_ptr<RuntimeEffectHolder>> runtime_effects_;

                void ensureRuntimeEffect(jsi::Runtime &runtime);

                void applyUpdates(jsi::Runtime &runtime, const UpdatesMap &updates);
            };

        }
    }
} // namespace margelo::nitro::cssnitro
