#pragma once

#include <string>
#include <memory>
#include <unordered_map>
#include <vector>

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h> // facebook::react::Tag
#include <jsi/jsi.h>

#include "Observable.hpp"
#include "Effect.hpp"

// Forward declarations for Nitro Any types
namespace margelo {
    namespace nitro {
        class AnyMap;
    }
}

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

                // Accept the style entries from Styled.next.style and convert internally
                void addUpdates(const std::string &componentId,
                                const std::vector<std::shared_ptr<::margelo::nitro::AnyMap>> &styleEntries);

                void registerProcessColorFunction(jsi::Function &&fn);

            private:
                struct ComponentLink {
                    facebook::react::Tag tag{0};
                    jsi::Runtime *runtime{nullptr};
                };

                std::shared_ptr<jsi::Function> process_color_;
                // Cache for processed color strings -> int result
                std::unordered_map<std::string, int> process_color_cache_;

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

                // String color processing (with caching)
                folly::dynamic
                processColorDynamic(jsi::Runtime &runtime, const folly::dynamic &value);

                // Convert a single style entry (AnyMap) into an update object, applying color processing to string values for keys containing "color"
                folly::dynamic
                styleEntryToUpdate(jsi::Runtime &runtime, const ::margelo::nitro::AnyMap &entry);
            };

        }
    }
} // namespace margelo::nitro::cssnitro
