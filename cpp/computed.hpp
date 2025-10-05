// Computed<T>: derived observable powered by an internal Effect
#pragma once

#include <atomic>
#include <functional>
#include <memory>
#include <mutex>
#include <utility>

#include "effect.hpp"
#include "observable.hpp"

namespace nitro {

// A Computed<T> exposes the same public API as Observable<T>:
// - create(cb, [initial])
// - get()
// - get(effect)
// - set(...)
// It maintains its value by running `cb(prev, get)` inside an internal Effect
// where `get(o)` reads and subscribes to any Observable<U> used.

template <class T> class Computed {
public:
  // Proxy passed to user callback; calling get(obs) performs obs.get(effect_)
  struct GetProxy {
    Computed *self;
    template <class U>
    inline const U &operator()(Observable<U> &obs) const noexcept {
      return obs.get(self->effect_);
    }
    // Allow dependencies on other Computed<U>
    template <class U>
    inline const U &operator()(::nitro::Computed<U> &comp) const noexcept {
      return comp.get(self->effect_);
    }
  };

  using ComputeFn = std::function<T(const T &prev, GetProxy &get)>;

  // Factory: optional initial value (defaults to T{})
  template <class U = T>
  static std::shared_ptr<Computed> create(ComputeFn cb, U &&initial = U{}) {
    auto ptr = std::shared_ptr<Computed>(
        new Computed(std::move(cb), std::forward<U>(initial)));
    return ptr;
  }

  // Read current value
  inline const T &get() const noexcept {
    ensureInit();
    return value_->get();
  }

  // Subscribe effect to this computed
  inline const T &get(Effect &eff) {
    ensureInit();
    return value_->get(eff);
  }

  // Allow external overrides if desired
  template <class V> inline void set(V &&v) { value_->set(std::forward<V>(v)); }

private:
  template <class U>
  explicit Computed(ComputeFn cb, U &&initial)
      : compute_(std::move(cb)),
        value_(Observable<T>::create(std::forward<U>(initial))),
        effect_([this] { recompute(); }) {}

  // Run user compute, using current value as prev and GetProxy for reads
  void recompute() {
    GetProxy g{this};
    const T &prev = value_->get();
    T next = compute_(prev, g);
    value_->set(std::move(next));
  }

  ComputeFn compute_;
  std::shared_ptr<Observable<T>> value_;
  mutable Effect effect_;
  // lazy init state
  mutable std::atomic<bool> initialized_{false};
  mutable std::mutex init_mutex_;

  inline void ensureInit() const {
    if (initialized_.load(std::memory_order_acquire))
      return;
    std::lock_guard<std::mutex> lk(init_mutex_);
    if (!initialized_.load(std::memory_order_relaxed)) {
      const_cast<Effect &>(effect_).run();
      initialized_.store(true, std::memory_order_release);
    }
  }
};

} // namespace nitro
