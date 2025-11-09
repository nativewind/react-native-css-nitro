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

/**
 * Comparing two specificity arrays.
 * Returns true if 'a' should come before 'b' in the sorted order.
 *
 * @param a First specificity array
 * @param b Second specificity array
 * @return true if a should come before b (a has higher specificity)
 */
function specificityCompare(a: SpecificityArray, b: SpecificityArray): boolean {
  // Compare each index in order, higher values come first
  if (a[0] !== b[0]) return a[0] > b[0];
  if (a[1] !== b[1]) return a[1] > b[1];
  if (a[2] !== b[2]) return a[2] > b[2];
  if (a[3] !== b[3]) return a[3] > b[3];
  return a[4] > b[4];
}

export function specificitySort(
  a: SpecificityArray,
  b: SpecificityArray,
  ascending = true,
): number {
  return specificityCompare(a, b) ? (ascending ? 1 : -1) : ascending ? -1 : 1;
}
