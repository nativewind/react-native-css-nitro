#pragma once

#include "HybridStyleRegistrySpec.hpp"
#include "Observable.hpp"
#include "HybridStyleRule+Equality.hpp"
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

    class ShadowTreeUpdateManager;

    class HybridStyleRegistry : public HybridStyleRegistrySpec {
    public:
        HybridStyleRegistry();

        ~HybridStyleRegistry() override;

        // Shorthand aliases
        using PropValue = std::variant<std::string, double, bool>;
        using PropPath = std::vector<std::string>;
        using SelectorAndArgs = std::tuple<std::string, std::vector<std::string>>;

        // ----- public API forwarded to Impl -----
        void setClassname(const std::string &className,
                          const std::vector<HybridStyleRule> &styleRule) override;

        void addStyleSheet(const HybridStyleSheet &stylesheet) override;

        void setRootVariables(const std::shared_ptr<AnyMap> &variables) override;

        void setUniversalVariables(const std::shared_ptr<AnyMap> &variables) override;

        Declarations getDeclarations(const std::string &componentId, const std::string &classNames,
                                     const std::string &variableScope,
                                     const std::string &containerScope) override;

        Styled
        registerComponent(const std::string &componentId, const std::function<void()> &rerender,
                          const std::string &classNames, const std::string &variableScope,
                          const std::string &containerScope) override;

        void deregisterComponent(const std::string &componentId) override;

        void updateComponentState(const std::string &componentId, PseudoClassType type,
                                  bool value) override;

        void unlinkComponent(const std::string &componentId) override;

        void updateComponentInlineStyleKeys(const std::string &componentId,
                                            const std::vector<std::string> &inlineStyleKeys) override;

        void
        setWindowDimensions(double width, double height, double scale, double fontScale) override;

    protected:
        void loadHybridMethods() override;

    private:
        jsi::Value linkComponent(jsi::Runtime &runtime,
                                 const jsi::Value &thisValue,
                                 const jsi::Value *args, size_t count);

        jsi::Value registerExternalMethods(jsi::Runtime &runtime,
                                           const jsi::Value &thisValue,
                                           const jsi::Value *args, size_t count);

        // Static shared state
        static std::unique_ptr<ShadowTreeUpdateManager> shadowUpdates_;
        static std::unordered_map<std::string, std::shared_ptr<reactnativecss::Computed<Styled>>> computedMap_;
        static std::unordered_map<std::string, std::shared_ptr<reactnativecss::Observable<std::vector<HybridStyleRule>>>> styleRuleMap_;
    };

} // namespace margelo::nitro::cssnitro
