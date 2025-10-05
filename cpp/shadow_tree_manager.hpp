#pragma once

#include <functional>
#include <memory>
#include <string>
#include <unordered_map>
#include <utility>

#include "effect.hpp"
#include "observable.hpp"
#include <folly/dynamic.h>
#include <jsi/jsi.h>
#include <react/renderer/uimanager/primitives.h>

namespace nitro {

template <typename Tag, typename DynamicObject, typename RuntimePtr = void *>
class BasicShadowTreeManager {
public:
  using Updates = std::unordered_map<Tag, DynamicObject>;

  explicit BasicShadowTreeManager(RuntimePtr rt = nullptr)
      : rt_(rt), tagsToProps(Observable<Updates>::create(Updates{})),
        effect_([this] {
          Updates pending = tagsToProps->get(effect_);
          if (pending.empty()) {
            return;
          }
          tagsToProps->set(Updates{});
          applyToShadowTree(std::move(pending));
        }) {
    (void)tagsToProps->get(effect_);
  }

  // Merge a whole object into a tag's props; later keys overwrite earlier ones.
  void addUpdate(Tag tag, const DynamicObject &props) {
    auto current = tagsToProps->get();
    auto &dst = current[tag];
    for (const auto &kv : props) {
      dst[kv.first] = kv.second;
    }
    tagsToProps->set(std::move(current));
  }

  // Convenience: set a single property
  template <typename Value>
  void addUpdate(Tag tag, std::string key, Value value) {
    auto current = tagsToProps->get();
    current[tag][std::move(key)] = std::move(value);
    tagsToProps->set(std::move(current));
  }

  void setApplier(std::function<void(RuntimePtr, Updates)> applier) {
    applier_ = std::move(applier);
  }

private:
  void applyToShadowTree(Updates updates) {
    if (applier_) {
      applier_(rt_, std::move(updates));
    }
  }

  RuntimePtr rt_;
  std::shared_ptr<Observable<Updates>> tagsToProps;
  Effect effect_;
  std::function<void(RuntimePtr, Updates)> applier_;
};

// RN-specific manager with default applier wired via dlsym.
class ShadowTreeManager
    : public BasicShadowTreeManager<
          facebook::react::Tag, std::unordered_map<std::string, folly::dynamic>,
          facebook::jsi::Runtime *> {
  using Base =
      BasicShadowTreeManager<facebook::react::Tag,
                             std::unordered_map<std::string, folly::dynamic>,
                             facebook::jsi::Runtime *>;

public:
  using Base::BasicShadowTreeManager;

  explicit ShadowTreeManager(facebook::jsi::Runtime *rt);
};

} // namespace nitro
