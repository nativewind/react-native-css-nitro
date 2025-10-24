import type {
  CustomAtRules,
  Declaration,
  DeclarationBlock,
  StyleSheet,
  TokenOrValue,
  Visitor,
} from "lightningcss";

import type { CompilerOptions, UniqueVarInfo } from "./compiler.types";
import { round } from "./parsers";

type Loader = ReturnType<
  typeof import("./lightningcss-loader").lightningcssLoader
>;

export function inlineVariablesWithSingleUsage(
  code: string | Buffer,
  options: CompilerOptions,
  lightningcss: Loader["lightningcss"],
  Features: Loader["Features"],
  logger: NonNullable<CompilerOptions["logger"]>,
) {
  /**
   * Use the lightningcss library to traverse the CSS AST and extract style declarations and animations
   *
   * devongovett on Aug 20, 2023
   * > calc simplification happens during the initial parse phase, which is before custom visitors run. Currently there is not an additional simplification pass done after transforms, resulting in the output you see here.
   * https://github.com/parcel-bundler/lightningcss/issues/554#issuecomment-1685143494
   *
   * Due to the above issue, we run lightningcss twice
   */

  const vars = new Map<string, UniqueVarInfo>();
  const isLoggerEnabled =
    "enabled" in logger ? logger.enabled : Boolean(logger);

  const firstPassVisitor: Visitor<CustomAtRules> = {};

  if (options.inlineRem !== false) {
    firstPassVisitor.Length = (length) => {
      if (length.unit !== "rem" || options.inlineRem === false) {
        return length;
      }

      return {
        unit: "px",
        value: round(length.value * (options.inlineRem ?? 14)),
      };
    };
  }

  if (options.inlineVariables !== false) {
    const exclusionList: string[] = options.inlineVariables?.exclude ?? [];

    firstPassVisitor.Declaration = (decl) => {
      if (
        decl.property === "custom" &&
        decl.value.name.startsWith("--") &&
        !exclusionList.includes(decl.value.name)
      ) {
        const entry = vars.get(decl.value.name) ?? {
          count: 0,
          value: [
            ...decl.value.value,
            { type: "token", value: { type: "white-space", value: " " } },
          ],
        };
        entry.count++;
        vars.set(decl.value.name, entry);
      }
    };
    firstPassVisitor.StyleSheetExit = (sheet) => {
      return inlineVariables(sheet, vars);
    };
  }

  const { code: firstPass } = lightningcss({
    code: typeof code === "string" ? new TextEncoder().encode(code) : code,
    include: Features.DoublePositionGradients | Features.ColorFunction,
    exclude: Features.VendorPrefixes,
    visitor: firstPassVisitor,
    filename: options.filename ?? "style.css",
    projectRoot: options.projectRoot ?? process.cwd(),
  });

  if (isLoggerEnabled) {
    const MAX_LOG_SIZE = 100 * 1024; // 100KB
    if (firstPass.length <= MAX_LOG_SIZE) {
      logger(firstPass.toString());
    } else {
      logger(
        `firstPass buffer too large to log in full (${firstPass.length} bytes). Preview: ` +
          firstPass.subarray(0, 1024).toString() +
          "...",
      );
    }
  }

  return firstPass;
}

export function inlineVariables(
  stylesheet: StyleSheet,
  vars: Map<string, UniqueVarInfo>,
) {
  for (const [name, info] of [...vars]) {
    if (info.count !== 1) {
      vars.delete(name);
    } else {
      flattenVar(name, vars);
    }
  }

  stylesheet.rules = stylesheet.rules.map(function checkRule(rule) {
    switch (rule.type) {
      case "custom":
      case "font-face":
      case "font-palette-values":
      case "font-feature-values":
      case "namespace":
      case "layer-statement":
      case "property":
      case "view-transition":
      case "ignored":
      case "unknown":
      case "import":
      case "page":
      case "counter-style":
      case "moz-document":
      case "nesting":
      case "viewport":
      case "custom-media":
      case "scope":
      case "starting-style":
        return rule;

      case "media":
        rule.value.rules = rule.value.rules.map((rule) => checkRule(rule));
        return rule;
      case "keyframes":
        rule.value.keyframes = rule.value.keyframes.map((keyframe) => {
          keyframe.declarations =
            replaceDeclarationBlock(keyframe.declarations, vars) ??
            keyframe.declarations;

          return keyframe;
        });
        return rule;
      case "style":
        rule.value.declarations = replaceDeclarationBlock(
          rule.value.declarations,
          vars,
        );

        rule.value.rules = rule.value.rules?.flatMap((rule) => checkRule(rule));

        return rule;
      case "nested-declarations":
        rule.value.declarations =
          replaceDeclarationBlock(rule.value.declarations, vars) ?? {};
        return rule;
      case "supports":
        rule.value.rules = rule.value.rules.flatMap((rule) => checkRule(rule));
        return rule;
      case "layer-block":
        rule.value.rules = rule.value.rules.flatMap((rule) => checkRule(rule));
        return rule;
      case "container":
        rule.value.rules = rule.value.rules.flatMap((rule) => checkRule(rule));
        return rule;
    }
  });

  return stylesheet;
}

function replaceDeclarationBlock(
  block: DeclarationBlock | undefined,
  vars: Map<string, UniqueVarInfo>,
) {
  if (!block) return;

  block.declarations = block.declarations
    ?.map((decl) => {
      return replaceDeclaration(decl, vars);
    })
    .filter((d) => !!d);

  block.importantDeclarations = block.importantDeclarations
    ?.map((decl) => {
      return replaceDeclaration(decl, vars);
    })
    .filter((d) => !!d);

  return block;
}

function replaceDeclaration(
  declaration: Declaration,
  vars: Map<string, UniqueVarInfo>,
) {
  if (
    declaration.property !== "unparsed" &&
    declaration.property !== "custom"
  ) {
    return declaration;
  }

  if (declaration.property === "custom" && vars.has(declaration.value.name)) {
    return;
  }

  declaration.value.value = declaration.value.value.flatMap((part) => {
    return flattenPart(part, vars);
  });

  return declaration;
}

function flattenPart(
  part: TokenOrValue,
  vars: Map<string, UniqueVarInfo>,
): TokenOrValue | TokenOrValue[] {
  if (part.type === "var") {
    const varInfo = vars.get(part.value.name.ident);

    if (!varInfo) {
      part.value.fallback = part.value.fallback?.flatMap((arg) => {
        return flattenPart(arg, vars);
      });

      return part;
    } else if (varInfo.value === undefined) {
      const fallback = part.value.fallback?.flatMap((arg) => {
        return flattenPart(arg, vars);
      });

      return fallback ?? [];
    }

    return varInfo.value;
  } else if (part.type === "function") {
    part.value.arguments = part.value.arguments.flatMap((arg) => {
      return flattenPart(arg, vars);
    });
  }

  return part;
}

function flattenVar(
  name: string,
  vars: Map<string, UniqueVarInfo>,
  seen = new Set<string>(),
) {
  if (seen.has(name)) {
    vars.delete(name);
  }

  seen.add(name);

  let varInfo = vars.get(name);

  if (!varInfo || varInfo.flat) {
    return;
  }

  let varInfoValue = varInfo.value?.flatMap((part) => {
    if (part.type === "var") {
      const name = part.value.name.ident;

      flattenVar(name, vars, seen);

      const nestedVarInfo = vars.get(part.value.name.ident);
      if (nestedVarInfo?.value) {
        return nestedVarInfo.value;
      }
    }
    return flattenPart(part, vars);
  });

  // If the variable is shorthand for "initial", substitute it for undefined
  if (
    varInfoValue?.length === 2 &&
    varInfoValue[0]?.type === "token" &&
    varInfoValue[0].value.type === "ident" &&
    varInfoValue[0].value.value === "initial" &&
    varInfoValue[1]?.type === "token" &&
    varInfoValue[1].value.type === "white-space"
  ) {
    varInfoValue = undefined;
  }

  varInfo = {
    count: 1,
    flat: true,
    value: varInfoValue,
  };

  vars.set(name, varInfo);
}
