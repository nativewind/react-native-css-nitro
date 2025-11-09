/**
 * StyleFunction: CSS function resolution (e.g., var())
 * Converted from cpp/StyleFunction.cpp using factory pattern
 */

import type { StyleFunctionDeps } from "./dependencies";
import type { GetProxy } from "./Effect";
import type { AnyValue } from "./types";

/**
 * Create the StyleFunction module
 * Accepts dependencies to avoid circular imports
 */
export function createStyleFunctionModule(deps: StyleFunctionDeps) {
  function resolveStyleFn(
    fnArgs: AnyValue[],
    get: GetProxy,
    variableScope: string,
  ): AnyValue {
    // Check if fnArgs has at least 3 elements and first is "fn"
    if (Array.isArray(fnArgs) && fnArgs.length >= 3 && fnArgs[0] === "fn") {
      // Check if second element is "var"
      if (fnArgs[1] === "var") {
        // Need at least ["fn", "var", name]
        if (fnArgs.length >= 3 && typeof fnArgs[2] === "string") {
          const varName = fnArgs[2];

          // Get fallback value (if exists, it's at index 3)
          const fallback = fnArgs.length >= 4 ? fnArgs[3] : undefined;

          return resolveVar(varName, fallback, get, variableScope);
        }
      }
    }

    return undefined;
  }

  function resolveVar(
    name: string,
    fallback: AnyValue | undefined,
    get: GetProxy,
    variableScope: string,
  ): AnyValue {
    // Use injected getVariable dependency
    const result = deps.getVariable(variableScope, name, get);

    if (result !== undefined && result !== null) {
      return result;
    }

    return resolveAnyValue(fallback, get, variableScope);
  }

  function resolveAnyValue(
    value: AnyValue | undefined,
    get: GetProxy,
    variableScope: string,
  ): AnyValue {
    // Check if value is an array
    if (Array.isArray(value)) {
      return resolveStyleFn(value, get, variableScope);
    }

    // Return the value as-is if it's not an array
    return value;
  }

  // Return the public API
  return {
    resolveStyleFn,
    resolveVar,
    resolveAnyValue,
  };
}

/**
 * Type for the StyleFunction module
 */
export type StyleFunctionModule = ReturnType<typeof createStyleFunctionModule>;
