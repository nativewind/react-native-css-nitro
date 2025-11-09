import type {
  AttributeQuery,
  AttributeQueryRule,
} from "../specs/StyleRegistry";

export function testAttributeQuery(
  props: Record<string, any>,
  query: AttributeQuery,
  isDisabled: boolean,
): boolean {
  if (
    query.a &&
    !query.a.every((rule) =>
      testAttributeQueryRule("a", props, rule, isDisabled),
    )
  ) {
    return false;
  }

  if (
    query.d &&
    !query.d.every((rule) =>
      testAttributeQueryRule("d", props, rule, isDisabled),
    )
  ) {
    return false;
  }

  return true;
}

function testAttributeQueryRule(
  type: "a" | "d",
  props: Record<string, any>,
  rule: AttributeQueryRule,
  _isDisabled: boolean,
): boolean {
  const source = type === "a" ? props : props.dataSet;
  let [operator, key, value, flag] = rule;

  if (!source) {
    return operator === "false";
  }

  if (operator === "true" || operator === "false") {
    return operator === "true"
      ? key in source && source[key]
      : !(key in source) || !source[key];
  }

  let sourceValue = source[key];

  if (flag === "i") {
    sourceValue = sourceValue?.toString().toLowerCase();
    value = value?.toString().toLowerCase();
  } else if (flag === "s") {
    sourceValue = sourceValue?.toString();
    value = value?.toString();
  }

  switch (operator) {
    case "eq":
      return sourceValue == value;
    case "tilde":
      return value && sourceValue?.toString().split(" ").includes(value);
    case "pipe":
      return (
        value && sourceValue?.toString().startsWith(value.toString() + "-")
      );
    case "carat":
      return value && sourceValue?.toString().startsWith(value.toString());
    case "dollar":
      return value && sourceValue?.toString().endsWith(value.toString());
    case "star":
      return value && sourceValue?.toString().includes(value.toString());
    default:
      return false;
  }
}
