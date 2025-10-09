// doctest-based tests for Computed
#define DOCTEST_CONFIG_IMPLEMENT_WITH_MAIN
#include <doctest/doctest.h>

#include <cstdlib>
#include <string>

#include "../Computed.hpp"
#include "../Effect.hpp"
#include "../Observable.hpp"

using nitro::Computed;
using nitro::Effect;
using nitro::Observable;

TEST_CASE("computed sum updates from sources") {
  auto a = Observable<int>::create(1);
  auto b = Observable<int>::create(2);
  auto sum = Computed<int>::create(
      [a, b](const int & /*prev*/, auto &get) { return get(*a) + get(*b); }, 0);

  CHECK(sum->get() == 3);
  a->set(5);
  CHECK(sum->get() == 7);
  b->set(10);
  CHECK(sum->get() == 15);
}

TEST_CASE("external effect subscription is deduplicated") {
  auto src = Observable<int>::create(1);
  auto c = Computed<int>::create(
      [src](const int &, auto &get) { return get(*src) * 2; }, 0);

  int calls = 0;
  Effect ext([&] {
    ++calls;
    (void)c->get(ext); // re-subscribe inside callback
  });

  (void)c->get(ext);
  (void)c->get(ext); // duplicate subscribe; should be ignored

  calls = 0;
  src->set(2);
  CHECK(calls == 1);
}

TEST_CASE("manual override then recompute follows sources") {
  auto a = Observable<int>::create(3);
  auto b = Observable<int>::create(4);
  auto sum = Computed<int>::create(
      [a, b](const int &, auto &get) { return get(*a) + get(*b); }, 0);

  CHECK(sum->get() == 7);
  sum->set(100);
  CHECK(sum->get() == 100);
  a->set(5); // triggers recompute -> 5 + 4 = 9
  CHECK(sum->get() == 9);
}

TEST_CASE("string computed concatenation") {
  auto first = Observable<std::string>::create(std::string{"Ada"});
  auto last = Observable<std::string>::create(std::string{"Lovelace"});
  auto full = Computed<std::string>::create(
      [first, last](const std::string &, auto &get) {
        return get(*first) + std::string{" "} + get(*last);
      },
      std::string{});

  CHECK(full->get() == std::string{"Ada Lovelace"});
  last->set(std::string{"Byron"});
  CHECK(full->get() == std::string{"Ada Byron"});
}

TEST_CASE("computed depending on another computed propagates updates") {
  auto a = Observable<int>::create(1);
  auto b = Observable<int>::create(2);

  // c1 = a + b
  auto c1 = Computed<int>::create(
      [a, b](const int &, auto &get) { return get(*a) + get(*b); }, 0);

  // c2 = c1 * 10 (depends on computed c1)
  auto c2 = Computed<int>::create(
      [c1](const int &, auto &get) { return get(*c1) * 10; }, 0);

  CHECK(c1->get() == 3);
  CHECK(c2->get() == 30);

  a->set(3); // c1 -> 3 + 2 = 5; c2 -> 50
  CHECK(c1->get() == 5);
  CHECK(c2->get() == 50);

  b->set(7); // c1 -> 3 + 7 = 10; c2 -> 100
  CHECK(c1->get() == 10);
  CHECK(c2->get() == 100);

  // Override c1 manually; next source change should recompute and propagate to
  // c2
  c1->set(999);
  CHECK(c1->get() == 999);
  CHECK(c2->get() == 9990);

  a->set(0); // recompute: c1 -> 0 + 7 = 7; c2 -> 70
  CHECK(c1->get() == 7);
  CHECK(c2->get() == 70);
}

TEST_CASE("batched updates coalesce effect runs") {
  auto a = Observable<int>::create(1);
  auto b = Observable<int>::create(2);
  auto sum = Computed<int>::create(
      [a, b](const int &, auto &get) { return get(*a) + get(*b); }, 0);

  int runs = 0;
  Effect spy([&] {
    ++runs;
    (void)sum->get(spy); // subscribe to sum changes
  });

  // Initial subscribe
  (void)sum->get(spy);
  runs = 0;

  // Without batching: two sets would normally cause two runs.
  // With batching: they should coalesce into one.
  Effect::batch([&] {
    a->set(10);
    b->set(20);
  });

  CHECK(sum->get() == 30);
  CHECK(runs == 1);
}

TEST_CASE("unbatched updates run effect for each change") {
  auto a = Observable<int>::create(1);
  auto b = Observable<int>::create(2);
  auto sum = Computed<int>::create(
      [a, b](const int &, auto &get) { return get(*a) + get(*b); }, 0);

  int runs = 0;
  Effect spy([&] {
    ++runs;
    (void)sum->get(spy); // keep subscription up to date
  });

  // Initial subscribe
  (void)sum->get(spy);
  runs = 0;

  // Without batching, two changes should trigger two runs
  a->set(10); // sum -> 12
  b->set(20); // sum -> 30

  CHECK(sum->get() == 30);
  CHECK(runs == 2);
}

TEST_CASE("observable default equality suppresses redundant notifications") {
  auto a = Observable<int>::create(1);
  int runs = 0;
  Effect spy([&] {
    ++runs;
    (void)a->get(spy);
  });
  (void)a->get(spy);
  runs = 0;

  a->set(1); // same value - should not notify
  CHECK(runs == 0);

  a->set(2); // different - notify
  CHECK(runs == 1);
}

// custom equality removed; relying on operator== overrides now

namespace {
struct NearInt {
  int v;
  friend bool operator==(const NearInt &a, const NearInt &b) {
    return std::abs(a.v - b.v) <= 1; // treat values within +/-1 as equal
  }
};
} // namespace

TEST_CASE("observable with custom operator== suppresses notifications") {
  auto a = Observable<NearInt>::create(NearInt{10});

  int runs = 0;
  Effect spy([&] {
    ++runs;
    (void)a->get(spy);
  });
  (void)a->get(spy);
  runs = 0;

  a->set(NearInt{11}); // within tolerance - no notify
  CHECK(runs == 0);

  a->set(NearInt{13}); // beyond tolerance - notify
  CHECK(runs == 1);
}

TEST_CASE("computed is lazy: computes on first get() only") {
  auto a = Observable<int>::create(1);
  auto b = Observable<int>::create(2);
  int computes = 0;

  auto sum = Computed<int>::create(
      [&](const int &, auto &get) {
        ++computes;
        return get(*a) + get(*b);
      },
      0);

  // No compute on creation
  CHECK(computes == 0);

  // Changes before first get do not trigger compute
  a->set(10);
  b->set(20);
  CHECK(computes == 0);

  // First read initializes and computes
  CHECK(sum->get() == 30);
  CHECK(computes == 1);

  // Subsequent source change triggers exactly one compute via subscriptions
  b->set(5);
  CHECK(computes == 2);
  CHECK(sum->get() == 15);
}

TEST_CASE(
    "computed is lazy: get(effect) also initializes on first subscription") {
  auto a = Observable<int>::create(3);
  auto b = Observable<int>::create(4);
  int computes = 0;

  auto sum = Computed<int>::create(
      [&](const int &, auto &get) {
        ++computes;
        return get(*a) + get(*b);
      },
      0);

  CHECK(computes == 0);

  Effect ext([&] {
    // resubscribe to stay subscribed
    (void)sum->get(ext);
  });

  // First subscription initializes
  (void)sum->get(ext);
  CHECK(computes == 1);
  CHECK(sum->get() == 7);

  // Changes trigger recompute after initialization
  a->set(10);
  CHECK(computes == 2);
  CHECK(sum->get() == 14);
}
