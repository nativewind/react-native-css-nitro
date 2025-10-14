#pragma once

#include <string>
#include <unordered_map>
#include <memory>
#include <NitroModules/AnyMap.hpp>
#include "Observable.hpp"
#include "Effect.hpp"

namespace margelo::nitro::cssnitro {

    using AnyValue = ::margelo::nitro::AnyValue;

    class VariableContext {
    public:
        // Static map: context key -> (variable name -> Observable<AnyValue>)
        static std::unordered_map<std::string, std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<AnyValue>>>> contexts;

        // Create a new context with the given key
        static void createContext(const std::string &key);

        // Delete a context by key
        static void deleteContext(const std::string &key);

        // Get a variable from a context, subscribing the effect to changes
        static const AnyValue &getVariable(const std::string &key, const std::string &name,
                                           reactnativecss::Effect::GetProxy &get);

        // Set a variable in a context
        static void
        setVariable(const std::string &key, const std::string &name, const AnyValue &value);

        // Set a variable in a context using an existing Observable
        static void setVariable(const std::string &key, const std::string &name,
                                std::shared_ptr<reactnativecss::Observable<AnyValue>> observable);

    private:
        VariableContext() = delete; // Static-only class
    };

} // namespace margelo::nitro::cssnitro
