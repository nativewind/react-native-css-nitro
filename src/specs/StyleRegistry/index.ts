import { Dimensions, processColor } from "react-native";

import { NitroModules } from "react-native-nitro-modules";

import type { StyleRule } from "../../compiler/types";
import type { HybridStyleRegistry } from "./HybridStyleRegistry.nitro";

export const StyleRegistry = NitroModules.createHybridObject<
  Omit<HybridStyleRegistry, keyof JSStyleRegistry> & JSStyleRegistry
>("HybridStyleRegistry");

interface JSStyleRegistry {
  setClassname(className: string, styleRule: StyleRule[]): void;
}

const { width, height, scale, fontScale } = Dimensions.get("window");
StyleRegistry.setWindowDimensions(width, height, scale, fontScale);
Dimensions.addEventListener("change", ({ window }) => {
  StyleRegistry.setWindowDimensions(
    window.width,
    window.height,
    window.scale,
    window.fontScale,
  );
});

StyleRegistry.registerExternalMethods({
  processColor,
});
