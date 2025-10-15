#pragma once

#include <string>
#include <unordered_map>
#include <memory>
#include <optional>
#include "Observable.hpp"
#include "Effect.hpp"
#include "HybridStyleRegistrySpec.hpp"

namespace margelo::nitro::cssnitro {

    struct PseudoClassState {
        std::optional<std::shared_ptr<reactnativecss::Observable<bool>>> active;
        std::optional<std::shared_ptr<reactnativecss::Observable<bool>>> hover;
        std::optional<std::shared_ptr<reactnativecss::Observable<bool>>> focus;
    };

    class PseudoClasses {
    private:
        static std::unordered_map<std::string, PseudoClassState> states;

    public:
        /**
         * Get the value of a pseudo-class for a given key.
         * If the key or type doesn't exist, it will be created with a default value of false.
         *
         * @param key The component/element key
         * @param type The pseudo-class type (active, hover, or focus)
         * @param get The Effect::GetProxy for reactive dependencies
         * @return The current boolean value of the pseudo-class
         */
        static bool get(const std::string &key, PseudoClassType type,
                        reactnativecss::Effect::GetProxy &get);

        /**
         * Set the value of a pseudo-class for a given key.
         *
         * @param key The component/element key
         * @param type The pseudo-class type (active, hover, or focus)
         * @param value The value to set (true or false)
         */
        static void set(const std::string &key, PseudoClassType type, bool value);

        /**
         * Remove a key and all its pseudo-class states from the map.
         *
         * @param key The component/element key to remove
         */
        static void remove(const std::string &key);
    };

} // namespace margelo::nitro::cssnitro
