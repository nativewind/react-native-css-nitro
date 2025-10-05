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

// Traits hook to install platform-specific default applier; default is no-op.
template <typename Tag, typename DynamicObject, typename RuntimePtr>
struct ShadowApplierTraits {
  template <class Manager>
  static inline void installDefaultApplier(Manager &) {}
};

template <typename Tag, typename DynamicObject, typename RuntimePtr = void *>
class ShadowTreeManager {
public:
  using Updates = std::unordered_map<Tag, DynamicObject>;

  explicit ShadowTreeManager(RuntimePtr rt = nullptr)
      : rt_(rt), tagsToProps(Observable<Updates>::create(Updates{})),
        effect_([this] {
          Updates pending = tagsToProps->get(effect_);
          if (pending.empty()) {
            return;
          }
          tagsToProps->set(Updates{});
          // Isolate application: if addUpdate() is called from within the
          // applier, defer the resulting effect run until after we finish
          // applying the current batch.
          Effect::batch([this, p = std::move(pending)]() mutable {
            applyToShadowTree(std::move(p));
          });
        }) {
    (void)tagsToProps->get(effect_);
    // Allow platform specializations to set a default applier.
    ShadowApplierTraits<Tag, DynamicObject, RuntimePtr>::installDefaultApplier(
        *this);
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

} // namespace nitro
