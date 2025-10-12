import { NitroModules } from 'react-native-nitro-modules';
import type { HybridStyleRegistry } from './HybridStyleRegistry.nitro';

export const StyleRegistry =
  NitroModules.createHybridObject<HybridStyleRegistry>('HybridStyleRegistry');
