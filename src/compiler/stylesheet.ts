import type {
  ContainerRule,
  Declaration,
  KeyframesRule,
  MediaRule,
  SelectorList,
} from "lightningcss";

import { Specificity } from "../native-cpp/specificity";
import type {
  HybridAnimation,
  HybridContainerQuery,
  HybridMediaQuery,
  HybridStyleRule,
  StyleSheet as HybridStyleSheet,
  SpecificityArray,
} from "../specs/StyleRegistry";
import type { CompilerOptions } from "./compiler.types";
import { getContainerQuery } from "./container-query";
import { DeclarationBuilder, parseDeclaration } from "./declarations";
import { mapMediaQueries } from "./media-query";
import { SelectorParser, type NormalizedSelector } from "./selectors";

function createSpecificity(): SpecificityArray {
  return [0, 0, 0, 0, 0];
}

const DEFAULT_MAPPING = {
  "background-image": "experimental_backgroundImage",
};

export class CompilerStyleSheet {
  private readonly selectorStack: NormalizedSelector[][] = [];
  private readonly mediaStack: HybridMediaQuery[][] = [];
  private readonly containerStack: HybridContainerQuery[] = [];
  private readonly mappingStack: Record<string, string>[] = [DEFAULT_MAPPING];
  private currentMapping: Record<string, string> = DEFAULT_MAPPING;

  private readonly selectorParser: SelectorParser;
  private readonly ruleSets = new Map<string, HybridStyleRule[]>();
  private keyframes: HybridAnimation = {};

  constructor(public options: CompilerOptions) {
    this.selectorParser = new SelectorParser(options);
  }

  pushSelectors(selectors: SelectorList): boolean {
    this.selectorStack.push(this.selectorParser.parse(selectors));
    return true;
  }

  popSelectors() {
    if (!this.selectorStack.length) {
      throw new Error("No selector context to pop");
    }

    this.selectorStack.pop();
  }

  pushMediaQuery(mediaRule: MediaRule): boolean {
    const mediaQueries = mapMediaQueries(mediaRule.query.mediaQueries);
    if (mediaQueries.length === 0) {
      return false;
    }

    this.mediaStack.push(mediaQueries);
    return true;
  }

  popMediaQuery() {
    if (!this.mediaStack.length) {
      throw new Error("No media query context to pop");
    }

    this.mediaStack.pop();
  }

  pushContainerQuery(containerRule: ContainerRule): boolean {
    const containerQuery = getContainerQuery(containerRule);
    if (!containerQuery) {
      return false;
    }

    this.containerStack.push(containerQuery);
    return true;
  }

  popContainerQuery() {
    this.containerStack.pop();
  }

  pushMapping(mapping: Record<string, string>) {
    this.mappingStack.push(mapping);
    this.currentMapping = Object.assign({}, ...this.mappingStack);
  }

  popMapping() {
    this.mappingStack.pop();
    this.currentMapping = Object.assign({}, ...this.mappingStack);
  }

  addDeclarations(declarations?: Declaration[]) {
    if (!declarations || declarations.length === 0) {
      return;
    }

    const rule = new DeclarationBuilder(this.options, this.currentMapping);
    for (const declaration of declarations) {
      parseDeclaration(declaration, rule);
    }

    this.addRuleForSelectors(rule);
  }

  addImportantDeclarations(declarations?: Declaration[]) {
    if (!declarations || declarations.length === 0) {
      return;
    }
    const rule = new DeclarationBuilder(this.options, this.currentMapping);
    for (const declaration of declarations) {
      parseDeclaration(declaration, rule);
    }

    this.addRuleForSelectors(rule, { important: true });
  }

  addKeyframes(keyframes: KeyframesRule) {
    const animation: HybridAnimation = {};
    this.keyframes[keyframes.name.value] = animation;

    for (const frame of keyframes.keyframes) {
      if (!frame.declarations.declarations) continue;

      const selectors = frame.selectors.map((selector) => {
        switch (selector.type) {
          case "percentage":
            return frame.selectors.length > 1
              ? `${selector.value * 100}%`
              : selector.value;
          case "from":
          case "to":
            return selector.type;
          case "timeline-range-percentage":
            // TODO
            return frame.selectors.length > 1
              ? `${selector.value.percentage}%`
              : selector.value.percentage;
        }
      });

      const rule = new DeclarationBuilder(this.options, this.currentMapping);
      for (const declaration of frame.declarations.declarations) {
        parseDeclaration(declaration, rule);
      }

      // Ignore the other properties of the rule builder for keyframes
      const styles = rule.getStyle();
      if (styles) {
        animation[selectors.join(", ")] = styles;
      }
    }
  }

  private addRuleForSelectors(
    rules: DeclarationBuilder,
    options?: { important?: boolean },
  ) {
    if (this.selectorStack.length > 1) {
      throw new Error("Nested selectors are not supported at this time");
    }

    const selectors = this.selectorStack.at(0);
    if (!selectors?.length) {
      return;
    }

    for (const selector of selectors) {
      for (const partialRule of rules.getAllRules()) {
        const rule = this.createRule(partialRule, selector, options);
        this.appendRule(selector, rule);
      }
    }
  }

  getHybridStyleSheet(): HybridStyleSheet {
    if (!this.ruleSets.size) {
      return {};
    }

    return {
      s: Object.fromEntries(this.ruleSets.entries()),
    };
  }

  private appendRule(selector: NormalizedSelector, rule: HybridStyleRule) {
    if (selector.type === "className") {
      const list = this.ruleSets.get(selector.className);
      if (list) {
        list.push(rule);
      } else {
        this.ruleSets.set(selector.className, [rule]);
      }
    }
  }

  private createRule(
    partialRule: Partial<HybridStyleRule>,
    selector: NormalizedSelector,
    options?: { important?: boolean },
  ): HybridStyleRule {
    const rule: HybridStyleRule = {
      s: createSpecificity(),
      ...partialRule,
    };

    if (rule.d) {
      for (const [oldKey, newKey] of Object.entries(this.currentMapping)) {
        if (oldKey in rule.d) {
          const old = rule.d[oldKey];
          if (!old) continue;
          rule.d[newKey] = old;
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete rule.d[oldKey];
        }
      }
    }

    if (selector.type === "className") {
      if (selector.containerQuery) {
        rule.cq = [...(rule.cq ?? [])];
        rule.cq.push(...selector.containerQuery);
      }
    }

    if (this.mediaStack.length > 0) {
      const media = this.mediaStack.flat();
      if (media.length === 1) {
        rule.mq = media[0];
      } else {
        rule.mq = { and: media };
      }
    }

    if (options?.important) {
      rule.s[Specificity.important] = 1;
    }

    return rule;
  }

  getWarnings(): string[] {
    // Placeholder for warning generation logic
    return [];
  }
}
