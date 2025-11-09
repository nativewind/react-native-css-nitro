/**
 * Observable: Reactive state container with automatic dependency tracking
 * Converted from cpp/Observable.hpp
 */

import { Effect } from "./Effect";

export class Observable<T> {
  private value: T;
  private effects = new Set<Effect>();

  private constructor(initial: T) {
    this.value = initial;
  }

  /**
   * Factory method to create an Observable
   */
  static create<T>(initial: T): Observable<T> {
    return new Observable(initial);
  }

  /**
   * Read current value and subscribe the given effect
   */
  get(eff?: Effect): T {
    if (eff !== undefined) {
      if (!this.effects.has(eff)) {
        this.effects.add(eff);
        eff.subscribe(() => {
          this.remove(eff);
        });
      }
    }
    return this.value;
  }

  /**
   * Update the value and notify all subscribed effects
   */
  set(v: T): void {
    this.updateAndNotify(v);
  }

  dispose(): void {
    for (const e of this.effects) {
      e.dispose();
    }
    this.effects.clear();
  }

  /**
   * Internal: called by the effect's remover lambda to detach
   */
  private remove(eff: Effect): void {
    this.effects.delete(eff);
  }

  /**
   * Update value and notify effects if changed
   */
  private updateAndNotify(v: T): void {
    // Build candidate value for comparison
    const candidate = v;

    // Compare for equality (deep equality for objects/arrays would be needed for exact C++ parity)
    if (this.value === candidate) {
      return; // no change
    }

    this.value = candidate;

    // Collect current effects to notify
    const current = Array.from(this.effects);

    // Notify all subscribed effects
    for (const e of current) {
      e.run();
    }
  }
}
