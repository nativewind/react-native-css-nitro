import { NitroModules } from 'react-native-nitro-modules';
import type { CssNitro } from './CssNitro.nitro';

const CssNitroHybridObject =
  NitroModules.createHybridObject<CssNitro>('CssNitro');

export function multiply(a: number, b: number): number {
  return CssNitroHybridObject.multiply(a, b);
}
