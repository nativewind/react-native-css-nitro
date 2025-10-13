#pragma once

#include <folly/dynamic.h>
#include <NitroModules/AnyMap.hpp>
#include <memory>
#include <vector>

namespace margelo::nitro::cssnitro {

// Convert NitroModules AnyValue to folly::dynamic
    folly::dynamic toDynamic(const ::margelo::nitro::AnyValue &v);

// Convert NitroModules AnyMap to folly::dynamic object
    folly::dynamic toDynamic(const ::margelo::nitro::AnyMap &m);

// Convert an array of AnyMap (as shared_ptr) to folly::dynamic array
    folly::dynamic toDynamic(const std::vector<std::shared_ptr<::margelo::nitro::AnyMap>> &arr);

} // namespace margelo::nitro::cssnitro
