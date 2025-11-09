/**
 * Dependency Injection Interfaces
 *
 * This file defines all the dependency interfaces needed by each module.
 * By using interfaces instead of direct imports, we break circular dependencies.
 */

import type { AnyMap } from "react-native-nitro-modules";

import type { GetProxy } from "./Effect";
import type { AnyValue } from "./types";

/**
 * Dependencies needed by VariableContext module
 */
export interface VariableContextDeps {
  resolveStyle: (
    value: AnyValue,
    variableScope: string,
    get: GetProxy,
  ) => AnyValue;
  testVariableMedia: (mediaMap: AnyMap, get: GetProxy) => boolean;
}

/**
 * Dependencies needed by StyleFunction module
 */
export interface StyleFunctionDeps {
  getVariable: (
    variableScope: string,
    name: string,
    get: GetProxy,
  ) => AnyValue | undefined;
  resolveStyle: (
    value: AnyValue,
    variableScope: string,
    get: GetProxy,
  ) => AnyValue;
}

/**
 * Dependencies needed by Animations module
 */
export interface AnimationsDeps {
  resolveStyle: (
    value: AnyValue,
    variableScope: string,
    get: GetProxy,
  ) => AnyValue;
  applyStyleMapping: (
    inputMap: Record<string, AnyValue>,
    variableScope: string,
    get: GetProxy,
    processAnimations: boolean,
  ) => AnyMap;
}

/**
 * Dependencies needed by StyleResolver module
 */
export interface StyleResolverDeps {
  resolveStyleFn: (
    fnArgs: AnyValue[],
    get: GetProxy,
    variableScope: string,
  ) => AnyValue;
  getKeyframes: (name: string, variableScope: string, get: GetProxy) => AnyMap;
}
