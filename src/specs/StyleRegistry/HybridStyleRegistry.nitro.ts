import type { processColor } from "react-native";

import type {
  MediaFeatureComparison,
  MediaFeatureNameFor_MediaFeatureId,
} from "lightningcss";
import type { AnyMap, HybridObject } from "react-native-nitro-modules";

export type HybridStyleRegistry = StyleRegistry & RawStyleRegistry;

export interface StyleRegistry
  extends HybridObject<{ ios: "c++"; android: "c++" }> {
  set(className: string, styleRule: StyleRule[]): void;
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
  style?: AnyMap[];
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

/******************************    StyleRule    *******************************/

interface StyleRule {
  s: SpecificityArray;
  v?: VariableDescriptor[];
  d?: StyleDescriptor[];

  /** MediaQuery */
  m?: MediaCondition[];
}

type SpecificityArray = number[];
type StyleDescriptor = AnyMap;

/******************************    Variables    *******************************/

type VariableDescriptor = [
  string,
  AnyMap | AnyMap[] | string | number | boolean,
];

/******************************    Conditions    ******************************/

export type MediaCondition =
  | [string, string]
  | [string, string[]]
  // Comparison
  | [
      MediaFeatureComparison,
      MediaFeatureNameFor_MediaFeatureId,
      StyleDescriptor,
    ]
  // [Start, End]
  | [
      string,
      MediaFeatureNameFor_MediaFeatureId,
      StyleDescriptor, // Start
      MediaFeatureComparison, // Start comparison
      StyleDescriptor, // End
      MediaFeatureComparison, // End comparison
    ];
