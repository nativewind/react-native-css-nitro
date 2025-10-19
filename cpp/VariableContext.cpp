#include "VariableContext.hpp"
#include "Rules.hpp"
#include "StyledResolver.hpp"

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;
    using AnyMap = ::margelo::nitro::AnyMap;
    using AnyObject = ::margelo::nitro::AnyObject;

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
        // If this is a root or universal context, ensure it exists
        if (contextKey == "root" || contextKey == "universal") {
            createContext(contextKey, "root");
        }

        auto contextIt = contexts.find(contextKey);
        if (contextIt != contexts.end()) {
            auto &valueMap = contextIt->second.values;
            auto varIt = valueMap.find(name);
            if (varIt != valueMap.end()) {
                AnyValue value = getValue(varIt->second, get);
                return StyledResolver::resolveStyle(value, contextKey, get);
            } else {
                // Variable doesn't exist in this context
                // Check if this is a root or universal context
                if (contextKey == "root" || contextKey == "universal") {
                    // For root/universal, create a top-level computed
                    auto &targetMap = (contextKey == "root") ? root_values : universal_values;
                    auto computed = createTopLevelVariableComputed(targetMap, name);
                    valueMap[name] = computed;

                    // Get the initial value from the computed
                    AnyValue value = getValue(computed, get);
                    return StyledResolver::resolveStyle(value, contextKey, get);
                } else {
                    // For other contexts, create a new Observable with nullptr
                    auto observable = reactnativecss::Observable<AnyValue>::create(AnyValue());
                    valueMap[name] = observable;

                    // Subscribe to the observable by calling get()
                    get(*observable);
                }
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
            // This couldn't happen in normal usage, but just in case
            createContext(key, "root");
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
                // Variable doesn't exist in context, create a Computed using the factory
                auto computed = createTopLevelVariableComputed(targetMap, name);
                valueMap[name] = computed;
            }
        }
    }

    std::shared_ptr<reactnativecss::Computed<AnyValue>>
    VariableContext::createTopLevelVariableComputed(
            std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>> &targetMap,
            const std::string &name) {
        return reactnativecss::Computed<AnyValue>::create(
                [&targetMap, name](const AnyValue &prev,
                                   reactnativecss::Effect::GetProxy &get) -> AnyValue {
                    (void) prev;

                    // Read from the target map
                    auto it = targetMap.find(name);
                    if (it != targetMap.end()) {
                        auto value = get(*it->second);

                        // Check if value is an array
                        if (!std::holds_alternative<AnyArray>(value)) {
                            return AnyValue();
                        }

                        const auto &arr = std::get<AnyArray>(value);

                        // Loop over the array
                        for (const auto &item: arr) {
                            // Each item should be an object with "v" and "m" keys
                            if (!std::holds_alternative<AnyObject>(item)) {
                                continue;
                            }

                            const auto &obj = std::get<AnyObject>(item);

                            // Check if "m" is set
                            auto mIt = obj.find("m");
                            if (mIt != obj.end() &&
                                !std::holds_alternative<std::monostate>(mIt->second)) {
                                // "m" is set, test the media query/condition
                                const auto &mValue = mIt->second;

                                // Convert AnyValue to AnyMap if it's an object
                                if (std::holds_alternative<AnyObject>(mValue)) {
                                    const auto &mediaObj = std::get<AnyObject>(mValue);
                                    auto mediaMap = AnyMap::make(mediaObj.size());

                                    // Copy the object into an AnyMap
                                    for (const auto &kv: mediaObj) {
                                        mediaMap->setAny(kv.first, kv.second);
                                    }

                                    // Test the rule - if it doesn't pass, continue to next item
                                    if (!Rules::testVariableMedia(mediaMap, get)) {
                                        continue;
                                    }
                                    // If it passes, fall through to return the "v" value
                                } else {
                                    // "m" exists but is not an AnyObject, skip this item
                                    continue;
                                }
                            }

                            // "m" is not set or the media query passed, return the value of "v"
                            auto vIt = obj.find("v");
                            if (vIt != obj.end()) {
                                return vIt->second;
                            }
                        }

                        return AnyValue();
                    } else {
                        // Observable doesn't exist, create it and subscribe
                        auto observable = reactnativecss::Observable<AnyValue>::create(AnyValue());
                        targetMap[name] = observable;

                        // Subscribe to the observable
                        get(*observable);

                        return AnyValue();
                    }
                },
                AnyValue() // Initial value
        );
    }

} // namespace margelo::nitro::cssnitro
