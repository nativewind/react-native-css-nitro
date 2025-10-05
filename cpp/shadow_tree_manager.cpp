#include "shadow_tree_manager.hpp"

#include <react/renderer/uimanager/UIManagerBinding.h>

namespace nitro {

ShadowTreeManager::ShadowTreeManager(facebook::jsi::Runtime *rt) : Base(rt) {
  this->setApplier([](facebook::jsi::Runtime *rt, Base::Updates updates) {
    if (!rt) {
      return;
    }
    auto *binding = facebook::react::UIManagerBinding::getBinding(*rt);
    binding->getUIManager().updateShadowTree(std::move(updates));
  });
}

} // namespace nitro
#include "shadow_tree_manager.hpp"

#include <react/renderer/uimanager/UIManagerBinding.h>

namespace nitro {

ShadowTreeManager::ShadowTreeManager(facebook::jsi::Runtime *rt) : Base(rt) {
  this->setApplier([](facebook::jsi::Runtime *rt, Base::Updates updates) {
    if (!rt)
      return;
    auto *binding = facebook::react::UIManagerBinding::getBinding(*rt);
    binding->getUIManager().updateShadowTree(std::move(updates));
  });
}

} // namespace nitro
