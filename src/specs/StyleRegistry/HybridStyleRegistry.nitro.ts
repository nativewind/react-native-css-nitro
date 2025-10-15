import type { processColor } from "react-native";

import type { AnyMap, HybridObject } from "react-native-nitro-modules";

export type HybridStyleRegistry = StyleRegistry & RawStyleRegistry;

export interface StyleRegistry
  extends HybridObject<{ ios: "c++"; android: "c++" }> {
  setClassname(classname: string, styleRule: HybridStyleRule[]): void;
  addStyleSheet(stylesheet: HybridStyleSheet): void;
  getDeclarations(
    componentId: string,
    classNames: string,
    variableScope: string,
    containerScope: string,
  ): Declarations;
  registerComponent(
    componentId: string,
    rerender: () => void,
    classNames: string,
    variableScope: string,
    containerScope: string,
  ): Styled;
  deregisterComponent(componentId: string): void;
  updateComponentInlineStyleKeys(
    componentId: string,
    inlineStyleKeys: string[],
  ): void;
  updateComponentState(
    componentId: string,
    type: UpdateComponentStateFns,
  ): void;
  unlinkComponent(componentId: string): void;

  setWindowDimensions(
    width: number,
    height: number,
    scale: number,
    fontScale: number,
  ): void;
}

/**
 * The raw JSI methods for StyleRegistry
 */
export interface RawStyleRegistry {
  linkComponent(componentId: string, tag: number): void;
  registerExternalMethods(options: { processColor: typeof processColor }): void;
}

/*******************************    States    *********************************/

export interface Declarations {
  classNames: string;
  variableScope?: string;
  containerScope?: string;
  pressable?: boolean;
  container?: boolean;
  animated?: boolean;
  active?: boolean;
  focus?: boolean;
  hover?: boolean;
  requiresRuntimeCheck?: [string, RuntimeGuard][];
}

type RuntimeGuard = (
  componentId: string,
  props: AnyMap,
  isDisabled: boolean,
) => boolean;

export interface Styled {
  style?: AnyMap;
  importantStyle?: AnyMap;
  props?: AnyMap;
  importantProps?: AnyMap;
  jsSubscriptionId?: number;
  shadowTreeDependencies?: string[];
  onPress?: () => void;
  onPressIn?: () => void;
  onPressOut?: () => void;
  onHoverIn?: () => void;
  onHoverOut?: () => void;
  onFocus?: () => void;
  onBlur?: () => void;
}

type UpdateComponentStateFns =
  | "onPress"
  | "onPressIn"
  | "onPressOut"
  | "onHoverIn"
  | "onHoverOut"
  | "onFocus"
  | "onBlur";

export type StyleConfig = [
  source: string,
  target: string[],
  StyleConfigNativeStyleToProp[],
];
export type StyleConfigNativeStyleToProp = [string, string[]];

/******************************    StyleSheet   *******************************/

export interface HybridStyleSheet {
  /** rem */
  r?: number;
  /** StyleRuleSets */
  s?: (readonly [string, HybridStyleRule[]])[];
  // /** KeyFrames */
  // k?: Animation[];
  // /** Root Variables */
  vr?: AnyMap;
  // /** Universal Variables */
  // vu?: RootVariables;
}

/******************************    StyleRule    *******************************/

interface HybridStyleRule {
  s: SpecificityArray;
  v?: AnyMap;

  /** Declarations */
  d?: [AnyMap] | [AnyMap, AnyMap?];

  /** MediaQuery */
  m?: AnyMap;
}

type SpecificityArray = number[];
