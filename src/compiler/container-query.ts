import type {
  ContainerRule,
  ContainerCondition as CSSContainerCondition,
  QueryFeatureFor_ContainerSizeFeatureId,
} from "lightningcss";
import type { AnyMap, ValueType } from "react-native-nitro-modules";

import type { ContainerQuery, HybridMediaQuery } from "../specs/StyleRegistry";
import {
  parseMediaFeatureOperator,
  parseMediaFeatureValue,
} from "./media-query";

export function getContainerQuery(containerRule: ContainerRule) {
  const m = parseContainerMedia(containerRule.condition, {});

  if (!m || Object.values(m).length === 0) {
    return;
  }

  const query: ContainerQuery = {
    m,
  };

  if (containerRule.name) {
    query.n = `c:${containerRule.name}`;
  }

  return query;
}

function parseContainerMedia(
  condition: CSSContainerCondition,
  query: HybridMediaQuery,
): HybridMediaQuery | undefined {
  switch (condition.type) {
    case "feature": {
      const feature = parseFeature(condition.value);
      if (feature && !feature.includes(undefined)) {
        query[condition.value.name] = feature as ValueType[];
      }
      return query;
    }
    case "not": {
      const result = parseContainerMedia(condition.value, {});
      if (result) {
        query.not = result;
      }
      return query;
    }
    case "operation": {
      query[condition.operator] ??= [];
      for (const cond of condition.conditions) {
        const nextQuery: AnyMap = {};
        const result = parseContainerMedia(cond, nextQuery);
        if (result) {
          (query[condition.operator] as AnyMap[]).push(nextQuery);
        }
      }
      return query;
    }
    case "style":
      // We don't support these yet
      return;
    default:
      condition satisfies never;
      return;
  }
}

function parseFeature(feature: QueryFeatureFor_ContainerSizeFeatureId) {
  switch (feature.type) {
    case "boolean":
      return ["true"];
    case "plain":
      return ["eq", parseMediaFeatureValue(feature.value)];
    case "range":
      return [
        parseMediaFeatureOperator(feature.operator),
        parseMediaFeatureValue(feature.value),
      ];
    case "interval":
      return [
        "[]",
        parseMediaFeatureValue(feature.start),
        parseMediaFeatureOperator(feature.startOperator),
        parseMediaFeatureValue(feature.end),
        parseMediaFeatureOperator(feature.endOperator),
      ];
    default:
      feature satisfies never;
      return;
  }
}
