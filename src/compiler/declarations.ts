import type { Declaration } from "lightningcss";
import type { ValueType } from "react-native-nitro-modules";

import type { HybridStyleRule } from "../specs/StyleRegistry";
import type { CompilerOptions } from "./compiler.types";
import { customDeclaration, parsers, unparsed, type Parser } from "./parsers";
import { toRNProperty } from "./selectors-new";

export class DeclarationBuilder {
  private declaration: Partial<HybridStyleRule> = {};
  private readonly declarations: Partial<HybridStyleRule>[] = [
    this.declaration,
  ];

  constructor(
    private options: CompilerOptions,
    private mapping: Record<string, string>,
  ) {}

  getOptions() {
    return this.options;
  }

  getAllRules() {
    return this.declarations;
  }

  set(property: string, value: ValueType | undefined, rule = this.declaration) {
    if (Array.isArray(value) && value[0] === "___light-dark___") {
      this.set(property, value[1], this.declaration);

      const darkRule: Partial<HybridStyleRule> = {
        mq: { "prefers-color-scheme": "dark" },
      };
      this.declarations.push(darkRule);
      this.set(property, value[2], darkRule);

      return;
    }

    if (value === undefined) {
      return;
    }

    // Support both CSS and RN naming conventions
    property = this.mapping[property] ?? property;
    property = toRNProperty(property);
    property = this.mapping[property] ?? property;

    rule.d ??= {};
    rule.d[property] = value;

    if (property === "font-size") {
      rule.v ??= {};
      rule.v["__rn-css-em"] = value;
    } else if (property === "color") {
      rule.v ??= {};
      rule.v["__rn-css-color"] = value;
    }
  }

  setProp(property: string, value: ValueType | undefined) {
    if (value === undefined) {
      return;
    }
    // Support both CSS and RN naming conventions
    property = this.mapping[property] ?? property;
    property = toRNProperty(property);
    property = this.mapping[property] ?? property;

    this.declaration.p ??= {};
    this.declaration.p[property] = value;
  }

  setVariable(name: string, value: ValueType | undefined) {
    if (value === undefined) {
      return;
    }

    if (name.startsWith("--")) {
      name = name.slice(2);
    }

    this.declaration.v ??= {};
    this.declaration.v[name] = value;
  }

  setShorthand(property: string, value: Record<string, ValueType | undefined>) {
    const entries = Object.entries(value);
    const firstValue = entries[0]?.[1];

    if (entries.every(([, v]) => v === firstValue)) {
      this.set(property, firstValue);
    } else {
      for (const [subProperty, subValue] of entries) {
        this.set(subProperty, subValue);
      }
    }
  }

  addContainer(name: string[] | false) {
    this.declaration.c ??= [];
    if (name === false) {
      this.declaration.c.push("___unset___");
    } else {
      this.declaration.c.push(...name);
    }
  }

  getStyle() {
    return this.declaration.d;
  }

  addRule(rule: Partial<HybridStyleRule>) {
    this.declarations.push(rule);
  }
}

export function parseDeclaration(
  declaration: Declaration,
  rule: DeclarationBuilder,
) {
  if ("vendorPrefix" in declaration && declaration.vendorPrefix.length) {
    return;
  }

  if (
    "value" in declaration &&
    typeof declaration.value === "object" &&
    "vendorPrefix" in declaration.value &&
    Array.isArray(declaration.value.vendorPrefix) &&
    declaration.value.vendorPrefix.length
  ) {
    return;
  }

  const parser = parsers[declaration.property] as Parser | undefined;
  if (parser) {
    rule.set(declaration.property, parser(declaration, rule) ?? undefined);
  } else if (declaration.property === "unparsed") {
    rule.set(
      declaration.value.propertyId.property,
      unparsedDeclaration(declaration, rule),
    );
  } else if (declaration.property === "custom") {
    customDeclaration(declaration, rule);
  }

  // Should add warning for unknown properties
}
const runtimeShorthands = new Set([
  "animation",
  "border",
  "box-shadow",
  "line-height",
  "text-shadow",
  "transform",
]);

function unparsedDeclaration(
  declaration: Extract<Declaration, { property: "unparsed" }>,
  rule: DeclarationBuilder,
) {
  const property = declaration.value.propertyId.property;

  if (!(property in parsers)) {
    // TODO: Add warning
    return;
  }

  /**
   * Unparsed shorthand properties need to be parsed at runtime
   */
  const parser = runtimeShorthands.has(property);
  if (parser) {
    const value = unparsed(declaration.value.value, rule);
    if (value === undefined) {
      return;
    }
    return ["fn", toRNProperty(property), ...value];
  } else {
    return unparsed(declaration.value.value, rule);
  }
}
