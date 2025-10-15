#pragma once

#include <string>
#include <unordered_map>
#include <memory>
#include <optional>
#include <variant>
#include <NitroModules/AnyMap.hpp>
#include "Observable.hpp"
#include "Computed.hpp"
#include "Effect.hpp"

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;

    class VariableContext {
    public:
        // Value can be either Observable or Computed
        using VariableValue = std::variant<
                std::shared_ptr<reactnativecss::Observable<AnyValue>>,
                std::shared_ptr<reactnativecss::Computed<AnyValue>>
        >;

        struct Context {
            std::string parent;
            std::unordered_map<std::string, VariableValue> values;
        };

        // Static map: context key -> Context
        static std::unordered_map<std::string, Context> contexts;

        // Create a new context with the given key and parent
        static void createContext(const std::string &key, const std::string &parent);

        // Delete a context by key
        static void deleteContext(const std::string &key);

        // Get a variable from a context, subscribing the effect to changes
        // Returns std::nullopt if the context or variable doesn't exist
        static std::optional<AnyValue> getVariable(const std::string &key, const std::string &name,
                                                   reactnativecss::Effect::GetProxy &get);

        // Set a variable in a context (creates an Observable)
        static void
        setVariable(const std::string &key, const std::string &name, const AnyValue &value);

        // Set a variable in a context using an existing Computed
        static void setVariable(const std::string &key, const std::string &name,
                                std::shared_ptr<reactnativecss::Computed<AnyValue>> computed);

        // Set a top-level variable (creates a Computed from AnyValue)
        static void setTopLevelVariable(const std::string &key, const std::string &name,
                                        const AnyValue &value);

    private:
        VariableContext() = delete; // Static-only class

        // Helper to get value from a VariableValue variant
        static AnyValue
        getValue(const VariableValue &varValue, reactnativecss::Effect::GetProxy &get);

        // Helper to check a specific context for the variable
        static std::optional<AnyValue>
        checkContext(const std::string &contextKey, const std::string &name,
                     reactnativecss::Effect::GetProxy &get);
    };

} // namespace margelo::nitro::cssnitro
