import { NitroModules } from 'react-native-nitro-modules';
import type { RawStyleRegistry, StyleRegistry } from './StyleRegistry.nitro';

export const HybridStyleRegistry = NitroModules.createHybridObject<
  StyleRegistry & RawStyleRegistry
>('StyleRegistry');
