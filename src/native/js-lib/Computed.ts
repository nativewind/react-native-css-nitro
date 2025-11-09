/**
 * Computed: Derived observable powered by an internal Effect
 * Converted from cpp/Computed.hpp
 */

import { Effect, type GetProxy } from "./Effect";
import { Observable } from "./Observable";

export type ComputeFn<T> = (prev: T, get: GetProxy) => T;

export class Computed<T> {
  private compute: ComputeFn<T>;
  private value: Observable<T>;
  private effect: Effect;
  private initialized = false;

  private constructor(cb: ComputeFn<T>, initial: T) {
    this.compute = cb;
    this.value = Observable.create(initial);
    this.effect = new Effect((get) => {
      this.recompute(get);
    });
  }

  /**
   * Factory: create a computed with optional initial value (defaults to T{})
   */
  static create<T>(cb: ComputeFn<T>, initial?: T): Computed<T> {
    return new Computed(cb, initial as T);
  }

  /**
   * Read current value without subscribing
   */
  get(): T;
  /**
   * Subscribe effect to this computed and return current value
   */
  get(eff?: Effect): T {
    this.ensureInit();
    if (eff !== undefined) {
      return this.value.get(eff);
    }
    return this.value.get();
  }

  /**
   * Allow external overrides if desired
   */
  set(v: T): void {
    this.value.set(v);
  }

  /**
   * Dispose the internal effect
   */
  dispose(): void {
    this.effect.dispose();
  }

  /**
   * Run user compute, using current value as prev and GetProxy for reads
   */
  private recompute(get: GetProxy): void {
    const prev = this.value.get();
    const next = this.compute(prev, get);
    this.value.set(next);
  }

  /**
   * Ensure the effect has been initialized (lazy initialization)
   */
  private ensureInit(): void {
    if (this.initialized) return;
    this.initialized = true;
    this.effect.run();
  }
}
