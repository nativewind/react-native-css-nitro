#pragma once

#include <jsi/jsi.h>
#include <jsi/JSIDynamic.h>
#include <folly/dynamic.h>
#include <unordered_set>

using namespace facebook;

namespace margelo::nitro::cssnitro::helpers {

    using Variants = std::vector<std::pair<std::string, std::string>>;

    inline void assertThat(jsi::Runtime &rt, bool condition, const std::string &message) {
        if (!condition) {
            throw jsi::JSError(rt, message);
        }
    }
}
