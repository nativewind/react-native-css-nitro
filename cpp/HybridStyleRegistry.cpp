#include "HybridStyleRegistry.hpp"

namespace margelo::nitro::cssnitro {

    // Storage for static members
    std::once_flag HybridStyleRegistry::Impl::flag_;
    std::shared_ptr<HybridStyleRegistry::Impl> HybridStyleRegistry::Impl::inst_;

    HybridStyleRegistry::Impl::Impl() = default;

    void HybridStyleRegistry::Impl::registerClassname(const std::string &className,
                                                      const StyleRule &styleRule) {
        if (auto existing = getClassnameObservable(className)) {
            existing->set(styleRule);
            return;
        }

        auto observable = reactnativecss::Observable<StyleRule>::create(styleRule);
        {
            auto [it, inserted] = styleRules_.emplace(className, observable);
            if (!inserted) {
                if (auto &stored = it->second) {
                    stored->set(styleRule);
                    return;
                }
                it->second = observable;
            }
        }
    }

    std::shared_ptr<reactnativecss::Observable<StyleRule>>
    HybridStyleRegistry::Impl::getClassnameObservable(
            const std::string &className) const {
        auto it = styleRules_.find(className);
        if (it == styleRules_.end()) {
            return nullptr;
        }
        return it->second;
    }

    ClassnameData HybridStyleRegistry::Impl::registerComponent(
            const std::string &componentId, const std::string &classNames,
            double variableContext, double containerContext,
            const std::vector<ConfigTuple> &configs, const TestPropFn &testPropFn) {
        return ClassnameData(variableContext, containerContext);;
    }

    void HybridStyleRegistry::Impl::unsubscribeComponentRef(double subscriptionId) {
    }

    jsi::Value HybridStyleRegistry::Impl::subscribeComponentRef(
            jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args,
            size_t count) {
        return jsi::Value(1);
    }
} // namespace margelo::nitro::cssnitro
