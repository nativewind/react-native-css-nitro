import type {
  ImageStyle,
  LayoutRectangle,
  processColor,
  TextStyle,
  ViewStyle,
} from "react-native";

import type {
  AnyMap,
  HybridObject,
  ValueType,
} from "react-native-nitro-modules";
import type { CSSProps } from "react-native-reanimated/lib/typescript/css/types";

type RNStyleRecord = ViewStyle & TextStyle & ImageStyle;
type AnimatedStyleRecord = CSSProps<RNStyleRecord>;
export type StyleRecord = {
  [key in keyof AnimatedStyleRecord]:
    | AnimatedStyleRecord[key]
    | ["fn", ...ValueType[]];
} & AnyMap;

export type HybridStyleRegistry = StyleRegistry & RawStyleRegistry;

/**
 * The StyleRegistry interface defines the methods available on the StyleRegistry hybrid object.
 *
 * NOTE: In JS/TS, some methods have more specific types defined in JSStyleRegistry.
 */
export interface StyleRegistry
  extends HybridObject<{ ios: "c++"; android: "c++" }> {
  addStyleSheet(stylesheet: HybridStyleSheet): void;
  deregisterComponent(componentId: string): void;
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
    validAttributeQueries: string[],
  ): Styled;
  setClassname(classname: string, styleRule: HybridStyleRule[]): void;
  setKeyframes(name: string, keyframes: AnyMap): void;
  setRootVariables(variables: AnyMap): void;
  setUniversalVariables(variables: AnyMap): void;
  setWindowDimensions(
    width: number,
    height: number,
    scale: number,
    fontScale: number,
  ): void;
  updateComponentInlineStyleKeys(
    componentId: string,
    inlineStyleKeys: string[],
  ): void;
  updateComponentLayout(componentId: string, value: LayoutRectangle): void;
  updateComponentState(
    componentId: string,
    type: PseudoClassType,
    value: boolean,
  ): void;
  unlinkComponent(componentId: string): void;
}

/**
 * The raw JSI methods for StyleRegistry
 */
export interface RawStyleRegistry {
  linkComponent(componentId: string, tag: number): void;
  registerExternalMethods(options: { processColor: typeof processColor }): void;
}

/**
 * JS overrides for StyleRegistry to have better types in JS/TS
 */
export interface JSStyleRegistry {
  addStyleSheet(stylesheet: StyleSheet): void;
  setClassname(className: string, styleRule: StyleRule[]): void;
}

export interface Declarations {
  variableScope?: string;
  containerScope?: string;
  active?: boolean;
  focus?: boolean;
  hover?: boolean;
  attributeQueries?: [string, AttributeQuery][];
}

export interface Styled {
  style?: AnyMap;
  importantStyle?: AnyMap;
  props?: AnyMap;
  importantProps?: AnyMap;
}

export type PseudoClassType = "active" | "hover" | "focus";

/******************************    StyleSheet   *******************************/

export interface HybridStyleSheet {
  /** rem */
  r?: number;
  /** StyleRuleSets */
  s?: Record<string, HybridStyleRule[]>;
  // /** KeyFrames */
  k?: HybridAnimation[];
  // /** Root Variables */
  vr?: AnyMap;
  // /** Universal Variables */
  vu?: AnyMap;
}

export interface StyleSheet extends HybridStyleSheet {
  /** StyleRuleSets */
  s?: Record<string, StyleRule[]>;
}

/******************************    StyleRule    *******************************/

export interface HybridStyleRule {
  id?: string;
  /** Specificity */
  s: SpecificityArray;

  /** Style Declarations */
  d?: AnyMap;
  p?: AnyMap;

  /** Variables */
  v?: AnyMap;

  /** Container Names */
  c?: string[];

  /** MediaQuery */
  mq?: HybridMediaQuery;

  /** PseudoClass */
  pq?: PseudoClass;

  /** ContainerQuery */
  cq?: HybridContainerQuery[];

  /** ContainerQuery */
  aq?: AttributeQuery;
}

interface StyleRule extends HybridStyleRule {
  /** Declarations */
  d?: StyleRecord;
}

export type SpecificityArray = [number, number, number, number, number];

/******************************    Conditions    ******************************/

export type HybridMediaQuery = AnyMap;

export type MediaFeatureComparison = "eq" | "lte" | "lt" | "gt" | "gte";

interface PseudoClass {
  a?: boolean; // active
  f?: boolean; // focus
  h?: boolean; // hover
}

export interface HybridContainerQuery {
  /** Name */
  n?: string;
  /** MediaQuery */
  m?: AnyMap;
  /** PseudoClass */
  p?: PseudoClass;
}

export type ContainerQuery = HybridContainerQuery;

/***************************    Attribute Query    ****************************/

export interface AttributeQuery {
  // Attribute
  a?: AttributeQueryRule[];
  // Data-Attribute
  d?: AttributeQueryRule[];
}

export type AttributeQueryRule =
  | [AttrSelectorBooleanOperator, string]
  | [AttrSelectorOperator, string, string | number, AttrCaseFlag?];

export type AttrSelectorBooleanOperator = "true" | "false";

export type AttrSelectorOperator =
  | "true"
  | "false"
  | "eq"
  | "tilde"
  | "pipe"
  | "carat"
  | "dollar"
  | "star";

type AttrCaseFlag = "i" | "s";

/******************************    Animation   ********************************/

export type HybridAnimation = AnyMap;
export type JSAnimation = HybridAnimation & {
  id: string;
} & Record<string, Record<string, ValueType>>;
