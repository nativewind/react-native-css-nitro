import type { SpecificityArray } from "../specs/StyleRegistry/HybridStyleRegistry.nitro";

export const Specificity = {
  important: 0,
  inline: 1,
  pseudoElements: 2,
  className: 3,
  pseudoClass: 3,
  order: 4,
  // Id: 0, - We don't support ID yet
  // StyleSheet: 0, - We don't support multiple stylesheets
};

const specificityKeys = new Set(Object.keys(Specificity));

export function specificity(
  options: Partial<typeof Specificity>,
): SpecificityArray {
  const spec: SpecificityArray = [0, 0, 0, 0, 0];

  for (const [key, value] of Object.entries(options)) {
    if (value && specificityKeys.has(key)) {
      const index = Specificity[key as keyof typeof Specificity];
      spec[index] ??= 0;
      spec[index] += value;
    }
  }

  return spec;
}
