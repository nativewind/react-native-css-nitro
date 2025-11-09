/**
 * PseudoClasses: Pseudo-class state management
 * Converted from cpp/PseudoClasses.cpp
 */

import type { PseudoClassType } from "../specs/StyleRegistry";
import type { GetProxy } from "./Effect";
import { Observable } from "./Observable";

interface PseudoClassState {
  active?: Observable<boolean>;
  hover?: Observable<boolean>;
  focus?: Observable<boolean>;
}

const states = new Map<string, PseudoClassState>();

function ensureState(key: string): PseudoClassState {
  let state = states.get(key);
  if (!state) {
    state = {};
    states.set(key, state);
  }
  return state;
}

export const PseudoClasses = {
  get(key: string, type: PseudoClassType, get: GetProxy): boolean {
    // Find or create the state for this key
    const state = ensureState(key);

    // Get the appropriate observable based on type
    let observableRef: Observable<boolean> | undefined;

    switch (type) {
      case "active":
        observableRef = state.active;
        break;
      case "hover":
        observableRef = state.hover;
        break;
      case "focus":
        observableRef = state.focus;
        break;
    }

    // If the observable doesn't exist, create it with default value of false
    if (!observableRef) {
      observableRef = Observable.create(false);
      switch (type) {
        case "active":
          state.active = observableRef;
          break;
        case "hover":
          state.hover = observableRef;
          break;
        case "focus":
          state.focus = observableRef;
          break;
      }
    }

    // Subscribe to the observable and return its value
    return get(observableRef);
  },

  set(key: string, type: PseudoClassType, value: boolean): void {
    // Find or create the state for this key
    const state = ensureState(key);

    // Get the appropriate observable based on type
    let observableRef: Observable<boolean> | undefined;

    switch (type) {
      case "active":
        observableRef = state.active;
        break;
      case "hover":
        observableRef = state.hover;
        break;
      case "focus":
        observableRef = state.focus;
        break;
    }

    // If the observable doesn't exist, create it
    if (!observableRef) {
      observableRef = Observable.create(value);
      switch (type) {
        case "active":
          state.active = observableRef;
          break;
        case "hover":
          state.hover = observableRef;
          break;
        case "focus":
          state.focus = observableRef;
          break;
      }
    } else {
      // Update the existing observable
      observableRef.set(value);
    }
  },

  remove(key: string): void {
    states.delete(key);
  },
};
