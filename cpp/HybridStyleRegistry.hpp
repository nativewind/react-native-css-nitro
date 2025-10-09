#pragma once

#include "HybridStyleRegistrySpec.hpp"
#include "Observable.hpp"
#include "StyleRule+Equality.hpp"

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
        using OptionalAnyMap = std::optional<std::shared_ptr<AnyMap>>;
        using ConfigTuple = std::tuple<std::string, std::vector<std::string>,
                OptionalAnyMap, std::vector<SelectorAndArgs>>;
        using TestPropFn = std::function<bool(const PropPath &, const PropValue &)>;

        // ----- public API forwarded to Impl -----
        void registerClassname(const std::string &className,
                               const StyleRule &styleRule) override {
            impl_->registerClassname(className, styleRule);
        }

        ClassnameData registerComponent(const std::string &componentId,
                                        const std::string &classNames,
                                        double variableContext,
                                        double containerContext,
                                        const std::vector<ConfigTuple> &configs,
                                        const TestPropFn &testPropFn) override {
            return impl_->registerComponent(componentId, classNames, variableContext,
                                            containerContext, configs, testPropFn);
        }

        void unsubscribeComponentRef(double subscriptionId) override {
            impl_->unsubscribeComponentRef(subscriptionId);
        }

        jsi::Value subscribeComponentRef(jsi::Runtime &runtime,
                                         const jsi::Value &thisValue,
                                         const jsi::Value *args, size_t count) {
            return impl_->subscribeComponentRef(runtime, thisValue, args, count);
        }

    protected:
        void loadHybridMethods() override {
            HybridStyleRegistrySpec::loadHybridMethods();
            registerHybrids(this, [](Prototype &prototype) {
                prototype.registerRawHybridMethod(
                        "subscribeComponentRef", 3,
                        &HybridStyleRegistry::subscribeComponentRef);
            });
        }

    private:
        struct Impl {
            Impl();

            void registerClassname(const std::string &className,
                                   const StyleRule &styleRule);

            std::shared_ptr<reactnativecss::Observable<StyleRule>>
            getClassnameObservable(const std::string &className) const;

            ClassnameData registerComponent(const std::string &componentId,
                                            const std::string &classNames,
                                            double variableContext,
                                            double containerContext,
                                            const std::vector<ConfigTuple> &configs,
                                            const TestPropFn &testPropFn);

            void unsubscribeComponentRef(double subscriptionId);

            jsi::Value subscribeComponentRef(jsi::Runtime &runtime,
                                             const jsi::Value &thisValue,
                                             const jsi::Value *args, size_t count);

            static std::shared_ptr<Impl> get() {
                std::call_once(flag_, [] { inst_.reset(new Impl()); });
                return inst_;
            }

            static std::once_flag flag_;
            static std::shared_ptr<Impl> inst_;

            std::unordered_map<std::string,
                    std::shared_ptr<reactnativecss::Observable<StyleRule>>>
                    styleRules_;
        };

        std::shared_ptr<Impl> impl_;
    };

} // namespace margelo::nitro::cssnitro
