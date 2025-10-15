import type { SpecificityArray } from "../specs/StyleRegistry/HybridStyleRegistry.nitro";

const Specificity = {
  order: 0,
  className: 1,
  important: 2,
  inline: 3,
  pseudoElements: 4,
  pseudoClass: 1,
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
