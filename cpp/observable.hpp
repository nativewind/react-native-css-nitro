#pragma once

#include <memory>
#include <shared_mutex>
#include <unordered_set>
#include <utility>
#include <vector>

#include "effect.hpp"

namespace nitro {

template <class T> class Observable {
public:
  template <class U> static std::shared_ptr<Observable> create(U &&initial);

  const T &get() const noexcept;
  const T &get(Effect &eff) noexcept;

  template <class V>
  void set(V &&v) noexcept(noexcept(updateAndNotify(std::forward<V>(v)))) {
    updateAndNotify(std::forward<V>(v));
  }

private:
  template <class U>
  explicit Observable(U &&initial) noexcept(
      noexcept(T(std::forward<U>(initial))));
  // Internal: called by the effect's remover lambda to detach
  void remove(Effect *eff) noexcept;
  template <class V>
  void updateAndNotify(V &&v) noexcept(noexcept(value_ = std::forward<V>(v)));

  mutable std::shared_mutex mutex_;
  T value_{};
  std::unordered_set<Effect *> effects_;
  std::weak_ptr<Observable> weak_;
};

// Inline template definitions keep Observable<T> generic

template <class T>
template <class U>
inline std::shared_ptr<Observable<T>> Observable<T>::create(U &&initial) {
  // Note: std::make_shared cannot access a private constructor; use direct new.
  auto ptr = std::shared_ptr<Observable<T>>(
      new Observable<T>(std::forward<U>(initial)));
  ptr->weak_ = ptr;
  return ptr;
}

template <class T> inline const T &Observable<T>::get() const noexcept {
  std::shared_lock<std::shared_mutex> lk(mutex_);
  return value_;
}

template <class T> inline const T &Observable<T>::get(Effect &eff) noexcept {
  auto self = weak_.lock();
  if (!self)
    return value_;
  {
    std::unique_lock<std::shared_mutex> lk(mutex_);
    auto [it, inserted] = effects_.insert(&eff);
    if (!inserted)
      return value_;
    eff.subscribe([w = weak_, effPtr = &eff]() {
      if (auto s = w.lock())
        s->remove(effPtr);
    });
  }
  return value_;
}

// set(V&&) is in-class and forwards to updateAndNotify

template <class T>
template <class U>
inline Observable<T>::Observable(U &&initial) noexcept(
    noexcept(T(std::forward<U>(initial))))
    : value_(std::forward<U>(initial)) {}

template <class T> inline void Observable<T>::remove(Effect *eff) noexcept {
  std::unique_lock<std::shared_mutex> lk(mutex_);
  effects_.erase(eff);
}

template <class T>
template <class V>
inline void Observable<T>::updateAndNotify(V &&v) noexcept(
    noexcept(value_ = std::forward<V>(v))) {
  std::vector<Effect *> current;
  {
    std::unique_lock<std::shared_mutex> lk(mutex_);
    if (value_ == v)
      return; // no change
    value_ = std::forward<V>(v);
    current.reserve(effects_.size());
    for (auto *e : effects_)
      current.push_back(e);
  }
  for (auto *e : current)
    if (e)
      e->run();
}
} // namespace nitro