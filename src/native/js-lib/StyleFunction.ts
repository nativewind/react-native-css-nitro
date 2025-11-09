/**
 * StyleFunction: CSS function resolution (e.g., var())
 * Converted from cpp/StyleFunction.cpp using factory pattern
 */

import type { StyleFunctionDeps } from "./dependencies";
import type { GetProxy } from "./Effect";
import { boxShadow } from "./shorthand/box-shadow";
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
    if (
      Array.isArray(fnArgs) &&
      fnArgs.length >= 3 &&
      fnArgs[0] === "fn" &&
      typeof fnArgs[1] === "string"
    ) {
      const fnName = fnArgs[1];

      if (fnName === "var" && typeof fnArgs[2] === "string") {
        const varName = fnArgs[2];
        const fallback = fnArgs.length >= 4 ? fnArgs[3] : undefined;
        return resolveVar(varName, fallback, get, variableScope);
      } else if (fnName === "boxShadow") {
        return boxShadow(deps.resolveAnyValue(fnArgs[2], get, variableScope));
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
    const result = deps.getVariable(name, get, variableScope);

    if (result !== undefined && result !== null) {
      return result;
    }

    return deps.resolveAnyValue(fallback, get, variableScope);
  }

  // Return the public API
  return {
    resolveStyleFn,
    resolveVar,
  };
}

/**
 * Type for the StyleFunction module
 */
export type StyleFunctionModule = ReturnType<typeof createStyleFunctionModule>;
