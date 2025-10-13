#pragma once

#include <functional>
#include <memory>
#include <mutex>
#include <unordered_set>
#include <utility>
#include <vector>

namespace reactnativecss {

    // Forward declarations to allow Effect::GetProxy operators without including headers here
    template<class T>
    class Observable;

    template<class T>
    class Computed;

    class Effect {
    public:
        struct GetProxy {
            Effect *self;

            template<class U>
            inline const U &operator()(Observable<U> &obs) const noexcept {
                return obs.get(*self);
            }

            template<class U>
            inline const U &operator()(Computed<U> &comp) const noexcept {
                return comp.get(*self);
            }
        };

        using Callback = std::function<void(GetProxy &)>;

        explicit Effect(Callback cb) : callback_(std::move(cb)) {}

        // Backward-compat: allow constructing with a no-arg callback
        explicit Effect(std::function<void()> cb)
                : callback_([fn = std::move(cb)](GetProxy &) { if (fn) fn(); }) {}

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
            for (auto &rem: copy)
                if (rem)
                    rem();
        }

        // Rerun the effect: drop current subscriptions, then call the callback
        void run() {
            if (s_batchDepth > 0) {
                // Coalesce within this thread's batch
                if (s_pendingSet.insert(this).second) {
                    s_pending.push_back(this);
                }
                return;
            }
            runImmediate();
        }

        // Begin/end a batch. During a batch, run() calls are queued and flushed once.
        static void beginBatch() { ++s_batchDepth; }

        static void endBatch() {
            if (s_batchDepth == 0)
                return;
            if (--s_batchDepth == 0) {
                flushPending();
            }
        }

        template<class F>
        static void batch(F &&fn) {
            beginBatch();
            try {
                std::forward<F>(fn)();
            } catch (...) {
                endBatch();
                throw;
            }
            endBatch();
        }

    private:
        Callback callback_;
        mutable std::mutex mutex_;
        std::vector<std::function<void()>> removers_;

        // Immediate execution helper
        void runImmediate() {
            dispose();
            if (callback_) {
                GetProxy g{this};
                callback_(g);
            }
        }

        // Per-thread batching state
        static inline thread_local int s_batchDepth = 0;
        static inline thread_local std::vector<Effect *> s_pending{};
        static inline thread_local std::unordered_set<Effect *> s_pendingSet{};

        static void flushPending() {
            // Swap out current queue to allow re-entrancy
            std::vector<Effect *> queue;
            queue.swap(s_pending);
            s_pendingSet.clear();
            for (Effect *e: queue) {
                if (e)
                    e->runImmediate();
            }
        }
    };

} // namespace reactnativecss
