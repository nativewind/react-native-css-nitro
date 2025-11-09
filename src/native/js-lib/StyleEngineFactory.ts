/**
 * StyleEngineFactory: Wires all modules together
 *
 * This factory creates and connects all the style modules with their dependencies,
 * breaking circular dependencies using forward references and dependency injection.
 */

import { createAnimationsModule, type AnimationsModule } from "./Animations";
import { createRulesModule, type RulesModule } from "./Rules";
import {
  createStyleFunctionModule,
  type StyleFunctionModule,
} from "./StyleFunction";
import {
  createStyleResolverModule,
  type StyleResolverModule,
} from "./StyleResolver";
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
    resolveAnyValue: () => {
      return undefined;
    },
    applyStyleMapping: () => {
      return {};
    },
  };

  const rules = createRulesModule();

  // Create VariableContext with dependencies
  const variableContext = createVariableContextModule({
    resolveAnyValue: (value, get, variableScope) => {
      return styleResolver.resolveAnyValue(value, get, variableScope);
    },
    testVariableMedia: (mediaMap, get) => {
      // Test media query in the context of variable declarations
      // This uses the Rules module to test media queries
      return rules.testMediaMap(mediaMap, get);
    },
  });

  // Create StyleFunction with dependencies
  const styleFunction = createStyleFunctionModule({
    getVariable: (name, get, variableScope) => {
      return variableContext.getVariable(name, get, variableScope);
    },
    resolveAnyValue: (value, get, variableScope) => {
      return styleResolver.resolveAnyValue(value, get, variableScope);
    },
  });

  // Create Animations with dependencies
  const animations = createAnimationsModule({
    resolveAnyValue: (value, get, variableScope) => {
      return styleResolver.resolveAnyValue(value, get, variableScope);
    },
    applyStyleMapping: (inputMap, get, variableScope, processAnimations) => {
      return styleResolver.applyStyleMapping(
        inputMap,
        get,
        variableScope,
        processAnimations,
      );
    },
  });

  // Create StyleResolver with dependencies
  const styleResolverInstance = createStyleResolverModule({
    resolveStyleFn: (fnArgs, get, variableScope) => {
      return styleFunction.resolveStyleFn(fnArgs, get, variableScope);
    },
    getKeyframes: (name, get, variableScope) => {
      return animations.getKeyframes(name, get, variableScope);
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
