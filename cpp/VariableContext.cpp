#include "VariableContext.hpp"

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;

    // Initialize the static contexts map
    std::unordered_map<std::string, VariableContext::Context> VariableContext::contexts;
    std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>> VariableContext::root_values;
    std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>> VariableContext::universal_values;

    void VariableContext::createContext(const std::string &key, const std::string &parent) {
        // Check if context already exists
        if (contexts.find(key) != contexts.end()) {
            // Context already exists, don't overwrite it
            return;
        }

        // Create a new context with the specified parent
        Context ctx;
        ctx.parent = parent;
        ctx.values = std::unordered_map<std::string, VariableValue>();
        contexts[key] = ctx;
    }

    void VariableContext::deleteContext(const std::string &key) {
        // Remove the context from the map
        contexts.erase(key);
    }

    AnyValue VariableContext::getValue(const VariableValue &varValue,
                                       reactnativecss::Effect::GetProxy &get) {
        if (std::holds_alternative<std::shared_ptr<reactnativecss::Observable<AnyValue>>>(
                varValue)) {
            auto obs = std::get<std::shared_ptr<reactnativecss::Observable<AnyValue>>>(varValue);
            return get(*obs);
        } else {
            auto comp = std::get<std::shared_ptr<reactnativecss::Computed<AnyValue>>>(varValue);
            return get(*comp);
        }
    }

    std::optional<AnyValue> VariableContext::checkContext(const std::string &contextKey,
                                                          const std::string &name,
                                                          reactnativecss::Effect::GetProxy &get) {
        auto contextIt = contexts.find(contextKey);
        if (contextIt != contexts.end()) {
            auto &valueMap = contextIt->second.values;
            auto varIt = valueMap.find(name);
            if (varIt != valueMap.end()) {
                auto result = getValue(varIt->second, get);
                // If the value is not nullopt, return it
                if (!std::holds_alternative<std::monostate>(result)) {
                    return result;
                }
            } else {
                // Variable doesn't exist in this context, create a new Observable with nullptr
                auto observable = reactnativecss::Observable<AnyValue>::create(AnyValue());
                valueMap[name] = observable;

                // Subscribe to the observable by calling get()
                get(*observable);
            }
        }
        return std::nullopt;
    }

    std::optional<AnyValue>
    VariableContext::getVariable(const std::string &key, const std::string &name,
                                 reactnativecss::Effect::GetProxy &get) {
        // 1. Check current key
        auto result = checkContext(key, name, get);
        if (result.has_value()) {
            return result;
        }

        // 2. Check "universal" context (if we're not already in it)
        if (key != "universal") {
            result = checkContext("universal", name, get);
            if (result.has_value()) {
                return result;
            }

            // 3. Walk up the parent chain from the original key
            std::string currentKey = key;
            auto contextIt = contexts.find(currentKey);
            if (contextIt != contexts.end()) {
                std::string parentKey = contextIt->second.parent;

                // Walk up parent chain until we hit root (parent points to itself)
                while (parentKey != currentKey && !parentKey.empty()) {
                    result = checkContext(parentKey, name, get);
                    if (result.has_value()) {
                        return result;
                    }

                    // Move to next parent
                    auto parentIt = contexts.find(parentKey);
                    if (parentIt != contexts.end()) {
                        currentKey = parentKey;
                        parentKey = parentIt->second.parent;
                    } else {
                        break;
                    }
                }
            }
        }

        // Variable doesn't exist in any context
        return std::nullopt;
    }

    void VariableContext::setVariable(const std::string &key, const std::string &name,
                                      const AnyValue &value) {
        // Find or create the context
        auto contextIt = contexts.find(key);
        if (contextIt == contexts.end()) {
            // Context doesn't exist, create it with empty parent
            createContext(key, "");
            contextIt = contexts.find(key);
        }

        auto &valueMap = contextIt->second.values;

        // Find the variable
        auto varIt = valueMap.find(name);
        if (varIt != valueMap.end()) {
            // Variable exists, check if it's an Observable or Computed
            if (std::holds_alternative<std::shared_ptr<reactnativecss::Observable<AnyValue>>>(
                    varIt->second)) {
                // It's an Observable, just update its value
                auto obs = std::get<std::shared_ptr<reactnativecss::Observable<AnyValue>>>(
                        varIt->second);
                obs->set(value);
                return;
            } else {
                // It's a Computed, dispose it and create a new Observable
                auto comp = std::get<std::shared_ptr<reactnativecss::Computed<AnyValue>>>(
                        varIt->second);
                comp->dispose();
            }
        }

        // Create a new Observable with the value
        auto observable = reactnativecss::Observable<AnyValue>::create(value);
        valueMap[name] = observable;
    }

    void VariableContext::setVariable(const std::string &key, const std::string &name,
                                      std::shared_ptr<reactnativecss::Computed<AnyValue>> computed) {
        // Find or create the context
        auto contextIt = contexts.find(key);
        if (contextIt == contexts.end()) {
            // Context doesn't exist, create it with empty parent
            createContext(key, "");
            contextIt = contexts.find(key);
        }

        auto &valueMap = contextIt->second.values;

        // Check if variable already exists and dispose if it's a Computed
        auto varIt = valueMap.find(name);
        if (varIt != valueMap.end()) {
            if (std::holds_alternative<std::shared_ptr<reactnativecss::Computed<AnyValue>>>(
                    varIt->second)) {
                auto existingComp = std::get<std::shared_ptr<reactnativecss::Computed<AnyValue>>>(
                        varIt->second);
                existingComp->dispose();
            }
        }

        // Set the variable to use the provided Computed directly
        valueMap[name] = computed;
    }

    void VariableContext::setTopLevelVariable(const std::string &key, const std::string &name,
                                              const AnyValue &value) {
        // Determine which map to use based on the key
        auto &targetMap = (key == "root") ? root_values : universal_values;

        // Find or create the observable in the target map
        auto observableIt = targetMap.find(name);
        if (observableIt != targetMap.end()) {
            // Observable already exists, just update its value
            observableIt->second->set(value);
        } else {
            // Create a new Observable with the value
            auto observable = reactnativecss::Observable<AnyValue>::create(value);
            targetMap[name] = observable;
        }

        // Check if the name has been set for the key context
        auto contextIt = contexts.find(key);
        if (contextIt != contexts.end()) {
            auto &valueMap = contextIt->second.values;
            auto varIt = valueMap.find(name);

            if (varIt == valueMap.end()) {
                // Variable doesn't exist in context, create a Computed that reads from the target map
                auto computed = reactnativecss::Computed<AnyValue>::create(
                        [&targetMap, name](const AnyValue &prev,
                                           reactnativecss::Effect::GetProxy &get) -> AnyValue {
                            (void) prev;

                            // Read from the target map
                            auto it = targetMap.find(name);
                            if (it != targetMap.end()) {
                                return get(*it->second);
                            }
                            return AnyValue();
                        },
                        AnyValue() // Initial value
                );

                valueMap[name] = computed;
            }
        }
    }

} // namespace margelo::nitro::cssnitro
