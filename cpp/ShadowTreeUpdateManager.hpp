#pragma once

#include <string>
#include <memory>
#include <unordered_map>
#include <vector>

#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>

namespace facebook::jsi {
    class Runtime;

    class Function;
}

namespace reactnativecss {
    template<typename T>
    class Observable;

    class Effect;
}

namespace margelo::nitro { class AnyMap; }

namespace jsi = facebook::jsi;

namespace margelo::nitro::cssnitro {

    struct VariantConverter;

    class ShadowTreeUpdateManager final {
    public:
        using UpdatesMap = std::unordered_map<facebook::react::Tag, folly::dynamic>;

        ShadowTreeUpdateManager();

        void linkComponent(jsi::Runtime &runtime,
                           const std::string &componentId,
                           facebook::react::Tag tag);

        bool hasComponent(const std::string &componentId);

        void unlinkComponent(const std::string &componentId);

        void addUpdates(const std::string &componentId,
                        const std::shared_ptr<::margelo::nitro::AnyMap> &styleEntries);

        void registerProcessColorFunction(jsi::Function &&fn);

    private:
        friend struct VariantConverter;
        struct ComponentLink {
            facebook::react::Tag tag{0};
            jsi::Runtime *runtime{nullptr};
        };

        std::shared_ptr<jsi::Function> process_color_;
        std::unordered_map<std::string, int> process_color_cache_;

        std::unordered_map<std::string, ComponentLink> component_links_;

        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Observable<UpdatesMap>>> runtime_updates_;

        // Keep one effect per runtime
        std::unordered_map<jsi::Runtime *, std::shared_ptr<reactnativecss::Effect>> runtime_effects_;

        void ensureRuntimeEffect(jsi::Runtime &runtime);

        static void applyUpdates(jsi::Runtime &runtime, const UpdatesMap &updates);

        // String color processing (with caching)
        folly::dynamic
        processColorDynamic(jsi::Runtime &runtime, const folly::dynamic &value);

        // styleEntryToUpdate was inlined into addUpdates
    };
} // namespace margelo::nitro::cssnitro
