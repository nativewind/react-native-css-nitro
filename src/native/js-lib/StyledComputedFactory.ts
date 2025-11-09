/**
 * StyledComputedFactory: Creates computed styles for components
 * Converted from cpp/StyledComputedFactory.cpp
 *
 * Key difference from C++: Always triggers rerender instead of shadow tree updates
 * (no shadow tree access in JS React Native)
 */

import type { AnyMap } from "react-native-nitro-modules";

import type { HybridStyleRule, Styled } from "../../specs/StyleRegistry";
import { Computed } from "./Computed";
import { Effect, type GetProxy } from "./Effect";
import { Observable } from "./Observable";
import { Specificity } from "./Specificity";
import type { StyleEngine } from "./StyleEngineFactory";
import type { AnyValue } from "./types";

/**
 * Create a computed that generates Styled object from class names and style rules
 */
export function makeStyledComputed(
  styleRuleMap: Map<string, Observable<HybridStyleRule[]>>,
  classNames: string,
  componentId: string,
  rerender: () => void,
  variableScope: string,
  containerScope: string,
  validAttributeQueries: string[],
  engine: StyleEngine,
): Computed<Styled | null> {
  const computed = Computed.create<Styled | null>((prev, get) => {
    const next: Styled = {};
    const mergedStyles: Record<string, AnyValue> = {};
    const mergedProps: Record<string, AnyValue> = {};
    const mergedImportantStyles: Record<string, AnyValue> = {};
    const mergedImportantProps: Record<string, AnyValue> = {};

    // Collect all style rules from all classNames
    const allStyleRules: HybridStyleRule[] = [];

    // Split classNames by whitespace
    const classes = classNames.split(/\s+/).filter((c) => c.length > 0);

    for (const className of classes) {
      const styleObs = styleRuleMap.get(className);
      if (!styleObs) {
        continue;
      }

      const styleRules = get(styleObs);

      // Add only style rules that pass the test
      for (const styleRule of styleRules) {
        if (
          engine.rules.testRule(
            styleRule,
            get,
            componentId,
            containerScope,
            validAttributeQueries,
          )
        ) {
          allStyleRules.push(styleRule);
        }
      }
    }

    // Sort all style rules by specificity (highest specificity first)
    allStyleRules.sort((a, b) => (Specificity.sort(a.s, b.s) ? -1 : 1));

    // Process the inline variables
    for (const styleRule of allStyleRules) {
      if (styleRule.v) {
        const inlineVariables = styleRule.v;
        for (const [key, value] of Object.entries(inlineVariables)) {
          engine.variableContext.setVariable(variableScope, key, value);
        }
      }
    }

    // Process the declarations and props
    for (const styleRule of allStyleRules) {
      // Check if this is an important rule (s[0] > 0)
      const isImportant = styleRule.s[0] > 0;

      // Process declarations (styles) from the "d" key
      if (styleRule.d) {
        const targetStyles = isImportant ? mergedImportantStyles : mergedStyles;
        processDeclarations(
          styleRule.d,
          targetStyles,
          get,
          variableScope,
          engine,
        );
      }

      // Process props from the "p" key
      if (styleRule.p) {
        const targetProps = isImportant ? mergedImportantProps : mergedProps;
        processDeclarations(
          styleRule.p,
          targetProps,
          get,
          variableScope,
          engine,
        );
      }
    }

    // Convert and assign all maps
    if (Object.keys(mergedStyles).length > 0) {
      next.style = convertToAnyMap(
        mergedStyles,
        true,
        variableScope,
        get,
        engine,
      );
    }

    if (Object.keys(mergedProps).length > 0) {
      next.props = convertToAnyMap(
        mergedProps,
        false,
        variableScope,
        get,
        engine,
      );
    }

    if (Object.keys(mergedImportantStyles).length > 0) {
      next.importantStyle = convertToAnyMap(
        mergedImportantStyles,
        true,
        variableScope,
        get,
        engine,
      );
    }

    if (Object.keys(mergedImportantProps).length > 0) {
      next.importantProps = convertToAnyMap(
        mergedImportantProps,
        false,
        variableScope,
        get,
        engine,
      );
    }

    // Only perform these actions if this is a recompute (prev exists)
    if (prev !== null) {
      // In JS React Native, we always trigger rerender (no shadow tree)
      // Batch the rerender call to avoid excessive updates
      Effect.batch(() => {
        rerender();
      });
    }

    return next;
  }, null);

  return computed;
}

/**
 * Process declarations (styles or props) and merge into target map
 */
function processDeclarations(
  declarations: AnyMap,
  targetMap: Record<string, AnyValue>,
  get: GetProxy,
  variableScope: string,
  engine: StyleEngine,
): void {
  // Get all key-value pairs from the declarations
  for (const [key, value] of Object.entries(declarations)) {
    // Only set if key doesn't already exist (higher specificity wins)
    if (!(key in targetMap)) {
      // Use StyleResolver to resolve the value (handles functions, variables, etc.)
      const resolvedValue = engine.styleResolver.resolveAnyValue(
        value,
        get,
        variableScope,
      );

      // Skip if resolveStyle returns null/undefined (unresolved)
      if (resolvedValue === null || resolvedValue === undefined) {
        continue;
      }

      targetMap[key] = resolvedValue;
    }
  }
}

/**
 * Convert merged map to AnyMap, applying style mapping if needed
 */
function convertToAnyMap(
  mergedMap: Record<string, AnyValue>,
  applyStyleMapping: boolean,
  variableScope: string,
  get: GetProxy,
  engine: StyleEngine,
): AnyMap {
  if (applyStyleMapping) {
    // Use StyleResolver's helper function to apply style mapping
    return engine.styleResolver.applyStyleMapping(
      mergedMap,
      get,
      variableScope,
      true, // processAnimations = true
    );
  } else {
    // For props, just copy all values directly without transform mapping
    const anyMap: AnyMap = {};
    for (const [key, value] of Object.entries(mergedMap)) {
      if (value !== null && value !== undefined) {
        anyMap[key] = value;
      }
    }
    return anyMap;
  }
}
