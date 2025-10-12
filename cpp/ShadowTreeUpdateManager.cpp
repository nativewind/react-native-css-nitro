#include "ShadowTreeUpdateManager.hpp"

#include "Observable.hpp"
#include "Computed.hpp"

#include <jsi/jsi.h>
#include <folly/dynamic.h>
#include <react/renderer/core/ReactPrimitives.h>

#if __has_include(<react/renderer/uimanager/UIManagerBinding.h>)

#include <react/renderer/uimanager/UIManagerBinding.h>

#define HAS_UIMANAGER_BINDING 1
#else
#define HAS_UIMANAGER_BINDING 0
#endif

namespace margelo {
    namespace nitro {
        namespace cssnitro {

            using jsi::Runtime;
            using reactnativecss::Observable;
            using reactnativecss::Computed;

            ShadowTreeUpdateManager::ShadowTreeUpdateManager() = default;

            void ShadowTreeUpdateManager::linkComponent(Runtime &runtime,
                                                        const std::string &componentId,
                                                        facebook::react::Tag tag) {
                component_links_[componentId] = ComponentLink{tag, &runtime};
                ensureRuntimeEffect(runtime);
            }

            void ShadowTreeUpdateManager::unlinkComponent(const std::string &componentId) {
                auto it = component_links_.find(componentId);
                if (it != component_links_.end()) component_links_.erase(it);
            }

            void ShadowTreeUpdateManager::addUpdates(const std::string &componentId,
                                                     const folly::dynamic &payload) {
                auto it = component_links_.find(componentId);
                if (it == component_links_.end()) return;

                ComponentLink &link = it->second;
                if (link.runtime == nullptr) return;

                auto &obs = runtime_updates_[link.runtime];
                if (!obs) {
                    obs = Observable<UpdatesMap>::create(UpdatesMap{});
                }
                UpdatesMap cur = obs->get();
                cur[link.tag] = payload;
                obs->set(std::move(cur));
            }

            void ShadowTreeUpdateManager::ensureRuntimeEffect(Runtime &runtime) {
                auto *rt = &runtime;
                auto rtObsIt = runtime_updates_.find(rt);
                if (rtObsIt == runtime_updates_.end()) {
                    auto obs = Observable<UpdatesMap>::create(UpdatesMap{});
                    rtObsIt = runtime_updates_.emplace(rt, std::move(obs)).first;
                }
                if (runtime_effects_.find(rt) == runtime_effects_.end()) {
                    auto obs = rtObsIt->second;
                    auto effect = Computed<bool>::create(
                            [this, obs, rt](const bool &prev,
                                            Computed<bool>::GetProxy &get) -> bool {
                                (void) prev;
                                const UpdatesMap &updates = get(*obs);
                                if (updates.empty()) return false;
                                applyUpdates(*rt, updates);
                                obs->set(UpdatesMap{});
                                return true;
                            },
                            false
                    );
                    runtime_effects_.emplace(rt, std::move(effect));
                }
            }

            void
            ShadowTreeUpdateManager::applyUpdates(Runtime &runtime, const UpdatesMap &updates) {
#if HAS_UIMANAGER_BINDING
                if (updates.empty()) return;
                auto binding = facebook::react::UIManagerBinding::getBinding(runtime);
                if (!binding) return;
                auto &uiManager = binding->getUIManager();
                uiManager.updateShadowTree(updates);
#else
                (void) runtime; (void) updates;
#endif
            }

        }
    }
} // namespace margelo::nitro::cssnitro

