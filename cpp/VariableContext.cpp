#include "VariableContext.hpp"

namespace margelo::nitro::cssnitro {

    // Initialize the static contexts map
    std::unordered_map<std::string, std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>>> VariableContext::contexts;

    void VariableContext::createContext(const std::string &key) {
        // Create a new empty map for this context
        contexts[key] = std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>>();
    }

    void VariableContext::deleteContext(const std::string &key) {
        // Remove the context from the map
        contexts.erase(key);
    }

    const AnyValue &VariableContext::getVariable(const std::string &key, const std::string &name,
                                                 reactnativecss::Effect::GetProxy &get) {
        // Find the context
        auto contextIt = contexts.find(key);
        if (contextIt == contexts.end()) {
            // Context doesn't exist, throw or return a default value
            static AnyValue defaultValue;
            return defaultValue;
        }

        // Find the variable in the context
        auto &variableMap = contextIt->second;
        auto varIt = variableMap.find(name);
        if (varIt == variableMap.end()) {
            // Variable doesn't exist, return a default value
            static AnyValue defaultValue;
            return defaultValue;
        }

        // Get the observable and subscribe the effect to it
        auto &observable = varIt->second;
        return get(*observable);
    }

    void VariableContext::setVariable(const std::string &key, const std::string &name,
                                      const AnyValue &value) {
        // Find or create the context
        auto contextIt = contexts.find(key);
        if (contextIt == contexts.end()) {
            // Context doesn't exist, create it
            createContext(key);
            contextIt = contexts.find(key);
        }

        auto &variableMap = contextIt->second;

        // Find or create the observable for this variable
        auto varIt = variableMap.find(name);
        if (varIt == variableMap.end()) {
            // Variable doesn't exist, create a new Observable with the value
            auto observable = reactnativecss::Observable<AnyValue>::create(value);
            variableMap[name] = observable;
        } else {
            // Variable exists, update its value
            varIt->second->set(value);
        }
    }

    void VariableContext::setVariable(const std::string &key, const std::string &name,
                                      std::shared_ptr<reactnativecss::Observable<AnyValue>> observable) {
        // Find or create the context
        auto contextIt = contexts.find(key);
        if (contextIt == contexts.end()) {
            // Context doesn't exist, create it
            createContext(key);
            contextIt = contexts.find(key);
        }

        auto &variableMap = contextIt->second;

        // Set the variable to use the provided Observable directly
        variableMap[name] = observable;
    }

} // namespace margelo::nitro::cssnitro
