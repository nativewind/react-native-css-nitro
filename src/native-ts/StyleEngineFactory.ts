/**
 * StyleEngineFactory: Wires all modules together
 *
 * This factory creates and connects all the style modules with their dependencies,
 * breaking circular dependencies using forward references and dependency injection.
 */

import type { AnyMap } from "react-native-nitro-modules";

import type { HybridStyleRule } from "../specs/StyleRegistry";
import { createAnimationsModule, type AnimationsModule } from "./Animations";
import type { GetProxy } from "./Effect";
import { createRulesModule, type RulesModule } from "./Rules";
import {
  createStyleFunctionModule,
  type StyleFunctionModule,
} from "./StyleFunction";
import {
  createStyleResolverModule,
  type StyleResolverModule,
} from "./StyleResolver";
import type { AnyValue } from "./types";
import {
  createVariableContextModule,
  type VariableContextModule,
} from "./VariableContext";

/**
 * The complete style engine with all modules wired together
 */
export interface StyleEngine {
  rules: RulesModule;
  styleFunction: StyleFunctionModule;
  styleResolver: StyleResolverModule;
  variableContext: VariableContextModule;
  animations: AnimationsModule;
}

/**
 * Create the complete style engine with all dependencies wired
 */
export function createStyleEngine(): StyleEngine {
  // Create forward references for circular dependencies
  // These will be populated after all modules are created
  let styleResolver: StyleResolverModule = {
    resolveStyle: () => {
      return undefined;
    },
    applyStyleMapping: () => {
      return {};
    },
  };

  const rules = createRulesModule();

  // Create VariableContext with dependencies
  const variableContext = createVariableContextModule({
    resolveStyle: (value, variableScope, get) => {
      return styleResolver.resolveStyle(value, variableScope, get);
    },
    testVariableMedia: (mediaMap, get) => {
      // Test media query in the context of variable declarations
      // This uses the Rules module to test media queries
      return rules.testMediaMap(mediaMap, get);
    },
  });

  // Create StyleFunction with dependencies
  const styleFunction = createStyleFunctionModule({
    getVariable: (variableScope, name, get) => {
      return variableContext.getVariable(variableScope, name, get);
    },
    resolveStyle: (value, variableScope, get) => {
      return styleResolver.resolveStyle(value, variableScope, get);
    },
  });

  // Create Animations with dependencies
  const animations = createAnimationsModule({
    resolveStyle: (value, variableScope, get) => {
      return styleResolver.resolveStyle(value, variableScope, get);
    },
    applyStyleMapping: (inputMap, variableScope, get, processAnimations) => {
      return styleResolver.applyStyleMapping(
        inputMap,
        variableScope,
        get,
        processAnimations,
      );
    },
  });

  // Create StyleResolver with dependencies
  const styleResolverInstance = createStyleResolverModule({
    resolveStyleFn: (fnArgs, get, variableScope) => {
      return styleFunction.resolveStyleFn(fnArgs, get, variableScope);
    },
    getKeyframes: (name, variableScope, get) => {
      return animations.getKeyframes(name, variableScope, get);
    },
  });
  styleResolver = styleResolverInstance;

  // Return the complete engine
  return {
    rules,
    styleFunction,
    styleResolver,
    variableContext,
    animations,
  };
}

/**
 * Convenience function to create a style engine and extract commonly-used APIs
 */
export function createStyleEngineWithHelpers() {
  const engine = createStyleEngine();

  return {
    // The full engine
    engine,

    // Commonly-used APIs
    resolveStyle: (value: AnyValue, variableScope: string, get: GetProxy) =>
      engine.styleResolver.resolveStyle(value, variableScope, get),

    applyStyleMapping: (
      inputMap: Record<string, AnyValue>,
      variableScope: string,
      get: GetProxy,
      processAnimations = true,
    ) =>
      engine.styleResolver.applyStyleMapping(
        inputMap,
        variableScope,
        get,
        processAnimations,
      ),

    setVariable: (key: string, name: string, value: AnyValue) => {
      engine.variableContext.setVariable(key, name, value);
    },

    setTopLevelVariable: (key: string, name: string, value: AnyValue) => {
      engine.variableContext.setTopLevelVariable(key, name, value);
    },

    setKeyframes: (name: string, frames: AnyMap) => {
      engine.animations.setKeyframes(name, frames);
    },

    createContext: (key: string, parent: string) => {
      engine.variableContext.createContext(key, parent);
    },

    deleteContext: (key: string) => {
      engine.variableContext.deleteContext(key);
    },

    testRule: (
      rule: HybridStyleRule,
      get: GetProxy,
      componentId: string,
      containerScope: string,
      validAttributeQueries: string[],
    ) =>
      engine.rules.testRule(
        rule,
        get,
        componentId,
        containerScope,
        validAttributeQueries,
      ),
  };
}
