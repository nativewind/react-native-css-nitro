/* eslint-disable */
import type { Debugger } from "debug";
import type { TokenOrValue } from "lightningcss";

export interface CompilerOptions {
  filename?: string;
  projectRoot?: string;
  inlineRem?: number | false;
  inlineVariables?: false | InlineVariableOptions;
  selectorPrefix?: string;
  stylesheetOrder?: number;
  features?: FeatureFlagRecord;
  logger?: (message: string) => void | Debugger;
  hexColors?: boolean;
  colorPrecision?: number;
}

export type StyleRuleMapping = Record<string, string>;

export interface InlineVariableOptions {
  exclude?: `--${string}`[];
}

export type UniqueVarInfo = {
  count: number;
  value: TokenOrValue[] | undefined;
  flat?: true;
};

type FeatureFlags = never;
export type FeatureFlagRecord = Partial<Record<FeatureFlags, boolean>>;

/**
 * @internal
 */
export type LoggerOptions = {
  logger: (message: string) => void;
};

/**
 * @internal
 */
export interface CompilerCollection extends CompilerOptions {
  features: FeatureFlagRecord;
  rules: Map<string, any[]>;
  keyframes: Map<string, any[]>;
  darkMode?: string | null;
  rootVariables: any;
  universalVariables: any;
  selectorPrefix?: string;
  appearanceOrder: number;
  rem?: number | boolean;
  varUsageCount: Map<string, number>;
}
