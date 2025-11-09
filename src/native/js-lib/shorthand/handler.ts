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

export function createShorthandResolver(
  mappings: ShorthandRequiredValue[][],
  defaults: ShorthandDefaultValue[],
  returnType: "shorthandObject" | "tuples" | "object" = "shorthandObject",
) {
  const resolver: ShorthandResolver = (args): AnyValue => {
    if (!Array.isArray(args)) {
      return;
    }

    const match = mappings.find((mapping) => {
      return (
        args.length === mapping.length &&
        mapping.every((map, index) => {
          const type = map[1];
          const value = args[index];

          if (Array.isArray(type)) {
            return type.includes(value) || type.includes(typeof value);
          }

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
        })
      );
    });

    if (!match) return;

    const seenDefaults = new Set(defaults);

    const tuples: [ValueType, string][] = [
      ...match.map((map, index) => {
        if (map.length === 3) {
          seenDefaults.delete(map);
        }
        const value = args[index];
        return [value, map[0]] as [ValueType, string];
      }),
      ...Array.from(seenDefaults).map((map) => {
        const value = defaults[map[2]] ?? map[2];
        return [value, map[0]] as [ValueType, string];
      }),
    ];

    if (returnType === "shorthandObject" || returnType === "object") {
      const target: AnyMap = returnType === "shorthandObject" ? {} : {};

      for (const [value, prop] of tuples) {
        if (typeof prop === "string") {
          target[prop] = value;
        }
      }

      return target;
    } else {
      return tuples;
    }
  };

  return resolver;
}
