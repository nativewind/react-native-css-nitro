import type { AnyMap, HybridObject } from 'react-native-nitro-modules';

export interface StyleRegistry
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  registerClassname(className: string, ruleSets: AnyMap[]): void;
}
