import type { AnyMap, HybridObject, Sync } from 'react-native-nitro-modules';
import type { ShadowNode } from './types';

export interface StyleRegistry
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  registerClassname(className: string, styleRule: StyleRule): void;
  registerComponent(
    componentId: string,
    classNames: string,
    variableContext: number,
    containerContext: number,
    configs: StyleConfig[],
    testPropFn: Sync<
      (prop: string[], value: string | number | boolean) => boolean
    >
  ): ClassnameData;
  unsubscribeComponentRef(subscriptionId: number): void;
}

/**
 * The raw JSI methods for StyleRegistry
 */
export interface RawStyleRegistry {
  subscribeComponentRef(
    componentId: string,
    shadowNode: ShadowNode,
    rerender: () => void
  ): number;
}

export type BaseStyleConfig = [
  source: string,
  target: string[],
  StyleConfigNativeStyleToProp[],
];

export type StyleConfig = [
  source: string,
  target: string[],
  targetValue: AnyMap | undefined,
  StyleConfigNativeStyleToProp[],
];
export type StyleConfigNativeStyleToProp = [string, string[]];

interface StyleRule {
  s: SpecificityArray;
  v?: VariableDescriptor[];
}

type SpecificityArray = number[];

/******************************    Variables    *******************************/

type VariableDescriptor = [string, StyleDescriptor[]];

type StyleDescriptor = string | number | boolean | undefined;

type ClassnameData = {
  variableContext: number;
  containerContext: number;
};
