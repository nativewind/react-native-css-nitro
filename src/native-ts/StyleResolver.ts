/**
 * StyleResolver: Style resolution and mapping
 * Converted from cpp/StyleResolver.cpp using factory pattern
 */

import type { AnyMap } from "react-native-nitro-modules";

import type { StyleResolverDeps } from "./dependencies";
import type { GetProxy } from "./Effect";
import type { AnyValue } from "./types";

/**
 * Create the StyleResolver module
 * Accepts dependencies to avoid circular imports
 */
export function createStyleResolverModule(deps: StyleResolverDeps) {
  function resolveStyle(
    value: AnyValue,
    variableScope: string,
    get: GetProxy,
  ): AnyValue {
    // Check if value is an array
    if (Array.isArray(value)) {
      // Check if array has at least one element and first element is "fn"
      if (value.length > 0 && value[0] === "fn") {
        // Resolve the function using injected dependency
        return deps.resolveStyleFn(value, get, variableScope);
      }
    }

    // Otherwise return the value as-is
    return value;
  }

  function applyStyleMapping(
    inputMap: Record<string, AnyValue>,
    variableScope: string,
    get: GetProxy,
    processAnimations: boolean,
  ): AnyMap {
    const transformProps = new Set([
      "translateX",
      "translateY",
      "translateZ",
      "rotate",
      "rotateX",
      "rotateY",
      "rotateZ",
      "scaleX",
      "scaleY",
      "scaleZ",
      "skewX",
      "skewY",
      "perspective",
    ]);

    const result: Record<string, AnyValue> = {};

    for (const [key, value] of Object.entries(inputMap)) {
      // Handle animationName property only if processAnimations is true
      if (processAnimations && key === "animationName") {
        // animationName can be a string or an array of strings
        if (typeof value === "string") {
          // Single animation name
          const animName = value;
          const keyframes = deps.getKeyframes(animName, variableScope, get);

          // Set animationName to the resolved keyframes object
          result.animationName = keyframes;
        } else if (Array.isArray(value)) {
          // Array of animation names
          const animNames = value as AnyValue[];
          const keyframesArray: AnyValue[] = [];

          for (const animNameValue of animNames) {
            if (typeof animNameValue === "string") {
              const animName = animNameValue;
              const keyframes = deps.getKeyframes(animName, variableScope, get);
              keyframesArray.push(keyframes);
            }
          }

          // Set animationName to the array of resolved keyframes
          result.animationName = keyframesArray as AnyValue;
        } else {
          // Invalid type for animationName, just pass through as-is
          result.animationName = value;
        }
        continue;
      }

      // Handle transform properties
      if (transformProps.has(key)) {
        const resultTransform = result.transform as AnyValue[] | undefined;
        const transformArray = resultTransform ? [...resultTransform] : [];

        // Find the value in the array with the key matching key and set it to value
        let foundTransform = false;
        for (let i = 0; i < transformArray.length; i++) {
          const item = transformArray[i];
          if (
            typeof item === "object" &&
            item !== null &&
            !Array.isArray(item)
          ) {
            const obj = item as Record<string, AnyValue>;
            if (key in obj) {
              obj[key] = value;
              transformArray[i] = obj as AnyValue;
              foundTransform = true;
              break;
            }
          }
        }

        // If transform property not found in array, add a new transform object
        if (!foundTransform) {
          const transformObj: Record<string, AnyValue> = {};
          transformObj[key] = value;
          transformArray.push(transformObj as AnyValue);
        }

        result.transform = transformArray as AnyValue;
        continue;
      }

      // For all other properties, just pass through as-is
      result[key] = value;
    }

    return result as AnyMap;
  }

  // Return the public API
  return {
    resolveStyle,
    applyStyleMapping,
  };
}

/**
 * Type for the StyleResolver module
 */
export type StyleResolverModule = ReturnType<typeof createStyleResolverModule>;
