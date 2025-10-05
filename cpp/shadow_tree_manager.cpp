#include "shadow_tree_manager.hpp"
#include <react/renderer/uimanager/UIManagerBinding.h>

namespace nitro {

template <>
struct ShadowApplierTraits<facebook::react::Tag,
                           std::unordered_map<std::string, folly::dynamic>,
                           facebook::jsi::Runtime *> {
  template <class Manager>
  static inline void installDefaultApplier(Manager &mgr) {
    mgr.setApplier(
        [](facebook::jsi::Runtime *rt, typename Manager::Updates updates) {
          if (!rt)
            return;
          facebook::react::UIManagerBinding::getBinding(*rt)
              ->getUIManager()
              .updateShadowTree(std::move(updates));
        });
  }
};

// Explicitly instantiate the template for the RN production types to ensure
// linkage.
template class ShadowTreeManager<
    facebook::react::Tag, std::unordered_map<std::string, folly::dynamic>,
    facebook::jsi::Runtime *>;

} // namespace nitro
