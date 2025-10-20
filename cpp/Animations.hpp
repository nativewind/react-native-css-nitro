#include "Observable.hpp"
#include "Computed.hpp"
#include <NitroModules/AnyMap.hpp>
#include <string>
#include <memory>

namespace reactnativecss::animations {
    void
    setKeyframes(const std::string &name, const std::shared_ptr<margelo::nitro::AnyMap> &keyframes);

    std::shared_ptr<margelo::nitro::AnyMap>
    getKeyframes(const std::string &name, const std::string &variableScope,
                 reactnativecss::Effect::GetProxy &get);

    void deleteScope(const std::string &variableScope);
} // namespace reactnativecss::animations
