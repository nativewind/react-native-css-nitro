#include "PseudoClasses.hpp"

namespace margelo::nitro::cssnitro {

    // Initialize the static map
    std::unordered_map<std::string, PseudoClassState> PseudoClasses::states;

    bool PseudoClasses::get(const std::string &key, PseudoClassType type,
                            reactnativecss::Effect::GetProxy &get) {
        // Find or create the state for this key
        auto stateIt = states.find(key);
        if (stateIt == states.end()) {
            // Key doesn't exist, create it
            PseudoClassState newState;
            states[key] = newState;
            stateIt = states.find(key);
        }

        auto &state = stateIt->second;

        // Get the appropriate observable based on type
        std::optional<std::shared_ptr<reactnativecss::Observable<bool>>> *observablePtr = nullptr;

        // Select the correct observable based on the PseudoClassType
        switch (type) {
            case PseudoClassType::ACTIVE:
                observablePtr = &state.active;
                break;
            case PseudoClassType::HOVER:
                observablePtr = &state.hover;
                break;
            case PseudoClassType::FOCUS:
                observablePtr = &state.focus;
                break;
        }

        // Safety check - should never happen but guards against warnings
        if (observablePtr == nullptr) {
            return false;
        }

        // If the observable doesn't exist, create it with default value of false
        if (!observablePtr->has_value()) {
            *observablePtr = reactnativecss::Observable<bool>::create(false);
        }

        // Subscribe to the observable and return its value
        return get(*observablePtr->value());
    }

    void PseudoClasses::set(const std::string &key, PseudoClassType type, bool value) {
        // Find or create the state for this key
        auto stateIt = states.find(key);
        if (stateIt == states.end()) {
            // Key doesn't exist, create it
            PseudoClassState newState;
            states[key] = newState;
            stateIt = states.find(key);
        }

        auto &state = stateIt->second;

        // Get the appropriate observable based on type
        std::optional<std::shared_ptr<reactnativecss::Observable<bool>>> *observablePtr = nullptr;

        switch (type) {
            case PseudoClassType::ACTIVE:
                observablePtr = &state.active;
                break;
            case PseudoClassType::HOVER:
                observablePtr = &state.hover;
                break;
            case PseudoClassType::FOCUS:
                observablePtr = &state.focus;
                break;
        }

        // Safety check - should never happen but guards against warnings
        if (observablePtr == nullptr) {
            return;
        }

        // If the observable doesn't exist, create it
        if (!observablePtr->has_value()) {
            *observablePtr = reactnativecss::Observable<bool>::create(value);
        } else {
            // Update the existing observable
            observablePtr->value()->set(value);
        }
    }

    void PseudoClasses::remove(const std::string &key) {
        // Remove the key from the map
        states.erase(key);
    }

} // namespace margelo::nitro::cssnitro
