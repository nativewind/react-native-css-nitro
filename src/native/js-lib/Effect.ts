/**
 * Effect: Reactive effect system with batching support
 * Converted from cpp/Effect.hpp
 */

import type { Computed } from "./Computed";
import type { Observable } from "./Observable";

export type Remover = () => void;
export type Callback = (get: GetProxy) => void;

export type GetProxy = <T>(gettable: Computed<T> | Observable<T>) => T;

export class Effect {
  private callback: Callback;
  private removers: Remover[] = [];

  // Per-thread (per-execution) batching state
  private static batchDepth = 0;
  private static pending: Effect[] = [];
  private static pendingSet = new Set<Effect>();

  constructor(callback: Callback | (() => void)) {
    if (callback.length === 0) {
      // Backward-compat: allow constructing with a no-arg callback
      this.callback = (() => {
        (callback as () => void)();
      }) as Callback;
    } else {
      this.callback = callback as Callback;
    }
  }

  /**
   * Register a remover to undo a single subscription this effect created
   */
  subscribe(remover: Remover): void {
    this.removers.push(remover);
  }

  /**
   * Dispose all current subscriptions owned by this effect
   */
  dispose(): void {
    const copy = this.removers.slice();
    this.removers = [];
    for (const rem of copy) {
      rem();
    }
  }

  /**
   * Rerun the effect: drop current subscriptions, then call the callback
   */
  run(): void {
    if (Effect.batchDepth > 0) {
      // Coalesce within this batch
      if (!Effect.pendingSet.has(this)) {
        Effect.pendingSet.add(this);
        Effect.pending.push(this);
      }
      return;
    }
    this.runImmediate();
  }

  /**
   * Immediate execution helper
   */
  private runImmediate(): void {
    this.dispose();
    const get: GetProxy = ((target: any) => {
      if ("get" in target && typeof target.get === "function") {
        return target.get(this);
      }
      throw new Error("Invalid argument to get proxy");
    }) as GetProxy;
    this.callback(get);
  }

  /**
   * Begin a batch. During a batch, run() calls are queued and flushed once.
   */
  static beginBatch(): void {
    Effect.batchDepth++;
  }

  /**
   * End a batch. If we're at depth 0, flush pending effects.
   */
  static endBatch(): void {
    if (Effect.batchDepth === 0) return;
    Effect.batchDepth--;
    if (Effect.batchDepth === 0) {
      Effect.flushPending();
    }
  }

  /**
   * Execute a function within a batch context
   */
  static batch<T>(fn: () => T): T {
    Effect.beginBatch();
    try {
      const result = fn();
      Effect.endBatch();
      return result;
    } catch (error) {
      Effect.endBatch();
      throw error;
    }
  }

  /**
   * Flush all pending effects
   */
  private static flushPending(): void {
    // Swap out current queue to allow re-entrancy
    const queue = Effect.pending.slice();
    Effect.pending = [];
    Effect.pendingSet.clear();

    for (const e of queue) {
      e.runImmediate();
    }
  }
}
