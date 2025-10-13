#pragma once

#include "HybridStyleRegistrySpec.hpp"
#include "Observable.hpp"
#include "StyleRule+Equality.hpp"
#include "Styled+Equality.hpp"

#include <cstddef>
#include <functional>
#include <memory>
#include <mutex>
#include <optional>
#include <string>
#include <tuple>
#include <unordered_map>
#include <utility>
#include <variant>
#include <vector>

namespace reactnativecss {
    template<typename T>
    class Computed;
}

namespace margelo::nitro::cssnitro {

    class HybridStyleRegistry : public HybridStyleRegistrySpec {
    public:
        HybridStyleRegistry();

        ~HybridStyleRegistry() override;

        // Shorthand aliases
        using PropValue = std::variant<std::string, double, bool>;
        using PropPath = std::vector<std::string>;
        using SelectorAndArgs = std::tuple<std::string, std::vector<std::string>>;

        // ----- public API forwarded to Impl -----
        void set(const std::string &className,
                 const StyleRule &styleRule) override;

        Declarations getDeclarations(const std::string &componentId, const std::string &classNames,
                                     const std::string &variableScope,
                                     const std::string &containerScope) override;

        Styled
        registerComponent(const std::string &componentId, const std::function<void()> &rerender,
                          const std::string &classNames, const std::string &variableScope,
                          const std::string &containerScope) override;

        void deregisterComponent(const std::string &componentId) override;

        void updateComponentState(const std::string &componentId,
                                  UpdateComponentStateFns type) override;

        void unlinkComponent(const std::string &componentId) override;

        void updateComponentInlineStyleKeys(const std::string &componentId,
                                            const std::vector<std::string> &inlineStyleKeys) override;

    protected:
        void loadHybridMethods() override;

    private:
        struct Impl;
        std::shared_ptr<Impl> impl_;

        jsi::Value linkComponent(jsi::Runtime &runtime,
                                 const jsi::Value &thisValue,
                                 const jsi::Value *args, size_t count);

        jsi::Value registerExternalMethods(jsi::Runtime &runtime,
                                           const jsi::Value &thisValue,
                                           const jsi::Value *args, size_t count);
    };

} // namespace margelo::nitro::cssnitro
