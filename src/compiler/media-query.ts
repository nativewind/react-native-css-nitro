/* eslint-disable */
import type {
  MediaCondition as CSSMediaCondition,
  MediaFeatureComparison as CSSMediaFeatureComparison,
  MediaFeatureValue as CSSMediaFeatureValue,
  MediaQuery as CSSMediaQuery,
  QueryFeatureFor_MediaFeatureId,
} from "lightningcss";
import type { AnyMap, ValueType } from "react-native-nitro-modules";

import type {
  HybridMediaQuery,
  MediaFeatureComparison,
} from "../specs/StyleRegistry";
import { calcArguments, length } from "./parsers";

export function mapMediaQueries(
  cssQueries: CSSMediaQuery[],
): HybridMediaQuery[] {
  const media: HybridMediaQuery[] = [];

  for (const { mediaType, qualifier, condition } of cssQueries) {
    if (
      // Print is for printing documents
      (mediaType === "print" && qualifier !== "not") ||
      // If this is a @media not print {}
      // We can only do this if there are no conditions, as @media not print and (min-width: 100px) could be valid
      (mediaType !== "print" && qualifier === "not" && condition === null)
    ) {
      continue;
    }

    if (mediaType) {
      if (mediaType === "print") {
        continue;
      }
    }

    let query = mapMediaConditions(condition, {});

    if (mediaType !== "all" && mediaType !== "screen") {
      query.platform = mediaType;
    }

    if (qualifier === "not" && mediaType !== "print") {
      query = { not: query };
    }

    media.push(query);
  }

  return media;
}

function mapMediaConditions(
  condition: CSSMediaCondition | CSSMediaCondition[] | null | undefined,
  query: AnyMap,
): AnyMap {
  if (!condition) {
    return query;
  }

  if (Array.isArray(condition)) {
    return condition.reduce((acc, c) => {
      const anyMap = mapMediaConditions(c, query);

      acc.and ??= [];
      (acc.and as ValueType[]).push(anyMap);

      return acc;
    }, query);
  }

  switch (condition.type) {
    case "feature":
      const { name } = condition.value;

      let q = query;

      if (query.name) {
        query.and ??= [];
        q = {};
        (query.and as AnyMap[]).push(q);
      }

      const value = parseFeature(condition.value);
      if (value !== undefined) {
        q[name] = value;
      }
      break;
    case "not":
      query.not ??= {};
      mapMediaConditions(condition.value, query.not as AnyMap);
      break;
    case "operation":
      query[condition.operator] ??= [];
      const nextQuery: AnyMap = {};
      (query[condition.operator] as AnyMap[]).push(nextQuery);
      mapMediaConditions(condition.conditions, nextQuery);
      break;
    default:
      condition satisfies never;
  }

  return query;
}

function parseFeature(
  feature: QueryFeatureFor_MediaFeatureId,
): ValueType[] | undefined {
  switch (feature.type) {
    case "boolean":
      return ["true"];
    case "plain": {
      const value = parseMediaFeatureValue(feature.value);
      if (value === undefined) {
        return;
      }
      return ["=", value];
    }
    case "range": {
      const value = parseMediaFeatureValue(feature.value);
      if (value === undefined) {
        return;
      }
      return [parseMediaFeatureOperator(feature.operator), value];
    }
    case "interval": {
      const start = parseMediaFeatureValue(feature.start);
      const end = parseMediaFeatureValue(feature.end);
      if (start === undefined || end === undefined) {
        return;
      }
      return [
        "[]",
        start,
        parseMediaFeatureOperator(feature.startOperator),
        end,
        parseMediaFeatureOperator(feature.endOperator),
      ];
    }
    default:
      feature satisfies never;
  }
  return;
}

export function parseMediaFeatureValue(
  value: CSSMediaFeatureValue,
): ValueType | undefined {
  switch (value.type) {
    case "boolean":
    case "ident":
    case "integer":
    case "number":
      return value.value;
    case "length":
      switch (value.value.type) {
        case "value":
          return length(value.value.value);
        case "calc": {
          const args = calcArguments(value.value.value);
          if (args === undefined) {
            return;
          } else if (Array.isArray(args)) {
            return ["fn", "calc", ...args];
          } else {
            return ["fn", "calc", args];
          }
        }
        default:
          value.value satisfies never;
          return;
      }
    case "resolution":
      switch (value.value.type) {
        case "dpi":
          // Mobile devices use 160 as a standard
          return value.value.value / 160;
        case "dpcm":
          // There are 1in = ~2.54cm
          return value.value.value / (160 * 2.54);
        case "dppx":
          return value.value.value;
        default:
          value.value satisfies never;
          return undefined;
      }
    case "ratio":
    case "env":
  }

  return;
}

export function parseMediaFeatureOperator(
  operator: CSSMediaFeatureComparison,
): MediaFeatureComparison {
  switch (operator) {
    case "equal":
      return "eq";
    case "greater-than":
      return "gt";
    case "greater-than-equal":
      return "gte";
    case "less-than":
      return "lt";
    case "less-than-equal":
      return "lte";
    default:
      operator satisfies never;
      throw new Error(`Unknown MediaFeatureComparison operator ${operator}`);
  }
}
