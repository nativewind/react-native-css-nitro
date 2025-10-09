#pragma once

#include "HybridStyleRegistrySpec.hpp"
#include "Observable.hpp"
#include "StyleRule+Equality.hpp"

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
        HybridStyleRegistry()
                : HybridObject(
                "HybridStyleRegistry"), // adjust if Spec doesn’t take a name
                  impl_(Impl::get()) {}

        ~HybridStyleRegistry() override = default;

        // Shorthand aliases
        using PropValue = std::variant<std::string, double, bool>;
        using PropPath = std::vector<std::string>;
        using SelectorAndArgs = std::tuple<std::string, std::vector<std::string>>;
        using ConfigTuple = std::tuple<std::string, std::vector<std::string>, std::vector<SelectorAndArgs>>;
        using TestPropFn = std::function<bool(const PropPath &, const PropValue &)>;

        // ----- public API forwarded to Impl -----
        void set(const std::string &className,
                 const StyleRule &styleRule) override {
            impl_->set(className, styleRule);
        }

        std::vector<std::string> registerComponent(const std::string &componentId,
                                                   const std::string &classNames,
                                                   const std::string &variableContext,
                                                   const std::string &containerContext,
                                                   const std::vector<ConfigTuple> &configs,
                                                   const TestPropFn &testPropFn) override {
            return impl_->registerComponent(componentId, classNames, variableContext,
                                            containerContext, configs,
                                            testPropFn);
        }

        void unregisterComponent(const std::string &componentId) override {
            return impl_->unregisterComponent(componentId);

        }


        jsi::Value link(jsi::Runtime &runtime,
                        const jsi::Value &thisValue,
                        const jsi::Value *args, size_t count) {
            return impl_->link(runtime, thisValue, args, count);
        }

        void unlink(double subscriptionId) override {
            impl_->unlink(subscriptionId);
        }

    protected:
        void loadHybridMethods() override {
            HybridStyleRegistrySpec::loadHybridMethods();
            registerHybrids(this, [](Prototype &prototype) {
                prototype.registerRawHybridMethod(
                        "subscribe",
                        3,
                        &HybridStyleRegistry::link);
            });
        }

    private:
        struct Impl {
            Impl();

            struct StyleComputedEntry {
                std::shared_ptr<reactnativecss::Computed<std::vector<std::string>>> computed;
                std::size_t refCount = 0;
            };

            void set(const std::string &className, const StyleRule &styleRule);

            std::shared_ptr<reactnativecss::Observable<StyleRule>>
            getClassnameObservable(const std::string &className) const;

            std::vector<std::string> registerComponent(const std::string &componentId,
                                                       const std::string &classNames,
                                                       const std::string &variableContext,
                                                       const std::string &containerContext,
                                                       const std::vector<ConfigTuple> &configs,
                                                       const TestPropFn &testPropFn);

            void unregisterComponent(const std::string &componentId);

            StyleComputedEntry &ensureComputedEntry(const std::string &registrationKey,
                                                    const std::string &classNames);

            void releaseRegistration(const std::string &registrationKey);

            jsi::Value link(jsi::Runtime &runtime,
                            const jsi::Value &thisValue,
                            const jsi::Value *args, size_t count);

            void unlink(double subscriptionId);

            static std::shared_ptr<Impl> get() {
                std::call_once(flag_, [] { inst_.reset(new Impl()); });
                return inst_;
            }

            static std::once_flag flag_;
            static std::shared_ptr<Impl> inst_;

            std::unordered_map<std::string,
                    std::shared_ptr<reactnativecss::Observable<StyleRule>>>
                    styleRules_;
            std::unordered_map<std::string, std::string> component_registration_;
            std::unordered_map<std::string, StyleComputedEntry> style_computed_;
        };

        std::shared_ptr<Impl> impl_;
    };

} // namespace margelo::nitro::cssnitro
