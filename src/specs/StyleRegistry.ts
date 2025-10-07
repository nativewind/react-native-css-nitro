import type { AnyMap, HybridObject } from 'react-native-nitro-modules';

export interface StyleRegistry
  extends HybridObject<{ ios: 'c++'; android: 'c++' }> {
  register(className: string, ruleSets: AnyMap[]): void;
}
