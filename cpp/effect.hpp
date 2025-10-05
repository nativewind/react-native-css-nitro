#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <utility>
#include <vector>

namespace nitro {

class Effect {
public:
  using Callback = std::function<void()>;

  explicit Effect(Callback cb) : callback_(std::move(cb)) {}
  Effect(const Effect &) = delete;
  Effect &operator=(const Effect &) = delete;
  Effect(Effect &&) = delete;
  Effect &operator=(Effect &&) = delete;
  ~Effect() { dispose(); }

  // Register a remover to undo a single subscription this effect created
  void subscribe(std::function<void()> remover) {
    std::lock_guard<std::mutex> lk(mutex_);
    removers_.push_back(std::move(remover));
  }

  // Dispose all current subscriptions owned by this effect
  void dispose() {
    std::vector<std::function<void()>> copy;
    {
      std::lock_guard<std::mutex> lk(mutex_);
      copy.swap(removers_);
    }
    for (auto &rem : copy)
      if (rem)
        rem();
  }

  // Rerun the effect: drop current subscriptions, then call the callback
  void run() {
    dispose();
    if (callback_)
      callback_();
  }

private:
  Callback callback_;
  mutable std::mutex mutex_;
  std::vector<std::function<void()>> removers_;
};

} // namespace nitro
