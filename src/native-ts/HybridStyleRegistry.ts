/**
 * HybridStyleRegistry: Main registry implementation
 * Converted from cpp/HybridStyleRegistry.cpp
 *
 * Note: This is a pure TypeScript implementation, not a Nitro hybrid object.
 * It coordinates all the style modules and manages component registrations.
 */

import type { LayoutRectangle } from "react-native";

import type { AnyMap } from "react-native-nitro-modules";

import type {
  AttributeQuery,
  Declarations,
  HybridStyleRule,
  HybridStyleSheet,
  PseudoClassType,
  Styled,
} from "../specs/StyleRegistry";
import { Computed } from "./Computed";
import { ContainerContext } from "./ContainerContext";
import { Effect } from "./Effect";
import { env } from "./Environment";
import { Observable } from "./Observable";
import { PseudoClasses } from "./PseudoClasses";
import { makeStyledComputed } from "./StyledComputedFactory";
import { createStyleEngine } from "./StyleEngineFactory";

/**
 * Entry in the computed map
 */
interface ComputedEntry {
  computed: Computed<Styled | null>;
  classNames: string;
  variableScope: string;
  containerScope: string;
}

/**
 * Create a style registry instance
 */
export function createStyleRegistry() {
  // Create the style engine with all modules
  const engine = createStyleEngine();

  // Registry state
  const computedMap = new Map<string, ComputedEntry>();
  const styleRuleMap = new Map<string, Observable<HybridStyleRule[]>>();
  let nextStyleRuleId = 1;

  function setClassname(
    className: string,
    styleRules: HybridStyleRule[],
  ): void {
    // Create a copy of the style rules to modify them
    const rulesWithIds = styleRules.map((rule) => ({
      ...rule,
      id: rule.id ?? String(nextStyleRuleId++),
    }));

    // Reverse the style rules, this way later on we can bail early if values are already set
    const reversedRules = [...rulesWithIds].reverse();

    const existing = styleRuleMap.get(className);
    if (!existing) {
      const observable = Observable.create<HybridStyleRule[]>(reversedRules);
      styleRuleMap.set(className, observable);
    } else {
      existing.set(reversedRules);
    }
  }

  function addStyleSheet(stylesheet: HybridStyleSheet): void {
    // Create an Effect batch to process all style updates together
    Effect.batch(() => {
      // If the key "s" exists, loop over every entry
      if (stylesheet.s) {
        const stylesMap = stylesheet.s;
        for (const [className, styleRules] of Object.entries(stylesMap)) {
          setClassname(className, styleRules);
        }
      }
    });
  }

  function setRootVariables(variables: AnyMap): void {
    // Loop over all entries in the AnyMap
    for (const [key, value] of Object.entries(variables)) {
      engine.variableContext.setTopLevelVariable("root", key, value);
    }
  }

  function setUniversalVariables(variables: AnyMap): void {
    // Loop over all entries in the AnyMap
    for (const [key, value] of Object.entries(variables)) {
      engine.variableContext.setTopLevelVariable("universal", key, value);
    }
  }

  function getDeclarations(
    componentId: string,
    classNames: string,
    variableScope: string,
    _containerScope: string,
  ): Declarations {
    const declarations: Declarations = {
      variableScope,
    };

    const classes = classNames.split(/\s+/).filter((c) => c.length > 0);
    const attributeQueriesVec: [string, AttributeQuery][] = [];

    for (const className of classes) {
      const styleObs = styleRuleMap.get(className);
      if (!styleObs) {
        continue;
      }

      const styleRules = styleObs.get();
      let hasVars = false;

      for (const sr of styleRules) {
        // Check for attribute queries
        if (sr.aq && sr.id) {
          attributeQueriesVec.push([sr.id, sr.aq]);
        }

        // Check for variables
        if (sr.v) {
          hasVars = true;
        }

        // Check for pseudo-classes
        if (sr.pq) {
          const pseudoClass = sr.pq;

          // Check if active pseudo-class is set
          if (pseudoClass.a !== undefined) {
            declarations.active = true;
          }

          // Check if hover pseudo-class is set
          if (pseudoClass.h !== undefined) {
            declarations.hover = true;
          }

          // Check if focus pseudo-class is set
          if (pseudoClass.f !== undefined) {
            declarations.focus = true;
          }
        }
      }

      if (hasVars) {
        declarations.variableScope = componentId;
      }
    }

    // Set attributeQueries if we found any
    if (attributeQueriesVec.length > 0) {
      declarations.attributeQueries = attributeQueriesVec;
    }

    return declarations;
  }

  function registerComponent(
    componentId: string,
    rerender: () => void,
    classNames: string,
    variableScope: string,
    containerScope: string,
    validAttributeQueries: string[],
  ): Styled {
    // Check if an entry exists for this component
    const existing = computedMap.get(componentId);

    let computed: Computed<Styled | null>;

    // Only recreate computed if parameters have changed or it doesn't exist
    if (
      existing?.classNames !== classNames ||
      existing.variableScope !== variableScope ||
      existing.containerScope !== containerScope
    ) {
      // Dispose old computed if it exists
      existing?.computed.dispose();

      // Build new computed Styled via factory
      computed = makeStyledComputed(
        styleRuleMap,
        classNames,
        componentId,
        rerender,
        variableScope,
        containerScope,
        validAttributeQueries,
        engine,
      );

      // Store the new computed with its parameters
      computedMap.set(componentId, {
        computed,
        classNames,
        variableScope,
        containerScope,
      });
    } else {
      // Reuse existing computed
      computed = existing.computed;
    }

    // Get the value from computed - it may be null
    const styled = computed.get();

    // If null, return empty Styled{}
    if (styled === null) {
      return {};
    }

    // Otherwise return the value
    return styled;
  }

  function deregisterComponent(componentId: string): void {
    const entry = computedMap.get(componentId);
    if (entry) {
      entry.computed.dispose();
      computedMap.delete(componentId);
    }
  }

  function updateComponentState(
    componentId: string,
    type: PseudoClassType,
    value: boolean,
  ): void {
    PseudoClasses.set(componentId, type, value);
  }

  function updateComponentLayout(
    componentId: string,
    layout: LayoutRectangle,
  ): void {
    ContainerContext.setLayout(
      componentId,
      layout.x,
      layout.y,
      layout.width,
      layout.height,
    );
  }

  function setWindowDimensions(
    width: number,
    height: number,
    scale: number,
    fontScale: number,
  ): void {
    env.setWindowDimensions(width, height, scale, fontScale);
  }

  function setKeyframes(name: string, keyframes: AnyMap): void {
    engine.animations.setKeyframes(name, keyframes);
  }

  function updateComponentInlineStyleKeys(
    _componentId: string,
    _inlineStyleKeys: string[],
  ): void {
    // TODO: Integrate with style computation if needed
    // For now, this is a no-op
  }

  // Note: linkComponent, unlinkComponent, and registerExternalMethods
  // are not implemented in this TypeScript version as they require
  // JSI runtime access and shadow tree manipulation

  return {
    setClassname,
    addStyleSheet,
    setRootVariables,
    setUniversalVariables,
    getDeclarations,
    registerComponent,
    deregisterComponent,
    updateComponentState,
    updateComponentLayout,
    setWindowDimensions,
    setKeyframes,
    updateComponentInlineStyleKeys,
  };
}

/**
 * Type for the style registry
 */
export type StyleRegistry = ReturnType<typeof createStyleRegistry>;
