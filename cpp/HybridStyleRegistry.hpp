#pragma once

#include "HybridStyleRegistrySpec.hpp"

using namespace margelo::nitro::cssnitro;

class HybridStyleRegistry : public HybridStyleRegistrySpec {
public:
    static std::shared_ptr<HybridStyleRegistry> create() {
        // Use a static variable to ensure only one instance is created.
        static auto instance = std::make_shared<HybridStyleRegistry>();
        return instance;
    }

    ~HybridStyleRegistry() override = default;

    void registerClassname(const std::string &className,
                           const std::vector<std::shared_ptr<AnyMap>> &ruleSets) override;

private:
    // Private constructor to prevent direct instantiation.
    HybridStyleRegistry() : HybridObject(TAG) {}

    // Delete copy constructor and assignment operator.
    HybridStyleRegistry(const HybridStyleRegistry&) = delete;
    HybridStyleRegistry& operator=(const HybridStyleRegistry&) = delete;
};
