import { inspect } from "node:util";

import { debug } from "debug";
import { type CustomAtRules, type Rule, type Visitor } from "lightningcss";

import { maybeMutateReactNativeOptions, parsePropAtRule } from "./atRules";
import type { CompilerOptions } from "./compiler.types";
import { inlineVariablesWithSingleUsage } from "./inline-variables";
import { lightningcssLoader } from "./lightningcss-loader";
import { CompilerStyleSheet } from "./stylesheet";
import { supportsConditionValid } from "./supports";

const defaultLogger = debug("react-native-css:compiler");

/**
 * Converts a CSS file to a collection of style declarations that can be used with the StyleSheet API
 *
 * @param code - The CSS file contents
 * @param options - Compiler options
 * @returns A `ReactNativeCssStyleSheet` that can be passed to `StyleSheet.register` or used with a custom runtime
 */
export function compile(code: Buffer | string, options: CompilerOptions = {}) {
  const { logger = defaultLogger } = options;

  const isLoggerEnabled =
    "enabled" in logger ? logger.enabled : Boolean(logger);

  const features = Object.assign({}, options.features);

  // If a selector prefix is provided and starts with a dot, remove the dot
  if (options.selectorPrefix?.startsWith(".")) {
    options.selectorPrefix = options.selectorPrefix.slice(1);
  }

  logger(`Features ${JSON.stringify(features)}`);

  if (process.env.NODE_ENV !== "production") {
    if (defaultLogger.enabled) {
      defaultLogger(code.toString());
    }
  }
  // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
  const rem = options.inlineRem || 14;

  const stylesheet = new CompilerStyleSheet(options, rem);

  const { lightningcss, Features } = lightningcssLoader();

  logger(`Lightningcss first pass`);
  const firstPassResult = inlineVariablesWithSingleUsage(
    code,
    options,
    lightningcss,
    Features,
    logger,
    rem,
  );

  logger(`Lightningcss second pass`);
  const visitor: Visitor<CustomAtRules> = {
    Rule(rule) {
      maybeMutateReactNativeOptions(rule);
      return rule;
    },
    StyleSheetExit(sheet) {
      if (isLoggerEnabled) {
        logger(`Found ${sheet.rules.length} rules to process`);
        logger(
          inspect(sheet.rules, { depth: null, colors: true, compact: false }),
        );
      }

      for (const rule of sheet.rules) {
        // Extract the style declarations and animations from the current rule
        extractRule(rule, stylesheet);
        // We have processed this rule, so now delete it from the AST
      }

      logger(`Exiting lightningcss`);
      return sheet;
    },
  };

  lightningcss({
    code: firstPassResult,
    visitor,
    filename: options.filename ?? "style.css",
    projectRoot: options.projectRoot ?? process.cwd(),
  });

  return {
    stylesheet: () => stylesheet.getHybridStyleSheet(),
    warnings: () => stylesheet.getWarnings(),
  };
}

/**
 * Extracts style declarations and animations from a given CSS rule, based on its type.
 */
function extractRule(rule: Rule, stylesheet: CompilerStyleSheet) {
  // Check the rule's type to determine which extraction function to call
  switch (rule.type) {
    case "keyframes": {
      stylesheet.addKeyframes(rule.value);
      break;
    }
    case "container": {
      if (stylesheet.pushContainerQuery(rule.value)) {
        for (const subRule of rule.value.rules) {
          extractRule(subRule, stylesheet);
        }
        stylesheet.popContainerQuery();
      }
      break;
    }
    case "media": {
      if (stylesheet.pushMediaQuery(rule.value)) {
        for (const subRule of rule.value.rules) {
          extractRule(subRule, stylesheet);
        }
        stylesheet.popMediaQuery();
      }
      break;
    }
    case "nested-declarations": {
      const { declarations } = rule.value;
      stylesheet.addDeclarations(declarations.declarations);
      stylesheet.addDeclarations(declarations.importantDeclarations);
      break;
    }
    case "style": {
      const { declarations, selectors, rules = [] } = rule.value;

      stylesheet.pushMapping(parsePropAtRule(rules));

      if (stylesheet.pushSelectors(selectors)) {
        stylesheet.addDeclarations(declarations?.declarations);
        stylesheet.addDeclarations(declarations?.importantDeclarations);

        for (const nestedRule of rules) {
          extractRule(nestedRule, stylesheet);
        }

        stylesheet.popSelectors();
      }

      stylesheet.popMapping();

      break;
    }
    case "layer-block":
      for (const layerRule of rule.value.rules) {
        extractRule(layerRule, stylesheet);
      }
      break;
    case "supports":
      if (supportsConditionValid(rule.value.condition)) {
        for (const layerRule of rule.value.rules) {
          extractRule(layerRule, stylesheet);
        }
      }
      break;
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
      break;
  }
}
