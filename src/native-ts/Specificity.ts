/**
 * Specificity: CSS specificity comparison utilities
 * Converted from cpp/Specificity.hpp
 */

import type { SpecificityArray } from "../specs/StyleRegistry";

export const Specificity = {
  /**
   * Sort function for comparing two specificity arrays.
   * Returns true if 'a' should come before 'b' in the sorted order.
   * Sorts in reverse order (larger values first).
   *
   * @param a First specificity array
   * @param b Second specificity array
   * @return true if a should come before b (a has higher specificity)
   */
  sort(a: SpecificityArray, b: SpecificityArray): boolean {
    // Compare each index in order, higher values come first
    if (a[0] !== b[0]) return a[0] > b[0];
    if (a[1] !== b[1]) return a[1] > b[1];
    if (a[2] !== b[2]) return a[2] > b[2];
    if (a[3] !== b[3]) return a[3] > b[3];
    return a[4] > b[4];
  },
} as const;
