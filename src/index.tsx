import { NitroModules } from "react-native-nitro-modules";

import type { CssNitro } from "./CssNitro.nitro";
import type { Math } from "./specs/Math.nitro";

export { StyleRegistry } from "./specs/StyleRegistry";
export { useStyled } from "./native/useStyled";
export * from "./native/specificity";

const CssNitroHybridObject =
  NitroModules.createHybridObject<CssNitro>("CssNitro");

const MathHybridObject = NitroModules.createHybridObject<Math>("Math");

export function multiply(a: number, b: number): number {
  return CssNitroHybridObject.multiply(a, b);
}

export function add(a: number, b: number): number {
  return MathHybridObject.add(a, b);
}
