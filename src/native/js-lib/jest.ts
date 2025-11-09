import { inspect } from "util";

import { compile, type CompilerOptions } from "../../compiler";
import { StyleRegistry } from "../js-lib/StyleRegistry";

export const testID = "REACT_NATIVE_CSS_NITRO_TEST_ID";

export { specificity } from "../specificity";

export { StyleRegistry };

const debugDefault =
  typeof process.env.NODE_OPTIONS === "string" &&
  process.env.NODE_OPTIONS.includes("--inspect");

beforeEach(() => {
  StyleRegistry.dispose();
});

type RegisterCSSOptions = CompilerOptions & {
  debug?: boolean;
};

export function registerCSS(
  css: string,
  { debug = debugDefault, ...options }: RegisterCSSOptions = {},
) {
  const result = compile(css, {
    inlineVariables: false,
    ...options,
  });

  const stylesheet = result.stylesheet();

  if (debug) {
    console.log(
      inspect(stylesheet, { depth: null, colors: true, compact: false }),
    );
  }

  StyleRegistry.addStyleSheet(stylesheet);
}
