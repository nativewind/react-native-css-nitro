/**
 * Animations: Keyframe animation management
 * Converted from cpp/Animations.cpp using factory pattern
 */

import type { AnyMap } from "react-native-nitro-modules";

import { Computed } from "./Computed";
import type { AnimationsDeps } from "./dependencies";
import { Effect } from "./Effect";
import type { GetProxy } from "./Effect";
import { Observable } from "./Observable";
import type { AnyValue } from "./types";
import { isAnyMap } from "./types";

/**
 * Create the Animations module
 * Accepts dependencies to avoid circular imports
 */
export function createAnimationsModule(deps: AnimationsDeps) {
  // Map to store the shared keyframes observables (one per keyframe name)
  const keyframesObservables = new Map<
    string,
    Observable<AnyMap | undefined>
  >();

  // Map to store scope-specific computeds: Map<variableScope, Map<name, Computed<AnyMap>>>
  const scopedComputeds = new Map<string, Map<string, Computed<AnyMap>>>();

  function setKeyframes(name: string, keyframes: AnyMap): void {
    let observable = keyframesObservables.get(name);

    if (!observable) {
      // Create new observable
      observable = Observable.create<AnyMap | undefined>(keyframes);
      keyframesObservables.set(name, observable);
    }

    // Batch the update to prevent cascade during fast refresh
    Effect.batch(() => {
      observable.set(keyframes);
    });
  }

  function getKeyframes(
    name: string,
    variableScope: string,
    get: GetProxy,
  ): AnyMap {
    // First, ensure the Observable exists for this keyframe name
    let observable = keyframesObservables.get(name);
    if (!observable) {
      // Create a new observable with an empty AnyMap
      observable = Observable.create<AnyMap | undefined>({});
      keyframesObservables.set(name, observable);
    }

    // Store the observable to avoid repeated lookups
    const keyframeObservable = observable;

    // Now check if a Computed exists within the variableScope for this name
    let scopeMap = scopedComputeds.get(variableScope);
    if (!scopeMap) {
      // Create the scope map if it doesn't exist
      scopeMap = new Map<string, Computed<AnyMap>>();
      scopedComputeds.set(variableScope, scopeMap);
    }

    let computed = scopeMap.get(name);

    if (!computed) {
      // Create a new Computed that gets the AnyMap from the observable and processes it
      // Wrap in a batch to ensure the initial computation doesn't trigger cascades
      let newComputed: Computed<AnyMap> | undefined;
      Effect.batch(() => {
        newComputed = Computed.create<AnyMap>(
          (_prev: AnyMap | undefined, get: GetProxy) => {
            // Get the raw keyframes from the observable
            const rawKeyframes = get(keyframeObservable);

            // If keyframes are empty or undefined, return early
            if (
              !rawKeyframes ||
              !isAnyMap(rawKeyframes) ||
              Object.keys(rawKeyframes).length === 0
            ) {
              return {};
            }

            // Create a new AnyMap to hold the resolved keyframes
            const resolvedKeyframes: AnyMap = {};

            // Loop over the entries of the rawKeyframes
            for (const [key, value] of Object.entries(rawKeyframes)) {
              // Each value should be an object (AnyMap), if not skip that entry
              if (!isAnyMap(value)) {
                continue;
              }

              const frameMap = value as AnyMap;

              // Create a temporary map to hold resolved frame values
              const resolvedFrameMap: Record<string, AnyValue> = {};

              // Loop over each entry of the frame and resolve values
              if (isAnyMap(frameMap)) {
                for (const [frameKey, frameValue] of Object.entries(frameMap)) {
                  // Resolve the value using StyleResolver
                  const resolvedValue = deps.resolveStyle(
                    frameValue,
                    variableScope,
                    get,
                  );

                  resolvedFrameMap[frameKey] = resolvedValue;
                }
              }

              // Apply style mapping to the resolved frame (don't process animations to avoid recursion)
              const transformedFrame = deps.applyStyleMapping(
                resolvedFrameMap,
                variableScope,
                get,
                false, // processAnimations = false to avoid recursion
              );

              // Set the resolved and transformed frame in the result
              resolvedKeyframes[key] = transformedFrame;
            }

            return resolvedKeyframes;
          },
          {}, // initial value
        );
      });

      if (newComputed) {
        scopeMap.set(name, newComputed);
        computed = newComputed;
      }
    }

    // Return get(computed) to subscribe to it
    if (!computed) {
      return {};
    }
    return get(computed);
  }

  function deleteScope(variableScope: string): void {
    scopedComputeds.delete(variableScope);
  }

  // Return the public API
  return {
    setKeyframes,
    getKeyframes,
    deleteScope,
  };
}

/**
 * Type for the Animations module
 */
export type AnimationsModule = ReturnType<typeof createAnimationsModule>;
