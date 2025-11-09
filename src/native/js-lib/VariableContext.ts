/**
 * VariableContext: CSS variable management with context hierarchy
 * Converted from cpp/VariableContext.cpp using factory pattern
 */

import type { AnyMap } from "react-native-nitro-modules";

import { Computed } from "./Computed";
import type { Resolver, VariableContextDeps } from "./dependencies";
import type { GetProxy } from "./Effect";
import { Observable } from "./Observable";
import type { AnyValue } from "./types";

type VariableValue = Observable<AnyValue> | Computed<AnyValue>;

interface Context {
  parent: string;
  values: Map<string, VariableValue>;
}

/**
 * Create the VariableContext module
 * Accepts dependencies to avoid circular imports
 */
export function createVariableContextModule(deps: VariableContextDeps) {
  const contexts = new Map<string, Context>();
  const rootValues = new Map<string, Observable<AnyValue>>();
  const universalValues = new Map<string, Observable<AnyValue>>();

  function createContext(key: string, parent: string): void {
    // Check if context already exists
    if (contexts.has(key)) {
      return;
    }

    // Create a new context with the specified parent
    contexts.set(key, {
      parent,
      values: new Map(),
    });
  }

  function deleteContext(key: string): void {
    // Remove the context from the map
    contexts.delete(key);
  }

  function getValue(varValue: VariableValue, get: GetProxy): AnyValue {
    return get(varValue);
  }

  const checkContext: Resolver<string> = (
    name: string,
    get: GetProxy,
    variableContext: string,
  ) => {
    // If this is a root or universal context, ensure it exists
    if (variableContext === "root" || variableContext === "universal") {
      createContext(variableContext, "root");
    }

    const context = contexts.get(variableContext);
    if (context) {
      const valueMap = context.values;
      const varValue = valueMap.get(name);

      if (varValue) {
        const value = getValue(varValue, get);
        // Use injected dependency instead of direct import
        return deps.resolveAnyValue(value, get, variableContext);
      } else {
        // Variable doesn't exist in this context
        if (variableContext === "root" || variableContext === "universal") {
          // For root/universal, create a top-level computed
          const targetMap =
            variableContext === "root" ? rootValues : universalValues;
          const computed = createTopLevelVariableComputed(targetMap, name);
          valueMap.set(name, computed);

          // Get the initial value from the computed
          const value = getValue(computed, get);
          // Use injected dependency
          return deps.resolveAnyValue(value, get, variableContext);
        } else {
          // For other contexts, create a new Observable with null
          const observable = Observable.create<AnyValue>(null);
          valueMap.set(name, observable);

          // Subscribe to the observable by calling get()
          get(observable);
        }
      }
    }
    return undefined;
  };

  const getVariable: Resolver<string> = (name, get, variableContext) => {
    // 1. Check current key
    let result = checkContext(name, get, variableContext);
    if (result !== undefined && result !== null) {
      return result;
    }

    // 2. Check "universal" context
    if (variableContext !== "universal") {
      result = checkContext(name, get, "universal");
      if (result !== undefined && result !== null) {
        return result;
      }

      // 3. Walk up the parent chain
      if (variableContext !== "root") {
        let currentKey = variableContext;
        const context = contexts.get(currentKey);

        if (context) {
          let parent = context.parent;

          while (parent !== currentKey && parent) {
            result = checkContext(name, get, parent);
            if (result !== undefined && result !== null) {
              return result;
            }

            const parentContext = contexts.get(parent);
            if (parentContext) {
              currentKey = parent;
              parent = parentContext.parent;
            } else {
              break;
            }
          }
        }
      }
    }

    return undefined;
  };

  function setVariable(
    key: string,
    name: string,
    value: AnyValue | Computed<AnyValue>,
  ): void {
    let context = contexts.get(key);
    if (!context) {
      createContext(key, "root");
      context = contexts.get(key);
      if (!context) return;
    }

    const valueMap = context.values;

    if (value instanceof Computed) {
      const existing = valueMap.get(name);
      if (existing instanceof Computed) {
        existing.dispose();
      }
      valueMap.set(name, value);
    } else {
      const varValue = valueMap.get(name);
      if (varValue instanceof Observable) {
        varValue.set(value);
        return;
      } else if (varValue instanceof Computed) {
        varValue.dispose();
      }

      const observable = Observable.create(value);
      valueMap.set(name, observable);
    }
  }

  function setTopLevelVariable(
    key: string,
    name: string,
    value: AnyValue,
  ): void {
    const targetMap = key === "root" ? rootValues : universalValues;

    const observable = targetMap.get(name);
    if (observable) {
      observable.set(value);
    } else {
      targetMap.set(name, Observable.create(value));
    }
  }

  function createTopLevelVariableComputed(
    targetMap: Map<string, Observable<AnyValue>>,
    name: string,
  ): Computed<AnyValue> {
    // Create computed that returns null (ValueType) rather than AnyValue
    const computed = Computed.create<AnyValue>((_prev, get) => {
      const observable = targetMap.get(name);
      if (observable) {
        const value = get(observable);

        if (!Array.isArray(value)) {
          return null;
        }

        // Loop over the array
        for (const item of value) {
          if (typeof item !== "object" || item === null) {
            continue;
          }

          const obj = item as Record<string, AnyValue>;

          // Check if "m" is set
          if ("m" in obj && obj.m !== undefined && obj.m !== null) {
            const mValue = obj.m;

            if (typeof mValue === "object") {
              // Use injected dependency for testVariableMedia
              if (!deps.testVariableMedia(mValue as AnyMap, get)) {
                continue;
              }
            } else {
              continue;
            }
          }

          // "m" is not set or the media query passed, return the value of "v"
          if ("v" in obj) {
            return obj.v;
          }
        }

        return null;
      } else {
        const newObservable = Observable.create<AnyValue>(null);
        targetMap.set(name, newObservable);
        get(newObservable);
        return null;
      }
    }, null);

    return computed;
  }

  // Return the public API
  return {
    createContext,
    deleteContext,
    getVariable,
    setVariable,
    setTopLevelVariable,
  };
}

/**
 * Type for the VariableContext module
 */
export type VariableContextModule = ReturnType<
  typeof createVariableContextModule
>;
