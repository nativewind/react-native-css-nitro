#include "HybridStyleRegistry.hpp"
#include "Computed.hpp"
#include <regex>
#include <vector>
#include <string>
#include <iterator>

namespace margelo::nitro::cssnitro {

    // Storage for static members
    std::once_flag HybridStyleRegistry::Impl::flag_;
    std::shared_ptr<HybridStyleRegistry::Impl> HybridStyleRegistry::Impl::inst_;

    HybridStyleRegistry::Impl::Impl() = default;

    void HybridStyleRegistry::Impl::set(const std::string &className,
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

    std::vector<std::string>
    HybridStyleRegistry::Impl::registerComponent(const std::string &componentId,
                                                 const std::string &classNames,
                                                 const std::string &variableContext,
                                                 const std::string &containerContext,
                                                 const std::vector<ConfigTuple> & /*configs*/,
                                                 const TestPropFn & /*testPropFn*/) {
        const std::string registrationKey =
                variableContext + "::" + containerContext + "::" + classNames;

        auto previous = component_registration_.find(componentId);
        if (previous != component_registration_.end()) {
            if (previous->second == registrationKey) {
                auto cached = style_computed_.find(registrationKey);
                if (cached != style_computed_.end() && cached->second.computed) {
                    return cached->second.computed->get();
                }
                component_registration_.erase(previous);
            } else {
                releaseRegistration(previous->second);
                component_registration_.erase(previous);
            }
        }

        auto &entry = ensureComputedEntry(registrationKey, classNames);
        ++entry.refCount;

        component_registration_[componentId] = registrationKey;

        return entry.computed->get();
    }

    void HybridStyleRegistry::Impl::unregisterComponent(const std::string &componentId) {
        auto it = component_registration_.find(componentId);
        if (it == component_registration_.end()) {
            return;
        }

        releaseRegistration(it->second);
        component_registration_.erase(it);
    }

    HybridStyleRegistry::Impl::StyleComputedEntry &
    HybridStyleRegistry::Impl::ensureComputedEntry(const std::string &registrationKey,
                                                   const std::string &classNames) {
        using ClassNamesComputed = reactnativecss::Computed<std::vector<std::string>>;
        auto [it, inserted] = style_computed_.try_emplace(registrationKey);
        if (inserted || !it->second.computed) {
            it->second.computed = ClassNamesComputed::create(
                    [classNames](const std::vector<std::string> & /*prev*/,
                                 typename ClassNamesComputed::GetProxy & /*get*/) {
                        std::regex re(R"(\s+)");
                        std::sregex_token_iterator tokenIt(classNames.begin(), classNames.end(), re,
                                                           -1);
                        std::vector<std::string> classes;
                        for (; tokenIt != std::sregex_token_iterator(); ++tokenIt) {
                            if (!tokenIt->str().empty()) {
                                classes.push_back(tokenIt->str());
                            }
                        }
                        return classes;
                    });
            it->second.refCount = 1;
        }
        return it->second;
    }

    void HybridStyleRegistry::Impl::releaseRegistration(const std::string &registrationKey) {
        auto cacheIt = style_computed_.find(registrationKey);
        if (cacheIt == style_computed_.end()) {
            return;
        }

        if (cacheIt->second.refCount == 0) {
            return;
        }

        if (--cacheIt->second.refCount == 0) {
            if (cacheIt->second.computed) {
                cacheIt->second.computed->dispose();
                cacheIt->second.computed.reset();
            }
            style_computed_.erase(cacheIt);
        }
    }

    jsi::Value HybridStyleRegistry::Impl::link(
            jsi::Runtime &runtime, const jsi::Value &thisValue, const jsi::Value *args,
            size_t count) {
        return jsi::Value(1);
    }

    void HybridStyleRegistry::Impl::unlink(double subscriptionId) {
    }
} // namespace margelo::nitro::cssnitro
