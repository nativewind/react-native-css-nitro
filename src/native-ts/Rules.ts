/**
 * Rules: Rule testing logic for CSS selectors, media queries, and container queries
 * Converted from cpp/Rules.cpp using factory pattern
 */

import type { AnyMap } from "react-native-nitro-modules";

import type {
  HybridContainerQuery,
  HybridStyleRule,
} from "../specs/StyleRegistry";
import { ContainerContext } from "./ContainerContext";
import type { GetProxy } from "./Effect";
import { env } from "./Environment";
import { PseudoClasses } from "./PseudoClasses";
import type { AnyValue } from "./types";

// PseudoClass interface from specs (not exported, so we define it here)
interface PseudoClass {
  a?: boolean; // active
  f?: boolean; // focus
  h?: boolean; // hover
}

/**
 * Create the Rules module
 * Rules has no dependencies on other style modules, so no deps needed
 */
export function createRulesModule() {
  function testRule(
    rule: HybridStyleRule,
    get: GetProxy,
    componentId: string,
    containerScope: string,
    validAttributeQueries: string[],
  ): boolean {
    // Check attribute queries (rule.aq)
    if (rule.aq) {
      if (!rule.id) {
        return false;
      }

      // Use includes to search the array
      if (!validAttributeQueries.includes(rule.id)) {
        return false;
      }
    }

    // Check pseudo-classes (rule.pq)
    if (rule.pq) {
      if (!testPseudoClasses(rule.pq, componentId, get)) {
        return false;
      }
    }

    // Check media queries (rule.mq)
    if (rule.mq) {
      if (!testMediaMap(rule.mq, get)) {
        return false;
      }
    }

    // Check container queries (rule.cq)
    if (rule.cq) {
      if (!testContainerQueries(rule.cq, get, containerScope)) {
        return false;
      }
    }

    return true;
  }

  function testVariableMedia(mediaMap: AnyMap, get: GetProxy): boolean {
    return testMediaMap(mediaMap, get);
  }

  function testPseudoClasses(
    pseudoClass: PseudoClass,
    componentId: string,
    get: GetProxy,
  ): boolean {
    // Check active state
    if (pseudoClass.a !== undefined) {
      const expectedActive = pseudoClass.a;
      const actualActive = PseudoClasses.get(componentId, "active", get);
      if (actualActive !== expectedActive) {
        return false;
      }
    }

    // Check hover state
    if (pseudoClass.h !== undefined) {
      const expectedHover = pseudoClass.h;
      const actualHover = PseudoClasses.get(componentId, "hover", get);
      if (actualHover !== expectedHover) {
        return false;
      }
    }

    // Check focus state
    if (pseudoClass.f !== undefined) {
      const expectedFocus = pseudoClass.f;
      const actualFocus = PseudoClasses.get(componentId, "focus", get);
      if (actualFocus !== expectedFocus) {
        return false;
      }
    }

    return true;
  }

  function testMediaMap(mediaMap: AnyMap, get: GetProxy): boolean {
    // Get all keys to check if empty
    const keys = Object.keys(mediaMap);
    if (keys.length === 0) {
      return true;
    }

    // Check for $$op to determine logic mode
    let logicOp = "and"; // default is "and"
    let negate = false;

    const opValue = (mediaMap as Record<string, AnyValue>).$$op;
    if (opValue && typeof opValue === "string") {
      logicOp = opValue;
      if (logicOp === "not") {
        negate = true;
        logicOp = "and"; // "not" just negates the result, logic is still "and"
      }
    }

    // Track test results
    const results: boolean[] = [];

    // Loop over all keys
    for (const key of keys) {
      // Skip the $$op key
      if (key === "$$op") {
        continue;
      }

      // Value should be an array with [operator, expectedValue]
      const value = (mediaMap as Record<string, AnyValue>)[key];
      if (!Array.isArray(value)) {
        continue;
      }

      const valueArray = value as AnyValue[];
      if (valueArray.length < 2) {
        continue;
      }

      // Extract operator and expected value
      const op = typeof valueArray[0] === "string" ? valueArray[0] : "";

      const testResult = testMediaQuery(key, op, valueArray[1], get);
      results.push(testResult);
    }

    // If no tests were run, return true
    if (results.length === 0) {
      return true;
    }

    // Apply logic
    let finalResult: boolean;
    if (logicOp === "or") {
      // "or" - at least one must pass
      finalResult = results.some((result) => result);
    } else {
      // "and" - all must pass (default)
      finalResult = results.every((result) => result);
    }

    // Apply negation if needed
    if (negate) {
      finalResult = !finalResult;
    }

    return finalResult;
  }

  function testMediaQuery(
    key: string,
    op: string,
    value: AnyValue,
    get: GetProxy,
  ): boolean {
    if (op === "=") {
      if (key === "min-width") {
        if (typeof value === "number") {
          const vw = get(env.windowWidth());
          return vw >= value;
        }
        return false;
      }
      if (key === "max-width") {
        if (typeof value === "number") {
          const vw = get(env.windowWidth());
          return vw <= value;
        }
        return false;
      }
      if (key === "min-height") {
        if (typeof value === "number") {
          const vh = get(env.windowHeight());
          return vh >= value;
        }
        return false;
      }
      if (key === "max-height") {
        if (typeof value === "number") {
          const vh = get(env.windowHeight());
          return vh <= value;
        }
        return false;
      }
      if (key === "orientation") {
        if (typeof value === "string") {
          const orientation = value;
          const vw = get(env.windowWidth());
          const vh = get(env.windowHeight());
          if (orientation === "landscape") {
            return vh < vw;
          } else {
            return vh >= vw;
          }
        }
        return false;
      }
    }

    // For other operators, value must be a number
    if (typeof value !== "number") {
      return false;
    }

    const right = value;
    let left = 0.0;

    // Determine left value based on key and fetch only what's needed
    if (key === "width") {
      left = get(env.windowWidth());
    } else if (key === "height") {
      left = get(env.windowHeight());
    } else if (key === "resolution") {
      // TODO: Need to get PixelRatio - for now return 1.0
      left = 1.0; // PixelRatio.get()
    } else {
      return false;
    }

    // Apply operator
    if (op === "=") {
      return left === right;
    } else if (op === ">") {
      return left > right;
    } else if (op === ">=") {
      return left >= right;
    } else if (op === "<") {
      return left < right;
    } else if (op === "<=") {
      return left <= right;
    }

    return false;
  }

  function testContainerQueries(
    containerQueries: HybridContainerQuery[],
    get: GetProxy,
    containerScope: string,
  ): boolean {
    // Loop over all container queries and return false if any fail
    for (const containerQuery of containerQueries) {
      if (!testContainerQuery(containerQuery, get, containerScope)) {
        return false;
      }
    }
    return true;
  }

  function testContainerQuery(
    containerQuery: HybridContainerQuery,
    get: GetProxy,
    containerScope: string,
  ): boolean {
    let containerName: string | undefined = undefined;

    // Access the 'n' field directly if it exists
    if (containerQuery.n) {
      containerName = containerQuery.n;
    }

    // Resolve the actual container scope using findInScope
    const resolvedScope = ContainerContext.findInScope(
      containerScope,
      containerName,
    );

    // If we can't resolve the scope, the query fails
    if (!resolvedScope) {
      return false;
    }

    // Test pseudo-classes if containerQuery.p is set
    if (containerQuery.p) {
      if (!testPseudoClasses(containerQuery.p, resolvedScope, get)) {
        return false;
      }
    }

    // Only test media queries if containerQuery.m is set
    if (containerQuery.m) {
      return testContainerMediaMap(containerQuery.m, get, resolvedScope);
    }

    // If no media queries, the container query passes
    return true;
  }

  function testContainerMediaMap(
    containerMediaMap: AnyMap,
    get: GetProxy,
    containerScope: string,
  ): boolean {
    // Get all keys to check if empty
    const keys = Object.keys(containerMediaMap);
    if (keys.length === 0) {
      return true;
    }

    // Check for $$op to determine logic mode
    let logicOp = "and"; // default is "and"
    let negate = false;

    const opValue = (containerMediaMap as Record<string, AnyValue>).$$op;
    if (opValue && typeof opValue === "string") {
      logicOp = opValue;
      if (logicOp === "not") {
        negate = true;
        logicOp = "and"; // "not" just negates the result, logic is still "and"
      }
    }

    // Track test results
    const results: boolean[] = [];

    // Loop over all keys
    for (const key of keys) {
      // Skip the $$op key
      if (key === "$$op") {
        continue;
      }

      // Value should be an array with [operator, expectedValue]
      const value = (containerMediaMap as Record<string, AnyValue>)[key];
      if (!Array.isArray(value)) {
        continue;
      }

      const valueArray = value as AnyValue[];
      if (valueArray.length < 2) {
        continue;
      }

      // Extract operator and expected value
      const op = typeof valueArray[0] === "string" ? valueArray[0] : "";

      const testResult = testContainerMediaQuery(
        key,
        op,
        valueArray[1],
        get,
        containerScope,
      );
      results.push(testResult);
    }

    // If no tests were run, return true
    if (results.length === 0) {
      return true;
    }

    // Apply logic
    let finalResult: boolean;
    if (logicOp === "or") {
      // "or" - at least one must pass
      finalResult = results.some((result) => result);
    } else {
      // "and" - all must pass (default)
      finalResult = results.every((result) => result);
    }

    // Apply negation if needed
    if (negate) {
      finalResult = !finalResult;
    }

    return finalResult;
  }

  function testContainerMediaQuery(
    key: string,
    op: string,
    value: AnyValue,
    get: GetProxy,
    containerScope: string,
  ): boolean {
    if (op === "=") {
      if (key === "min-width") {
        if (typeof value === "number") {
          const cw = ContainerContext.getWidth(containerScope, undefined, get);
          if (cw === undefined) return false;
          return cw >= value;
        }
        return false;
      }
      if (key === "max-width") {
        if (typeof value === "number") {
          const cw = ContainerContext.getWidth(containerScope, undefined, get);
          if (cw === undefined) return false;
          return cw <= value;
        }
        return false;
      }
      if (key === "min-height") {
        if (typeof value === "number") {
          const ch = ContainerContext.getHeight(containerScope, undefined, get);
          if (ch === undefined) return false;
          return ch >= value;
        }
        return false;
      }
      if (key === "max-height") {
        if (typeof value === "number") {
          const ch = ContainerContext.getHeight(containerScope, undefined, get);
          if (ch === undefined) return false;
          return ch <= value;
        }
        return false;
      }
      if (key === "orientation") {
        if (typeof value === "string") {
          const orientation = value;
          const cw = ContainerContext.getWidth(containerScope, undefined, get);
          const ch = ContainerContext.getHeight(containerScope, undefined, get);
          if (cw === undefined || ch === undefined) return false;
          if (orientation === "landscape") {
            return ch < cw;
          } else {
            return ch >= cw;
          }
        }
        return false;
      }
    }

    // For other operators, value must be a number
    if (typeof value !== "number") {
      return false;
    }

    const right = value;
    let leftOpt: number | undefined;

    // Determine left value based on key and fetch only what's needed
    if (key === "width") {
      leftOpt = ContainerContext.getWidth(containerScope, undefined, get);
    } else if (key === "height") {
      leftOpt = ContainerContext.getHeight(containerScope, undefined, get);
    } else {
      return false;
    }

    // Check if we got a value
    if (leftOpt === undefined) {
      return false;
    }

    const left = leftOpt;

    // Apply operator
    if (op === "=") {
      return left === right;
    } else if (op === ">") {
      return left > right;
    } else if (op === ">=") {
      return left >= right;
    } else if (op === "<") {
      return left < right;
    } else if (op === "<=") {
      return left <= right;
    }

    return false;
  }

  // Return the public API
  return {
    testRule,
    testVariableMedia,
    testPseudoClasses,
    testMediaMap,
    testMediaQuery,
    testContainerQueries,
    testContainerQuery,
    testContainerMediaMap,
    testContainerMediaQuery,
  };
}

/**
 * Type for the Rules module
 */
export type RulesModule = ReturnType<typeof createRulesModule>;
