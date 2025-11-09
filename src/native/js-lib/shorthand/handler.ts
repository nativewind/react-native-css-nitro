import type { AnyMap, ValueType } from "react-native-nitro-modules";

import type { AnyValue } from "../types";

type ShorthandType = "string" | "number" | "length" | "color";

type ShorthandRequiredValue =
  | readonly [string | readonly string[], ShorthandType]
  | ShorthandDefaultValue;

type ShorthandDefaultValue = readonly [
  string | readonly string[],
  ShorthandType,
  any,
];

export type ShorthandResolver = (args: AnyValue) => AnyValue;

function matchesType(value: any, type: ShorthandType): boolean {
  switch (type) {
    case "string":
    case "number":
      return typeof value === type;
    case "color":
      return typeof value === "string" || typeof value === "object";
    case "length":
      return typeof value === "string"
        ? value.endsWith("%")
        : typeof value === "number";
  }
}

export function createShorthandResolver(
  mappings: ShorthandRequiredValue[][],
  defaults: ShorthandDefaultValue[],
  returnType: "shorthandObject" | "tuples" | "object" = "shorthandObject",
) {
  const resolver: ShorthandResolver = (args): AnyValue => {
    if (!Array.isArray(args)) {
      return;
    }

    // Find a mapping pattern that matches the argument types
    const matchedMapping = mappings.find((mapping) => {
      if (args.length !== mapping.length) return false;

      return mapping.every((definition, index) => {
        const expectedType = definition[1];
        const value = args[index];

        // Handle array of allowed values/types
        if (Array.isArray(expectedType)) {
          return (
            expectedType.includes(value) || expectedType.includes(typeof value)
          );
        }

        // Handle specific type checks
        return matchesType(value, expectedType);
      });
    });

    if (!matchedMapping) return;

    // Track which defaults were provided in the matched mapping
    const providedDefaults = new Set<ShorthandDefaultValue>();
    matchedMapping.forEach((def) => {
      if (def.length === 3) {
        providedDefaults.add(def);
      }
    });

    // Build tuples from matched args + unfulfilled defaults
    const tuples: [ValueType, string][] = [
      ...matchedMapping.map((definition, index) => {
        const propertyName = Array.isArray(definition[0])
          ? definition[0][0]
          : definition[0];
        return [args[index], propertyName] as [ValueType, string];
      }),
      ...defaults
        .filter((def) => !providedDefaults.has(def))
        .map((def) => {
          const propertyName = Array.isArray(def[0]) ? def[0][0] : def[0];
          return [def[2], propertyName] as [ValueType, string];
        }),
    ];

    // Return based on requested format
    if (returnType === "tuples") {
      return tuples;
    }

    // Both "shorthandObject" and "object" return the same structure
    const result: AnyMap = {};
    for (const [value, prop] of tuples) {
      result[prop] = value;
    }
    return result;
  };

  const bulkResolver: ShorthandResolver = (args): AnyValue => {
    if (!Array.isArray(args)) {
      return;
    }

    // Flatten and split into groups by comma
    const flatArgs = args.flat(10);
    const groups: AnyValue[][] = [];
    let current: AnyValue[] = [];

    for (const item of flatArgs) {
      if (item === ",") {
        if (current.length > 0) {
          groups.push(current);
          current = [];
        }
      } else {
        current.push(item);
      }
    }

    // Add the last group if it has items
    if (current.length > 0) {
      groups.push(current);
    }

    // Process groups
    if (groups.length === 0) {
      return;
    }

    if (groups.length === 1) {
      return resolver(groups[0] as AnyValue);
    }

    return groups.map((group) => resolver(group as AnyValue)) as AnyValue;
  };

  return bulkResolver;
}
