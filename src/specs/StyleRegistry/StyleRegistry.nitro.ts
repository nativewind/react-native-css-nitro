import type { HybridObject, Sync } from 'react-native-nitro-modules';
import type { ShadowNode } from './types';

export interface StyleRegistry
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  set(className: string, styleRule: StyleRule): void;
  registerComponent(
    componentId: string,
    classNames: string,
    variableContext: string,
    containerContext: string,
    configs: StyleConfig[],
    testPropFn: Sync<
      (prop: string[], value: string | number | boolean) => boolean
    >
  ): string[];
  unregisterComponent(componentId: string): void;
  unlink(subscriptionId: number): void;
}

/**
 * The raw JSI methods for StyleRegistry
 */
export interface RawStyleRegistry {
  link(
    componentId: string,
    shadowNode: ShadowNode,
    rerender: () => void
  ): number;
}

export type StyleConfig = [
  source: string,
  target: string[],
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
