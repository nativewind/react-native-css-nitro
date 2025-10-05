// Ensure RN/glog headers are seen before doctest to avoid macro hijacking of
// CHECK macros
#include <string>
#include <vector>

#include "../effect.hpp"
#include "../shadow_tree_manager.hpp"

#include <doctest/doctest.h>

using nitro::Effect;
using Manager =
    nitro::BasicShadowTreeManager<int,
                                  std::unordered_map<std::string, std::string>,
                                  facebook::jsi::Runtime *>;

TEST_CASE("ShadowTreeManager flushes updates to applier and clears queue") {
  Manager mgr(nullptr);

  std::vector<Manager::Updates> calls;
  mgr.setApplier([&](facebook::jsi::Runtime *, Manager::Updates u) {
    calls.push_back(u);
  });

  mgr.addUpdate(1, "color", std::string{"red"});
  REQUIRE(calls.size() == 1);
  CHECK(calls[0].size() == 1);
  CHECK(calls[0].at(1).at("color") == std::string{"red"});

  mgr.addUpdate(2, "width", std::string{"100"});
  REQUIRE(calls.size() == 2);
  CHECK(calls[1].size() == 1);
  CHECK(calls[1].at(2).at("width") == std::string{"100"});
}

TEST_CASE("ShadowTreeManager merges multiple updates within a batch") {
  Manager mgr(nullptr);

  std::vector<Manager::Updates> calls;
  mgr.setApplier([&](facebook::jsi::Runtime *, Manager::Updates u) {
    calls.push_back(u);
  });

  Effect::batch([&] {
    mgr.addUpdate(3, "height", std::string{"200"});
    mgr.addUpdate(3, "color", std::string{"blue"});
  });

  REQUIRE(calls.size() == 1);
  CHECK(calls[0].size() == 1);
  CHECK(calls[0].at(3).at("height") == std::string{"200"});
  CHECK(calls[0].at(3).at("color") == std::string{"blue"});
}
