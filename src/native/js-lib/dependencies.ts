/**
 * Dependency Injection Interfaces
 *
 * This file defines all the dependency interfaces needed by each module.
 * By using interfaces instead of direct imports, we break circular dependencies.
 */

import type { AnyMap } from "react-native-nitro-modules";

import type { GetProxy } from "./Effect";
import type { AnyValue } from "./types";

export type Resolver<T = AnyValue, R = AnyValue> = (
  value: T,
  get: GetProxy,
  variableScope: string,
) => R;

/**
 * Dependencies needed by VariableContext module
 */
export interface VariableContextDeps {
  resolveAnyValue: Resolver;
  testVariableMedia: (mediaMap: AnyMap, get: GetProxy) => boolean;
}

/**
 * Dependencies needed by StyleFunction module
 */
export interface StyleFunctionDeps {
  getVariable: Resolver<string>;
  resolveAnyValue: Resolver;
}

/**
 * Dependencies needed by Animations module
 */
export interface AnimationsDeps {
  resolveAnyValue: Resolver;
  applyStyleMapping: (
    inputMap: Record<string, AnyValue>,
    get: GetProxy,
    variableScope: string,
    processAnimations: boolean,
  ) => AnyMap;
}

/**
 * Dependencies needed by StyleResolver module
 */
export interface StyleResolverDeps {
  resolveStyleFn: Resolver<AnyValue[]>;
  getKeyframes: Resolver<string, AnyMap>;
}
