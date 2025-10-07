#pragma once

#include "HybridMathSpec.hpp"

using namespace margelo::nitro::cssnitro;

class HybridMath : public HybridMathSpec {
public:
    HybridMath() : HybridObject(TAG) {}

    ~HybridMath() override = default;

    double add(double a, double b) override {
        return a + b + 3;
    }
};
