/**
 * Shared type definitions for the native TypeScript implementation
 *
 * This file helps bridge the gap between C++ types and TypeScript/Nitro types
 */

import type { AnyMap, ValueType } from "react-native-nitro-modules";

/**
 * In C++, AnyValue is a variant that can hold many types.
 * In TypeScript with Nitro, we use ValueType which is similar.
 *
 * Note: ValueType from nitro-modules is:
 * string | number | bigint | boolean | { [k: string]: ValueType } | ValueType[] | null
 *
 * We extend it to allow undefined for optional values
 */
export type AnyValue = ValueType | null | undefined;

/**
 * In C++, AnyArray is std::vector<AnyValue>
 * In TypeScript, we can use a more specific type
 */
export type AnyArray = ValueType[];

/**
 * In C++, AnyObject is std::unordered_map<std::string, AnyValue>
 * In TypeScript, we use a Record type
 */
export type AnyObject = Record<string, ValueType>;

/**
 * Helper type guard to check if a value is an array
 */
export function isArray(value: ValueType): value is AnyArray {
  return Array.isArray(value);
}

/**
 * Helper type guard to check if a value is an object
 */
export function isObject(value: ValueType): value is AnyObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Helper type guard to check if a value is an AnyMap (object)
 */
export function isAnyMap(value: unknown): value is AnyMap {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Helper type guard to check if a value is a string
 */
export function isString(value: ValueType): value is string {
  return typeof value === "string";
}

/**
 * Helper type guard to check if a value is a number
 */
export function isNumber(value: ValueType): value is number {
  return typeof value === "number";
}

/**
 * Helper type guard to check if a value is a boolean
 */
export function isBoolean(value: ValueType): value is boolean {
  return typeof value === "boolean";
}

/**
 * Helper to safely access object property
 */
export function getObjectProperty(
  obj: ValueType,
  key: string,
): ValueType | undefined {
  if (isObject(obj)) {
    return obj[key];
  }
  return undefined;
}

/**
 * Helper to create an AnyMap from a plain object
 */
export function toAnyMap(obj: AnyObject): AnyMap {
  // AnyMap from nitro-modules is already compatible with plain objects
  return obj as unknown as AnyMap;
}

/**
 * Helper to convert AnyMap to plain object
 */
export function fromAnyMap(map: AnyMap): AnyObject {
  return map as unknown as AnyObject;
}

/**
 * Helper to check if a value is defined (not null or undefined)
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Assertion helper for cases where we know a value should exist
 */
export function assertDefined<T>(
  value: T | null | undefined,
  message?: string,
): asserts value is T {
  if (!isDefined(value)) {
    throw new Error(message ?? "Expected value to be defined");
  }
}

/**
 * Type for style values that can be undefined (for optional styles)
 */
export type OptionalValue = ValueType | undefined;

/**
 * Type for functions that may return undefined
 */
export type MaybeValue<T> = T | undefined;
