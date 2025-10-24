import { type BoxShadowValue } from "react-native";

import Color from "colorjs.io";
import type {
  Angle,
  AnimationDirection,
  AnimationFillMode,
  AnimationIterationCount,
  AnimationName,
  AnimationPlayState,
  BorderSideWidth,
  BorderStyle,
  CalcFor_DimensionPercentageFor_LengthValue,
  CalcFor_Length,
  ColorOrAuto,
  CssColor,
  Declaration,
  DimensionPercentageFor_LengthValue,
  EasingFunction,
  EnvironmentVariable,
  FontSize,
  FontStyle,
  FontVariantCaps,
  FontWeight,
  GapValue,
  Gradient,
  GradientItemFor_DimensionPercentageFor_LengthValue,
  Length,
  LengthPercentageOrAuto,
  LengthValue,
  LineDirection,
  LineHeight,
  LineStyle,
  MaxSize,
  NumberOrPercentage,
  PropertyId,
  Scale,
  Size,
  Size2DFor_DimensionPercentageFor_LengthValue,
  Time,
  Token,
  TokenOrValue,
  UnresolvedColor,
} from "lightningcss";
import type { ValueType } from "react-native-nitro-modules";

import type { DeclarationBuilder } from "./declarations";
import { toRNProperty } from "./selectors-new";

export type Parser<
  T extends Declaration["property"] = Declaration["property"],
> = (
  declaration: Extract<Declaration, { property: T }>,
  b: DeclarationBuilder,
  // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
) => ValueType | void;

type DeclarationType<P extends Declaration["property"]> = Extract<
  Declaration,
  { property: P }
>;

export const parsers: {
  [K in Declaration["property"]]?: Parser<K>;
} = {
  "align-content": alignContent,
  "align-items": alignItems,
  "align-self": alignSelf,
  animation: animation,
  "animation-delay": animationDelay,
  "animation-direction": animationDirection,
  "animation-duration": animationDuration,
  "animation-fill-mode": animationFillMode,
  "animation-iteration-count": animationIterationCount,
  "animation-name": animationName,
  "animation-play-state": animationPlayState,
  "animation-timing-function": animationTimingFunction,
  "aspect-ratio": aspectRatio,
  "backface-visibility": backfaceVisibility,
  "background-color": colorDeclaration,
  "background-image": backgroundImage,
  "block-size": sizeDeclaration,
  border: border,
  "border-block": borderBlock,
  "border-block-color": borderColor,
  "border-block-end": borderBlockEnd,
  "border-block-end-color": colorDeclaration,
  "border-block-end-width": borderSideWidthDeclaration,
  "border-block-start": borderBlockStart,
  "border-block-start-color": colorDeclaration,
  "border-block-start-style": borderStyleDeclaration,
  "border-block-start-width": borderSideWidthDeclaration,
  "border-block-style": borderBlockStyle,
  "border-block-width": borderBlockWidth,
  "border-bottom": borderSide,
  "border-bottom-color": colorDeclaration,
  "border-bottom-left-radius": size2DDimensionPercentageDeclaration,
  "border-bottom-right-radius": size2DDimensionPercentageDeclaration,
  "border-bottom-style": borderStyleDeclaration,
  "border-bottom-width": borderSideWidthDeclaration,
  "border-color": borderColor,
  "border-end-end-radius": size2DDimensionPercentageDeclaration,
  "border-end-start-radius": size2DDimensionPercentageDeclaration,
  "border-inline": borderInline,
  "border-inline-color": borderColor,
  "border-inline-end": borderInlineEnd,
  "border-inline-end-color": colorDeclaration,
  "border-inline-end-style": borderInlineStyle,
  "border-inline-end-width": borderSideWidthDeclaration,
  "border-inline-start": borderInlineStart,
  "border-inline-start-color": colorDeclaration,
  "border-inline-start-style": borderInlineStyle,
  "border-inline-start-width": borderSideWidthDeclaration,
  "border-inline-style": borderInlineStyle,
  "border-inline-width": borderInlineWidth,
  "border-left": borderSide,
  "border-left-color": colorDeclaration,
  "border-left-style": borderStyleDeclaration,
  "border-left-width": borderSideWidthDeclaration,
  "border-radius": borderRadius,
  "border-right": borderSide,
  "border-right-color": colorDeclaration,
  "border-right-style": borderStyleDeclaration,
  "border-right-width": borderSideWidthDeclaration,
  "border-start-end-radius": size2DDimensionPercentageDeclaration,
  "border-start-start-radius": size2DDimensionPercentageDeclaration,
  "border-style": borderStyleDeclaration,
  "border-top": borderSide,
  "border-top-color": colorDeclaration,
  "border-top-left-radius": size2DDimensionPercentageDeclaration,
  "border-top-right-radius": size2DDimensionPercentageDeclaration,
  "border-top-style": borderStyleDeclaration,
  "border-top-width": borderSideWidthDeclaration,
  "border-width": borderWidth,
  bottom: sizeWithAutoDeclaration,
  "box-shadow": boxShadow,
  "box-sizing": boxSizing,
  "caret-color": colorOrAutoDeclaration,
  color: fontColorDeclaration,
  "column-gap": gap,
  container: container,
  "container-name": containerName,
  "container-type": containerType,
  display: display,
  direction: direction,
  fill: svgPaint,
  filter: filter,
  flex: flex,
  "flex-basis": lengthPercentageDeclaration,
  "flex-direction": ({ value }) => value,
  "flex-flow": flexFlow,
  "flex-grow": ({ value }) => value,
  "flex-shrink": ({ value }) => value,
  "flex-wrap": ({ value }) => value,
  font: font,
  "font-family": fontFamily,
  "font-size": fontSizeDeclaration,
  "font-style": fontStyleDeclaration,
  "font-variant-caps": fontVariantCapsDeclaration,
  "font-weight": fontWeightDeclaration,
  gap: gap,
  height: sizeWithAutoDeclaration,
  "inline-size": sizeWithAutoDeclaration,
  inset: inset,
  "inset-block": insetBlock,
  "inset-block-end": lengthPercentageDeclaration,
  "inset-block-start": lengthPercentageDeclaration,
  "inset-inline": insetInline,
  "inset-inline-end": lengthPercentageDeclaration,
  "inset-inline-start": lengthPercentageDeclaration,
  "justify-content": justifyContent,
  left: sizeWithAutoDeclaration,
  "letter-spacing": letterSpacing,
  "line-height": lineHeightDeclaration,
  margin: margin,
  "margin-block": marginBlock,
  "margin-block-end": lengthPercentageOrAutoDeclaration,
  "margin-block-start": lengthPercentageOrAutoDeclaration,
  "margin-bottom": sizeWithAutoDeclaration,
  "margin-inline": marginInline,
  "margin-inline-end": lengthPercentageOrAutoDeclaration,
  "margin-inline-start": lengthPercentageOrAutoDeclaration,
  "margin-left": sizeWithAutoDeclaration,
  "margin-right": sizeWithAutoDeclaration,
  "margin-top": sizeWithAutoDeclaration,
  "max-block-size": sizeDeclaration,
  "max-height": sizeDeclaration,
  "max-inline-size": sizeDeclaration,
  "max-width": sizeDeclaration,
  "min-block-size": sizeDeclaration,
  "min-height": sizeDeclaration,
  "min-inline-size": sizeDeclaration,
  "min-width": sizeDeclaration,
  opacity: ({ value }) => round(value),
  "outline-color": colorDeclaration,
  "outline-style": outlineStyle,
  "outline-width": borderSideWidthDeclaration,
  overflow: overflow,
  padding: padding,
  "padding-block": paddingBlock,
  "padding-block-end": lengthPercentageDeclaration,
  "padding-block-start": lengthPercentageDeclaration,
  "padding-bottom": sizeDeclaration,
  "padding-inline": paddingInline,
  "padding-inline-end": lengthPercentageDeclaration,
  "padding-inline-start": lengthPercentageDeclaration,
  "padding-left": sizeDeclaration,
  "padding-right": sizeDeclaration,
  "padding-top": sizeDeclaration,
  position: position,
  right: sizeWithAutoDeclaration,
  rotate: rotate,
  "row-gap": gap,
  scale: scale,
  stroke: svgPaint,
  "stroke-width": lengthDeclaration,
  "text-align": textAlign,
  "text-decoration": textDecoration,
  "text-decoration-color": colorDeclaration,
  "text-decoration-line": textDecorationLineDeclaration,
  "text-decoration-style": textDecorationStyle,
  "text-shadow": textShadow,
  "text-transform": ({ value }) => value.case,
  top: sizeWithAutoDeclaration,
  transform: transform,
  transition: transition,
  "transition-delay": transitionDelay,
  "transition-duration": transitionDuration,
  "transition-property": transitionProperty,
  "transition-timing-function": transitionTimingFunction,
  translate: translate,
  "user-select": userSelect,
  "vertical-align": verticalAlign,
  visibility: visibility,
  width: sizeWithAutoDeclaration,
  "z-index": zIndex,
};

// This is missing LightningCSS types
(parsers as Record<string, Parser>)["pointer-events"] = pointerEvents as Parser;

/**
 * When the CSS cannot be parsed (often due to a runtime condition like a CSS variable)
 * This export function best efforts parsing it into a export function that we can evaluate at runtime
 */
export function unparsed(
  tokenOrValue: TokenOrValue[] | undefined | null,
  b: DeclarationBuilder,
  allowAuto?: boolean,
): ValueType[] | undefined;
export function unparsed(
  tokenOrValue: TokenOrValue | undefined | null,
  b: DeclarationBuilder,
  allowAuto?: boolean,
): ValueType | undefined;
export function unparsed<
  T extends TokenOrValue | TokenOrValue[] | string | number,
>(
  tokenOrValue: T | undefined | null,
  b: DeclarationBuilder,
  allowAuto = false,
): ValueType | undefined {
  if (tokenOrValue === undefined || tokenOrValue === null) {
    return;
  }

  if (typeof tokenOrValue === "string") {
    if (tokenOrValue === "true") {
      return true;
    } else if (tokenOrValue === "false") {
      return false;
    } else if (tokenOrValue === "currentcolor") {
      return [{}, "var", "__rn-css-color"] as const;
    } else {
      return tokenOrValue;
    }
  }

  if (typeof tokenOrValue === "number") {
    return round(tokenOrValue);
  }

  if (Array.isArray(tokenOrValue)) {
    return tokenOrValue
      .map((item) => unparsed(item, b, allowAuto))
      .filter((item) => item !== undefined) as ValueType;
  }

  switch (tokenOrValue.type) {
    case "unresolved-color": {
      return unresolvedColor(tokenOrValue.value, b);
    }
    case "var": {
      const name = tokenOrValue.value.name.ident.slice(2);
      const fallback = unparsed(tokenOrValue.value.fallback, b, allowAuto);
      if (fallback) {
        return ["fn", "var", name, fallback];
      } else {
        return ["fn", "var", name];
      }
    }
    case "function": {
      switch (tokenOrValue.value.name) {
        case "blur":
        case "brightness":
        case "contrast":
        case "cubic-bezier":
        case "drop-shadow":
        case "fontScale":
        case "getPixelSizeForLayoutSize":
        case "grayscale":
        case "hsl":
        case "hsla":
        case "hue-rotate":
        case "invert":
        case "opacity":
        case "pixelScale":
        case "platformColor":
        case "rgb":
        case "rgba":
        case "rotate":
        case "rotateX":
        case "rotateY":
        case "roundToNearestPixel":
        case "saturate":
        case "scale":
        case "scaleX":
        case "calc":
        case "max":
        case "min":
        case "clamp":
        case "scaleY":
        case "sepia": {
          const args = parseTokens(tokenOrValue.value.arguments, b, allowAuto);
          if (args === undefined) {
            return;
          }

          if (Array.isArray(args)) {
            return ["fn", toRNProperty(tokenOrValue.value.name), ...args];
          } else {
            return ["fn", toRNProperty(tokenOrValue.value.name), args];
          }
        }
        case "linear-gradient":
        case "radial-gradient":
          // These are special as React Native requires the '-' in their name
          return [
            "fn",
            tokenOrValue.value.name,
            ...(unparsed(tokenOrValue.value.arguments, b, allowAuto) ?? []),
          ];
        case "hairlineWidth":
          return ["fn", "hairlineWidth"];
        case "color-mix":
          return colorMix(tokenOrValue.value.arguments, b);
        default: {
          //b.addWarning("value", `${tokenOrValue.value.name}()`);
          return;
        }
      }
    }
    case "length":
      return length(tokenOrValue.value, b);
    case "angle":
      return angle(tokenOrValue.value, b);
    case "token":
      switch (tokenOrValue.value.type) {
        case "string":
        case "ident": {
          const value = tokenOrValue.value.value;
          if (!allowAuto && value === "auto") {
            //b.addWarning("value", value);
            return;
          }

          if (value === "inherit" || value === "initial") {
            //b.addWarning("value", value);
            return;
          } else if (value === "currentcolor") {
            return [{}, "var", "__rn-css-color"] as const;
          }

          if (value === "true") {
            return true;
          } else if (value === "false") {
            return false;
          } else if (value === "infinity") {
            return Number.MAX_SAFE_INTEGER;
          } else {
            return value;
          }
        }
        case "number": {
          return round(tokenOrValue.value.value);
        }
        case "function":
          //b.addWarning("value", tokenOrValue.value.value);
          return;
        case "percentage":
          return `${round(tokenOrValue.value.value * 100)}%`;
        case "dimension":
          return length(tokenOrValue.value, b);
        case "comma":
          return CommaSeparator as any;
        case "delim": {
          if (tokenOrValue.value.value === "/") {
            return tokenOrValue.value.value;
          }
          return;
        }
        case "at-keyword":
        case "hash":
        case "id-hash":
        case "unquoted-url":
        case "white-space":
        case "comment":
        case "colon":
        case "semicolon":
        case "include-match":
        case "dash-match":
        case "prefix-match":
        case "suffix-match":
        case "substring-match":
        case "cdo":
        case "cdc":
        case "parenthesis-block":
        case "square-bracket-block":
        case "curly-bracket-block":
        case "bad-url":
        case "bad-string":
        case "close-parenthesis":
        case "close-square-bracket":
        case "close-curly-bracket":
          return;
        default: {
          tokenOrValue.value satisfies never;
          return;
        }
      }
    case "color":
      return color(tokenOrValue.value, b);
    case "env":
      return env(tokenOrValue.value, b);
    case "time":
      return time(tokenOrValue.value);
    case "url":
    case "resolution":
    case "dashed-ident":
    case "animation-name":
      return;
    default: {
      tokenOrValue satisfies never;
    }
  }

  return;
}

export function customDeclaration(
  declaration: Extract<Declaration, { property: "custom" }>,
  b: DeclarationBuilder,
) {
  const property = declaration.value.name;

  if (property === "-webkit-line-clamp") {
    b.set(property, unparsed(declaration.value.value, b));
  } else if (property === "-rn-ripple-style") {
    b.set(property, rippleStyle(declaration.value.value, b));
  } else if (property === "-rn-ripple-layer") {
    b.set(property, rippleLayer(declaration.value.value, b));
  } else if (property === "object-fit") {
    // https://github.com/parcel-bundler/lightningcss/issues/1046
    b.set(property, objectFit(declaration.value.value, b));
  } else if (property === "object-position") {
    // https://github.com/parcel-bundler/lightningcss/issues/1047
    b.set(property, objectPosition(declaration.value.value, b));
  } else if (property === "outline-offset") {
    // https://github.com/parcel-bundler/lightningcss/issues/1048
    b.set(property, outlineOffset(declaration.value.value, b));
  } else if (property === "corner-shape") {
    b.set("borderCurve", cornerShape(declaration.value.value, b));
  } else if (property in parsers || property.startsWith("-rn-")) {
    b.set(property, unparsed(declaration.value.value, b));
  } else if (property.startsWith("--")) {
    b.setVariable(property, unparsed(declaration.value.value, b));
  } else {
    // builder.addWarning("property", declaration.value.name);
  }
}

/*********************************** Parsers **********************************/

function alignContent(
  declaration: DeclarationType<"align-content">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set([
    "flex-start",
    "flex-end",
    "center",
    "stretch",
    "space-between",
    "space-around",
    "space-evenly",
  ]);

  let value: string | undefined;

  switch (declaration.value.type) {
    case "normal":
    case "baseline-position":
      value = declaration.value.type;
      break;
    case "content-distribution":
    case "content-position":
      value = declaration.value.value;
      break;
    default: {
      declaration.value satisfies never;
    }
  }

  if (value && !allowed.has(value)) {
    //b.addWarning("value", value);
    return;
  }

  return value;
}

function alignItems(
  alignItems: DeclarationType<"align-items">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set([
    "auto",
    "flex-start",
    "flex-end",
    "center",
    "stretch",
    "baseline",
  ]);

  let value: string | undefined;

  switch (alignItems.value.type) {
    case "normal":
      value = "auto";
      break;
    case "stretch":
      value = alignItems.value.type;
      break;
    case "baseline-position":
      value = "baseline";
      break;
    case "self-position":
      value = alignItems.value.value;
      break;
    default: {
      alignItems.value satisfies never;
    }
  }

  if (value && !allowed.has(value)) {
    //b.addWarning("value", value);
    return;
  }

  return value;
}

function alignSelf(
  alignSelf: DeclarationType<"align-self">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set([
    "auto",
    "flex-start",
    "flex-end",
    "center",
    "stretch",
    "baseline",
  ]);

  let value: string | undefined;

  switch (alignSelf.value.type) {
    case "normal":
    case "auto":
      value = "auto";
      break;
    case "stretch":
      value = alignSelf.value.type;
      break;
    case "baseline-position":
      value = "baseline";
      break;
    case "self-position":
      value = alignSelf.value.value;
      break;
    default: {
      alignSelf.value satisfies never;
    }
  }

  if (value && !allowed.has(value)) {
    //b.addWarning("value", value);
    return;
  }

  return value;
}

function angle(angle: Angle | number, _b: DeclarationBuilder) {
  if (typeof angle === "number") {
    return `${angle}deg`;
  }

  switch (angle.type) {
    case "deg":
    case "rad":
      return `${angle.value}${angle.type}`;
    default:
      //b.addWarning("value", `${angle.value} ${angle.type}`);
      return undefined;
  }
}

function animation(
  { value }: DeclarationType<"animation">,
  b: DeclarationBuilder,
) {
  const grouped: Record<string, unknown[]> = {};

  for (const animation of value) {
    for (const [key, value] of Object.entries(animation)) {
      grouped[key] ??= [];
      grouped[key].push(value);
    }
  }

  for (const [key, value] of Object.entries(grouped)) {
    switch (key) {
      case "delay": {
        b.set(
          toRNProperty(key),
          animationDelay(
            {
              property: "animation-delay",
              value: value as Time[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "direction": {
        b.set(
          toRNProperty(key),
          animationDirection(
            {
              property: "animation-direction",
              value: value as AnimationDirection[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "duration": {
        b.set(
          toRNProperty(key),
          animationDuration(
            {
              property: "animation-duration",
              value: value as Time[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "fill-mode": {
        b.set(
          toRNProperty(key),
          animationFillMode(
            {
              property: "animation-fill-mode",
              value: value as AnimationFillMode[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "iteration-count": {
        b.set(
          toRNProperty(key),
          animationIterationCount(
            {
              property: "animation-iteration-count",
              value: value as AnimationIterationCount[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "name": {
        b.set(
          toRNProperty(key),
          animationName(
            {
              property: "animation-name",
              value: value as AnimationName[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "play-state": {
        b.set(
          toRNProperty(key),
          animationPlayState(
            {
              property: "animation-play-state",
              value: value as AnimationPlayState[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
      case "timing-function": {
        b.set(
          toRNProperty(key),
          animationTimingFunction(
            {
              property: "animation-timing-function",
              value: value as EasingFunction[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      }
    }
  }
}

function animationDelay(
  { value }: DeclarationType<"animation-delay">,
  _b: DeclarationBuilder,
) {
  return value.map((timeValue) => time(timeValue));
}

function animationDirection(
  { value }: DeclarationType<"animation-direction">,
  _b: DeclarationBuilder,
) {
  return value;
}

function animationDuration(
  { value }: DeclarationType<"animation-duration">,
  _b: DeclarationBuilder,
) {
  return value.map((timeValue) => time(timeValue));
}

function animationFillMode(
  { value }: DeclarationType<"animation-fill-mode">,
  _b: DeclarationBuilder,
) {
  return value;
}

function animationIterationCount(
  { value }: DeclarationType<"animation-iteration-count">,
  _b: DeclarationBuilder,
) {
  return value.map((value) => {
    return value.type === "infinite" ? value.type : value.value;
  });
}

function animationName(
  { value }: DeclarationType<"animation-name">,
  _b: DeclarationBuilder,
) {
  return value.map((v) => (v.type === "none" ? "none" : v.value));
}

function animationPlayState(
  { value }: DeclarationType<"animation-play-state">,
  _b: DeclarationBuilder,
) {
  return value;
}

function animationTimingFunction(
  { value }: DeclarationType<"animation-timing-function">,
  _b: DeclarationBuilder,
) {
  return value.map((easing) => {
    switch (easing.type) {
      case "linear":
      case "ease":
      case "ease-in":
      case "ease-out":
      case "ease-in-out":
        return easing.type;
      case "cubic-bezier":
        return [
          "fn",
          "cubicBezier",
          easing.x1,
          easing.y1,
          easing.x2,
          easing.y2,
        ];
      case "steps":
        return easing.position
          ? ["fn", "steps", easing.count, easing.position.type]
          : ["fn", "steps", easing.count];
    }
  });
}

function aspectRatio({ value }: DeclarationType<"aspect-ratio">) {
  if (!value.ratio) {
    return;
  } else if (value.auto) {
    return "auto";
  } else {
    const [width, height] = value.ratio;
    if (width === height) {
      return 1;
    } else {
      return `${width}/${height}`;
    }
  }
}

function backfaceVisibility(
  { value }: DeclarationType<"backface-visibility">,
  _b: DeclarationBuilder,
) {
  if (["visible", "hidden"].includes(value)) {
    return value;
  } else {
    //b.addWarning("value", value);
    return;
  }
}

function backgroundImage(
  declaration: DeclarationType<"background-image">,
  b: DeclarationBuilder,
) {
  const values = declaration.value.flatMap((image): ValueType[] => {
    switch (image.type) {
      case "gradient": {
        const gradientValue = gradient(image.value, b);
        return gradientValue ? [gradientValue] : [];
      }
      case "none":
        return ["none"];
    }

    return [];
  });

  if (values.length === 0) {
    return;
  }

  return values;
}

function border({ value }: DeclarationType<"border">, b: DeclarationBuilder) {
  b.set("border-width", borderSideWidth(value.width, b));
  b.set("border-style", borderStyle(value.style, b));
  b.set("border-color", color(value.color, b));
}

function borderBlock(
  { value }: DeclarationType<"border-block">,
  b: DeclarationBuilder,
) {
  b.set("border-block-color", color(value.color, b));
  b.set("border-block-width", borderSideWidth(value.width, b));
  b.set("border-block-style", borderStyle(value.style, b));
}

function borderBlockEnd(
  { value }: DeclarationType<"border-block-end">,
  b: DeclarationBuilder,
) {
  b.set("border-block-end-color", color(value.color, b));
  b.set("border-block-end-width", borderSideWidth(value.width, b));
}

function borderBlockStart(
  { value }: DeclarationType<"border-block-start">,
  b: DeclarationBuilder,
) {
  b.set("border-block-start-color", color(value.color, b));
  b.set("border-block-start-width", borderSideWidth(value.width, b));
}

function borderBlockStyle(
  declaration: DeclarationType<"border-block-style">,
  b: DeclarationBuilder,
) {
  const start = borderStyle(declaration.value.start, b);
  const end = borderStyle(declaration.value.end, b);

  if (start == end) {
    b.set("border-block-style", start);
  } else {
    b.set("border-block-start-style", start);
    b.set("border-block-end-style", end);
  }
}

function borderBlockWidth(
  declaration: DeclarationType<"border-block-width">,
  b: DeclarationBuilder,
) {
  const start = borderSideWidth(declaration.value.start, b);
  const end = borderSideWidth(declaration.value.end, b);

  if (start === end) {
    b.set("border-block-width", start);
  } else {
    b.set("border-block-start-width", start);
    b.set("border-block-end-width", end);
  }
}

function borderColor(
  declaration: DeclarationType<
    "border-color" | "border-block-color" | "border-inline-color"
  >,
  b: DeclarationBuilder,
) {
  if (declaration.property === "border-color") {
    b.setShorthand("border-color", {
      "border-top-color": color(declaration.value.top, b),
      "border-bottom-color": color(declaration.value.bottom, b),
      "border-left-color": color(declaration.value.left, b),
      "border-right-color": color(declaration.value.right, b),
    });
  } else {
    const start = color(declaration.value.start, b);
    const end = color(declaration.value.end, b);

    if (start === end) {
      b.set(declaration.property, start);
    } else if (declaration.property === "border-block-color") {
      b.set("border-top-color", start);
      b.set("border-bottom-color", end);
    } else {
      b.set("border-left-color", start);
      b.set("border-right-color", end);
    }
  }
}

function borderInline(
  { value }: DeclarationType<"border-inline">,
  b: DeclarationBuilder,
) {
  b.set("border-inline-color", color(value.color, b));
  b.set("border-inline-width", borderSideWidth(value.width, b));
  b.set("border-inline-style", borderStyle(value.style, b));
}

function borderInlineEnd(
  { value }: DeclarationType<"border-inline-end">,
  b: DeclarationBuilder,
) {
  b.set("border-inline-end-color", color(value.color, b));
  b.set("border-inline-end-width", borderSideWidth(value.width, b));
  b.set("border-inline-end-style", borderStyle(value.style, b));
}

function borderInlineStart(
  { value }: DeclarationType<"border-inline-start">,
  b: DeclarationBuilder,
) {
  b.set("border-inline-start-color", color(value.color, b));
  b.set("border-inline-start-width", borderSideWidth(value.width, b));
  b.set("border-inline-start-style", borderStyle(value.style, b));
}

function borderInlineStyle(
  declaration: DeclarationType<
    | "border-inline-style"
    | "border-inline-start-style"
    | "border-inline-end-style"
  >,
  b: DeclarationBuilder,
) {
  if (typeof declaration.value === "string") {
    b.set(declaration.property, borderStyle(declaration.value, b));
  } else if (declaration.value.start === declaration.value.end) {
    b.set(declaration.property, borderStyle(declaration.value.start, b));
  } else {
    b.set("border-inline-start-style", borderStyle(declaration.value.start, b));
    b.set("border-inline-end-style", borderStyle(declaration.value.end, b));
  }
}

function borderInlineWidth(
  declaration: DeclarationType<"border-inline-width">,
  b: DeclarationBuilder,
) {
  const start = borderSideWidth(declaration.value.start, b);
  const end = borderSideWidth(declaration.value.end, b);

  if (start === end) {
    b.set("border-inline-width", start);
  } else {
    b.set("border-inline-start-width", start);
    b.set("border-inline-end-width", end);
  }
}

function borderRadius(
  { value }: DeclarationType<"border-radius">,
  b: DeclarationBuilder,
) {
  b.setShorthand("border-radius", {
    "border-bottom-left-radius": length(value.bottomLeft[0], b),
    "border-bottom-right-radius": length(value.bottomRight[0], b),
    "border-top-left-radius": length(value.topLeft[0], b),
    "border-top-right-radius": length(value.topRight[0], b),
  });
}

function borderSide(
  {
    value,
    property,
  }: DeclarationType<
    "border-top" | "border-bottom" | "border-left" | "border-right"
  >,
  b: DeclarationBuilder,
) {
  b.set(property + "-color", color(value.color, b));
  b.set(property + "-width", borderSideWidth(value.width, b));
}

function borderSideWidth(value: BorderSideWidth, b: DeclarationBuilder) {
  if (value.type === "length") {
    return length(value.value, b);
  }

  //b.addWarning("value", value.type);
  return;
}

function borderSideWidthDeclaration(
  declaration: Extract<Declaration, { value: BorderSideWidth }>,
  b: DeclarationBuilder,
) {
  return borderSideWidth(declaration.value, b);
}

function borderStyle(value: BorderStyle | LineStyle, _b: DeclarationBuilder) {
  const allowed = new Set(["solid", "dotted", "dashed"]);

  if (typeof value === "string") {
    if (allowed.has(value)) {
      return value;
    } else {
      //b.addWarning("value", value);
      return;
    }
  } else if (
    value.top === value.bottom &&
    value.top === value.left &&
    value.top === value.right &&
    allowed.has(value.top)
  ) {
    return value.top;
  }

  //b.addWarning("value", value.top);

  return;
}

function borderStyleDeclaration(
  declaration: Extract<
    DeclarationType<Declaration["property"]>,
    { value: LineStyle | BorderStyle }
  >,
  b: DeclarationBuilder,
) {
  return borderStyle(declaration.value, b);
}

function borderWidth(
  { value }: DeclarationType<"border-width">,
  b: DeclarationBuilder,
) {
  b.setShorthand("border-width", {
    "border-top-width": borderSideWidth(value.top, b),
    "border-bottom-width": borderSideWidth(value.bottom, b),
    "border-left-width": borderSideWidth(value.left, b),
    "border-right-width": borderSideWidth(value.right, b),
  });
}

function boxShadow(
  { value }: DeclarationType<"box-shadow">,
  b: DeclarationBuilder,
) {
  return value.map((shadow): ValueType[] => {
    const shadowColor = color(shadow.color, b);
    const blurRadius = length(shadow.blur, b) ?? 0;
    const spreadDistance = length(shadow.spread, b) ?? 0;
    const offsetX = length(shadow.xOffset, b) ?? 0;
    const offsetY = length(shadow.yOffset, b) ?? 0;

    if (!shadowColor) {
      return [];
    }

    const boxShadow: Partial<Record<keyof BoxShadowValue, ValueType>> = {
      color: shadowColor,
      blurRadius,
      spreadDistance,
      offsetX,
      offsetY,
    };

    if (shadow.inset) {
      boxShadow.inset = true;
    }

    return [boxShadow];
  });
}

function boxSizing(
  declaration: DeclarationType<"box-sizing">,
  _b: DeclarationBuilder,
) {
  if (["border-box", "content-box"].includes(declaration.value)) {
    return declaration.value;
  }

  //b.addWarning("value", declaration.value);
  return undefined;
}

export function calcArguments(
  args: CalcFor_Length | CalcFor_DimensionPercentageFor_LengthValue,
  b?: DeclarationBuilder,
): ValueType | undefined {
  switch (args.type) {
    case "number":
      return round(args.value);
    case "value":
      return length(args.value, b);
    case "sum": {
      const left = calcArguments(args.value[0], b);
      const right = calcArguments(args.value[1], b);
      if (left === undefined || right === undefined) {
        return;
      }
      return ["fn", "sum", left, right];
    }
    case "product": {
      const left =
        typeof args.value[0] === "number"
          ? args.value[0]
          : calcArguments(args.value[0], b);
      const right = calcArguments(args.value[1], b);
      if (left === undefined || right === undefined) {
        return;
      }
      return ["fn", "product", left, right];
    }
    case "function": {
      switch (args.value.type) {
        case "sign":
        case "abs":
        case "calc": {
          const value = calcArguments(args.value.value, b);
          if (value === undefined) {
            return;
          }
          return ["fn", args.value.type, value];
        }
        case "clamp":
        case "hypot":
        case "max":
        case "min":
        case "mod":
        case "rem": {
          const values = args.value.value.map((v) => calcArguments(v, b));
          if (values.some((v) => v === undefined)) {
            return;
          }
          return ["fn", args.value.type, ...(values as ValueType[])];
        }
        case "round": {
          const [roundingValue, ...calcArgs] = args.value.value;
          const values = calcArgs.map((v) => calcArguments(v, b));
          if (values.some((v) => v === undefined)) {
            return;
          }
          return [
            "fn",
            args.value.type,
            roundingValue,
            ...(values as ValueType[]),
          ];
        }
      }
    }
  }
}

function color(
  cssColor: CssColor,
  b: DeclarationBuilder,
): ValueType | undefined {
  if (typeof cssColor === "string") {
    if (namedColors.has(cssColor)) {
      return cssColor;
    }
    return;
  }

  let color: Color | undefined;

  const { hexColors = true, colorPrecision } = b.getOptions();

  switch (cssColor.type) {
    case "currentcolor":
      return [{}, "var", "__rn-css-color"] as const;
    case "light-dark": {
      // const extraRule: StyleRule = {
      //   s: [],
      //   m: [["=", "prefers-color-scheme", "dark"]],
      // };
      //b.addUnnamedDescriptor(
      //   parseColor(cssColor.dark,b),
      //   false,
      //   extraRule,
      // );
      //b.addExtraRule(extraRule);
      // return parseColor(cssColor.light,b);
      return;
    }
    case "rgb": {
      color = new Color({
        space: "sRGB",
        coords: [cssColor.r / 255, cssColor.g / 255, cssColor.b / 255],
        alpha: cssColor.alpha,
      });
      break;
    }
    case "hsl":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.h, cssColor.s, cssColor.l],
        alpha: cssColor.alpha,
      });
      break;
    case "hwb":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.h, cssColor.w, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "lab":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.l, cssColor.a, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "lch":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.l, cssColor.c, cssColor.h],
        alpha: cssColor.alpha,
      });
      break;
    case "oklab":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.l, cssColor.a, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "oklch":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.l, cssColor.c, cssColor.h],
        alpha: cssColor.alpha,
      });
      break;
    case "srgb":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "srgb-linear":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "display-p3":
      color = new Color({
        space: "p3",
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "a98-rgb":
      color = new Color({
        space: "a98rgb",
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "prophoto-rgb":
      color = new Color({
        space: "prophoto",
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "rec2020":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.r, cssColor.g, cssColor.b],
        alpha: cssColor.alpha,
      });
      break;
    case "xyz-d50":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.x, cssColor.y, cssColor.z],
        alpha: cssColor.alpha,
      });
      break;
    case "xyz-d65":
      color = new Color({
        space: cssColor.type,
        coords: [cssColor.x, cssColor.y, cssColor.z],
        alpha: cssColor.alpha,
      });
      break;
    default: {
      cssColor satisfies never;
    }
  }

  if (!hexColors || colorPrecision) {
    return color?.toString({ precision: colorPrecision ?? 3 });
  } else {
    return color?.toString({ format: "hex" });
  }
}

function colorMix(tokens: TokenOrValue[], b: DeclarationBuilder) {
  const [inToken, whitespace, colorSpace, comma, ...rest] = tokens;
  if (
    typeof inToken !== "object" ||
    inToken.type !== "token" ||
    inToken.value.type !== "ident" ||
    inToken.value.value !== "in"
  ) {
    return;
  }

  if (
    typeof whitespace !== "object" ||
    whitespace.type !== "token" ||
    whitespace.value.type !== "white-space"
  ) {
    return;
  }

  if (
    typeof comma !== "object" ||
    comma.type !== "token" ||
    comma.value.type !== "comma"
  ) {
    return;
  }

  const colorSpaceArg = unparsed(colorSpace, b);
  if (typeof colorSpaceArg !== "string") {
    return;
  }

  let nextToken = rest.shift();

  const leftColorArg = unparsed(nextToken, b);

  if (!leftColorArg) {
    return;
  }

  nextToken = rest.shift();

  let leftColorPercentage: ValueType = "50%";
  if (nextToken?.type !== "token" || nextToken.value.type !== "comma") {
    leftColorPercentage = unparsed(nextToken, b) ?? "50%";
    nextToken = rest.shift();
  }

  if (
    typeof nextToken !== "object" ||
    nextToken.type !== "token" ||
    nextToken.value.type !== "comma"
  ) {
    return;
  }

  nextToken = rest.shift();

  const rightColorArg = unparsed(nextToken, b);

  if (!rightColorArg) {
    return;
  }

  if (rightColorArg === "transparent") {
    // Ignore the rest, treat as single color with alpha
    return ["fn", "colorMix", colorSpaceArg, leftColorArg, leftColorPercentage];
  }

  nextToken = rest.shift();
  let rightColorPercentage: ValueType = "50%";
  if (nextToken?.type !== "token" || nextToken.value.type !== "comma") {
    rightColorPercentage = unparsed(nextToken, b) ?? "50%";
    nextToken = rest.shift();
  }

  // We should have expired all tokens now
  if (nextToken) {
    return;
  }

  return [
    "fn",
    "colorMix",
    colorSpaceArg,
    leftColorArg,
    leftColorPercentage,
    rightColorArg,
    rightColorPercentage,
  ];
}

function colorOrAutoDeclaration(
  { value }: { value: ColorOrAuto },
  b: DeclarationBuilder,
) {
  if (value.type === "auto") {
    //b.addWarning("value", `Invalid color value ${value.type}`);
    return;
  } else {
    return color(value.value, b);
  }
}

function colorDeclaration(
  declaration: Extract<Declaration, { value: CssColor }>,
  b: DeclarationBuilder,
) {
  return color(declaration.value, b);
}

function container(
  { value }: DeclarationType<"container">,
  b: DeclarationBuilder,
) {
  b.addContainer(value.name.type === "none" ? false : value.name.value);
}

function containerName(
  { value }: DeclarationType<"container-name">,
  b: DeclarationBuilder,
) {
  b.addContainer(value.type === "none" ? false : value.value);
}

function containerType(
  _declaration: DeclarationType<"container-type">,
  b: DeclarationBuilder,
) {
  b.addContainer(["___default___"]);
  return;
}

function cornerShape(tokens: TokenOrValue[], b: DeclarationBuilder) {
  const [shape] = unparsed(tokens, b) ?? [];

  if (shape === "round") {
    return "circular";
  } else if (shape === "squircle") {
    return "continuous";
  }

  return;
}

function direction(
  declaration: DeclarationType<"direction">,
  b: DeclarationBuilder,
) {
  if (["ltr", "rtl"].includes(declaration.value)) {
    b.set("direction", declaration.value);
    b.setVariable("__rn-css-direction", declaration.value);
  }
  //b.addWarning("value", declaration.value);
  return;
}

function display(
  { value }: DeclarationType<"display">,
  _b: DeclarationBuilder,
) {
  if (value.type === "keyword") {
    if (value.value === "none" || value.value === "contents") {
      return value.value;
    } else {
      //b.addWarning("value", value.value);
      return;
    }
  } else {
    if (value.outside === "block") {
      switch (value.inside.type) {
        case "flow":
          if (value.isListItem) {
            //b.addWarning("value", "list-item");
          } else {
            //b.addWarning("value", "block");
          }
          return;
        case "flex":
          return value.inside.type;
        case "flow-root":
        case "table":
        case "box":
        case "grid":
        case "ruby":
          //b.addWarning("value", value.inside.type);
          return;
      }
    } else {
      switch (value.inside.type) {
        case "flow":
          //b.addWarning("value", "inline");
          return;
        case "flow-root":
          //b.addWarning("value", "inline-block");
          return;
        case "table":
          //b.addWarning("value", "inline-table");
          return;
        case "flex":
          //b.addWarning("value", "inline-flex");
          return;
        case "box":
        case "grid":
          //b.addWarning("value", "inline-grid");
          return;
        case "ruby":
          //b.addWarning("value", value.inside.type);
          return;
      }
    }
  }
}

function env(value: EnvironmentVariable, b: DeclarationBuilder) {
  switch (value.name.type) {
    case "ua":
      switch (value.name.value) {
        case "safe-area-inset-top":
        case "safe-area-inset-right":
        case "safe-area-inset-bottom":
        case "safe-area-inset-left": {
          const fallback = unparsed(value.fallback, b);

          return fallback
            ? ["fn", "var", `react-native-css-${value.name.value}`, fallback]
            : ["fn", "var", `react-native-css-${value.name.value}`];
        }
        case "viewport-segment-width":
        case "viewport-segment-height":
        case "viewport-segment-top":
        case "viewport-segment-left":
        case "viewport-segment-bottom":
        case "viewport-segment-right":
      }
      break;
    case "custom":
    case "unknown":
  }

  return;
}

function filter(
  declaration: DeclarationType<"filter">,
  b: DeclarationBuilder,
): ValueType | string | undefined {
  if (declaration.value.type === "none") {
    return "unset";
  }

  return declaration.value.value
    .map((value) => {
      switch (value.type) {
        case "opacity":
        case "blur":
        case "brightness":
        case "contrast":
        case "grayscale":
        case "invert":
        case "saturate":
        case "sepia":
          return {
            [value.type]: length(value.value, b),
          };
        case "hue-rotate":
          return {
            [value.type]: angle(value.value, b),
          };
        case "drop-shadow":
          return {
            dropShadow: {
              offsetX: length(value.value.xOffset, b),
              offsetY: length(value.value.yOffset, b),
              standardDeviation: length(value.value.blur, b),
              color: color(value.value.color, b),
            },
          };
        case "url":
          return;
      }
    })
    .filter((value) => value !== undefined) as ValueType[];
}

function flex({ value }: DeclarationType<"flex">, b: DeclarationBuilder) {
  b.set("flex-grow", value.grow);
  b.set("flex-shrink", value.shrink);
  b.set("flex-basis", lengthPercentageOrAuto(value.basis, b));
}

function flexFlow(
  { value }: DeclarationType<"flex-flow">,
  b: DeclarationBuilder,
) {
  b.set("flex-wrap", value.wrap);
  b.set("flex-direction", value.direction);
}

function fontColorDeclaration(
  declaration: Extract<Declaration, { value: CssColor }>,
  b: DeclarationBuilder,
) {
  return colorDeclaration(declaration, b);
}

function font({ value }: DeclarationType<"font">, b: DeclarationBuilder) {
  b.set("font-family", value.family[0]);
  b.set("line-height", lineHeight(value.lineHeight, b));
  b.set("font-size", fontSize(value.size, b));
  b.set("font-style", fontStyle(value.style, b));
  b.set("font-variant-caps", fontVariantCaps(value.variantCaps, b));
  b.set("font-weight", fontWeight(value.weight, b));
}

function fontFamily({ value }: DeclarationType<"font-family">) {
  // React Native only allows one font family - better hope this is the right one :)
  return value[0];
}

function fontSize(value: FontSize, b: DeclarationBuilder) {
  switch (value.type) {
    case "length":
      return length(value.value, b);
    case "absolute":
    case "relative":
      //b.addWarning("value", value.value);
      return undefined;
    default: {
      value satisfies never;
    }
  }

  return;
}

function fontSizeDeclaration(
  declaration: DeclarationType<"font-size">,
  b: DeclarationBuilder,
) {
  const value = fontSize(declaration.value, b);
  b.set("fontSize", value);
}

function fontStyle(value: FontStyle, _b: DeclarationBuilder) {
  switch (value.type) {
    case "normal":
    case "italic":
      return value.type;
    case "oblique":
      //b.addWarning("value", value.type);
      return undefined;
    default: {
      value satisfies never;
      return;
    }
  }
}

function fontStyleDeclaration(
  declaration: DeclarationType<"font-style">,
  b: DeclarationBuilder,
) {
  return fontStyle(declaration.value, b);
}

function fontVariantCaps(value: FontVariantCaps, _b: DeclarationBuilder) {
  const allowed = new Set([
    "small-caps",
    "oldstyle-nums",
    "lining-nums",
    "tabular-nums",
    "proportional-nums",
  ]);
  if (allowed.has(value)) {
    return value;
  }

  //b.addWarning("value", value);
  return;
}

function fontVariantCapsDeclaration(
  declaration: DeclarationType<"font-variant-caps">,
  b: DeclarationBuilder,
) {
  return fontVariantCaps(declaration.value, b);
}

function fontWeight(fontWeight: FontWeight, _b: DeclarationBuilder) {
  switch (fontWeight.type) {
    case "absolute":
      if (fontWeight.value.type === "weight") {
        return fontWeight.value.value;
      } else {
        return fontWeight.value.type;
      }
    case "bolder":
    case "lighter":
      //b.addWarning("value", fontWeight.type);
      return;
    default: {
      fontWeight satisfies never;
      return;
    }
  }
}

function fontWeightDeclaration(
  declaration: DeclarationType<"font-weight">,
  b: DeclarationBuilder,
) {
  return fontWeight(declaration.value, b);
}

function gap(
  declaration: DeclarationType<"gap" | "column-gap" | "row-gap">,
  b: DeclarationBuilder,
) {
  if ("column" in declaration.value) {
    const row = gapValue(declaration.value.row, b);
    const column = gapValue(declaration.value.column, b);

    if (row !== column) {
      b.set("row-gap", row);
      b.set("column-gap", column);
    } else {
      b.set("gap", row);
    }
  } else if (declaration.value.type === "normal") {
    //b.addWarning("value", declaration.value.type);
  } else {
    return length(declaration.value.value, b);
  }

  return;
}

function gapValue(value: GapValue, b: DeclarationBuilder) {
  if (value.type === "normal") {
    return;
  } else {
    return length(value.value, b);
  }
}

function gradient(
  gradient: Gradient,
  b: DeclarationBuilder,
): ValueType[] | undefined {
  switch (gradient.type) {
    case "linear": {
      const lineDirectionValue =
        lineDirection(gradient.direction, b) ?? "to bottom";
      return [
        "fn",
        "linearGradient",
        [
          "fn",
          "csv",
          lineDirectionValue,
          ...gradient.items
            .map((item) => gradientItem(item, b))
            .filter((s): s is ValueType => !!s),
        ],
      ];
    }
  }

  return;
}

function gradientItem(
  item: GradientItemFor_DimensionPercentageFor_LengthValue,
  b: DeclarationBuilder,
) {
  switch (item.type) {
    case "color-stop": {
      const colorValue = color(item.color, b);

      if (!colorValue) {
        return;
      }

      const lengthValue = item.position ? length(item.position, b) : undefined;

      if (lengthValue === undefined) {
        return ["fn", "colorStop", colorValue];
      } else {
        return ["fn", "colorStop", colorValue, lengthValue];
      }
    }
    case "hint":
      return length(item.value, b);
  }
}

function inset({ value }: DeclarationType<"inset">, b: DeclarationBuilder) {
  b.setShorthand("inset", {
    top: lengthPercentageOrAuto(value.top, b),
    bottom: lengthPercentageOrAuto(value.bottom, b),
    left: lengthPercentageOrAuto(value.left, b),
    right: lengthPercentageOrAuto(value.right, b),
  });
}

function insetBlock(
  { value }: DeclarationType<"inset-block">,
  b: DeclarationBuilder,
) {
  b.setShorthand("inset-block", {
    "inset-block-start": lengthPercentageOrAuto(value.blockStart, b),
    "inset-block-end": lengthPercentageOrAuto(value.blockEnd, b),
  });
}

function insetInline(
  { value }: DeclarationType<"inset-inline">,
  b: DeclarationBuilder,
) {
  b.setShorthand("inset-inline", {
    "inset-inline-start": lengthPercentageOrAuto(value.inlineStart, b),
    "inset-inline-end": lengthPercentageOrAuto(value.inlineEnd, b),
  });
}

function justifyContent(
  declaration: DeclarationType<"justify-content">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set([
    "flex-start",
    "flex-end",
    "center",
    "space-between",
    "space-around",
    "space-evenly",
  ]);

  let value: string | undefined;

  switch (declaration.value.type) {
    case "normal":
    case "left":
    case "right":
      value = declaration.value.type;
      break;
    case "content-distribution":
    case "content-position":
      value = declaration.value.value;
      break;
    default: {
      declaration.value satisfies never;
    }
  }

  if (value && !allowed.has(value)) {
    //b.addWarning("value", value);
    return;
  }

  return value;
}

function letterSpacing(
  { value }: DeclarationType<"letter-spacing">,
  b: DeclarationBuilder,
) {
  if (value.type === "normal") {
    return;
  }

  return length(value.value, b);
}

export function length(
  value:
    | number
    | Length
    | DimensionPercentageFor_LengthValue
    | NumberOrPercentage
    | LengthValue
    | Extract<Token, { type: "dimension" }>,
  b?: DeclarationBuilder,
): ValueType | undefined {
  const { inlineRem = 14 } = b?.getOptions() ?? {};

  if (typeof value === "number") {
    return round(value);
  }

  if ("unit" in value) {
    switch (value.unit) {
      case "px": {
        if (value.value === Infinity) {
          return Number.MAX_SAFE_INTEGER;
        } else if (value.value === -Infinity) {
          return Number.MIN_SAFE_INTEGER;
        } else {
          // Normalize large values to safe integers, e.g. `calc(infinity * 1px)`
          return round(
            Math.max(
              Math.min(value.value, Number.MAX_SAFE_INTEGER),
              Number.MIN_SAFE_INTEGER,
            ),
          );
        }
      }
      case "rem":
        if (typeof inlineRem === "number") {
          return value.value * inlineRem;
        } else {
          return [{}, "rem", round(value.value)];
        }
      case "vw":
      case "vh":
      case "em":
        return [{}, value.unit, round(value.value), 1];
      case "in":
      case "cm":
      case "mm":
      case "q":
      case "pt":
      case "pc":
      case "ex":
      case "rex":
      case "ch":
      case "rch":
      case "cap":
      case "rcap":
      case "ic":
      case "ric":
      case "lh":
      case "rlh":
      case "lvw":
      case "svw":
      case "dvw":
      case "cqw":
      case "lvh":
      case "svh":
      case "dvh":
      case "cqh":
      case "vi":
      case "svi":
      case "lvi":
      case "dvi":
      case "cqi":
      case "vb":
      case "svb":
      case "lvb":
      case "dvb":
      case "cqb":
      case "vmin":
      case "svmin":
      case "lvmin":
      case "dvmin":
      case "cqmin":
      case "vmax":
      case "svmax":
      case "lvmax":
      case "dvmax":
      case "cqmax":
      default: {
        //b.addWarning("value", `${length.value}${length.unit}`);
        return;
      }
    }
  } else {
    switch (value.type) {
      case "calc": {
        const args = calcArguments(value.value, b);
        if (args === undefined) {
          return;
        } else if (Array.isArray(args)) {
          return ["fn", "calc", ...args];
        } else {
          return ["fn", "calc", args];
        }
      }
      case "number": {
        return round(value.value);
      }
      case "percentage": {
        return `${round(value.value * 100)}%`;
      }
      case "dimension":
      case "value": {
        return length(value.value, b);
      }
    }
  }
}

function lengthDeclaration(
  declaration: {
    value:
      | number
      | Length
      | DimensionPercentageFor_LengthValue
      | NumberOrPercentage
      | LengthValue;
  },
  b: DeclarationBuilder,
) {
  return length(declaration.value, b);
}

function lengthPercentageDeclaration(
  value: { value: LengthPercentageOrAuto },
  b: DeclarationBuilder,
) {
  return lengthPercentageOrAuto(value.value, b);
}

function lengthPercentageOrAuto(
  lengthPercentageOrAuto: LengthPercentageOrAuto,
  b: DeclarationBuilder,
  { allowAuto = false } = {},
) {
  switch (lengthPercentageOrAuto.type) {
    case "auto":
      if (allowAuto) {
        return lengthPercentageOrAuto.type;
      } else {
        //b.addWarning("value", lengthPercentageOrAuto.type);
        return undefined;
      }
    case "length-percentage":
      return length(lengthPercentageOrAuto.value, b);
    default: {
      lengthPercentageOrAuto satisfies never;
      return;
    }
  }
}

function lengthPercentageOrAutoDeclaration(
  value: { value: LengthPercentageOrAuto },
  b: DeclarationBuilder,
) {
  return lengthPercentageOrAuto(value.value, b, { allowAuto: true });
}

function lineDirection(lineDirection: LineDirection, b: DeclarationBuilder) {
  switch (lineDirection.type) {
    case "corner":
      return `to ${lineDirection.horizontal} ${lineDirection.vertical}`;
    case "horizontal":
    case "vertical":
      return `to ${lineDirection.value}`;
    case "angle":
      return angle(lineDirection.value, b);
    default: {
      lineDirection satisfies never;
    }
  }

  return;
}

function lineHeight(value: LineHeight, b: DeclarationBuilder) {
  switch (value.type) {
    case "normal":
      return undefined;
    case "number":
      return [{}, "em", [value.value], 1];
    case "length": {
      const lengthValue = value.value;

      switch (lengthValue.type) {
        case "dimension":
          return length(lengthValue, b);
        case "percentage":
        case "calc":
          //b.addWarning(
          //   "style",
          //   "line-height",
          //   typeof length.value === "number"
          //     ? length.value
          //     : JSON.stringify(length.value),
          // );
          return;
        default: {
          lengthValue satisfies never;
          return;
        }
      }
    }
    default: {
      value satisfies never;
      return;
    }
  }
}

function lineHeightDeclaration(
  declaration: DeclarationType<"line-height">,
  b: DeclarationBuilder,
): ValueType | undefined {
  const value = lineHeight(declaration.value, b);
  if (value !== undefined) {
    return ["fn", "lineHeight", value];
  }
  return;
}

function margin({ value }: DeclarationType<"margin">, b: DeclarationBuilder) {
  b.setShorthand("margin", {
    "margin-top": size(value.top, b, { allowAuto: true }),
    "margin-bottom": size(value.bottom, b, { allowAuto: true }),
    "margin-left": size(value.left, b, { allowAuto: true }),
    "margin-right": size(value.right, b, { allowAuto: true }),
  });
}

function marginBlock(
  { value }: DeclarationType<"margin-block">,
  b: DeclarationBuilder,
) {
  b.setShorthand("margin-block", {
    "margin-block-start": lengthPercentageOrAuto(value.blockStart, b),
    "margin-block-end": lengthPercentageOrAuto(value.blockEnd, b),
  });
}

function marginInline(
  { value }: DeclarationType<"margin-inline">,
  b: DeclarationBuilder,
) {
  b.setShorthand("margin-inline", {
    "margin-inline-start": lengthPercentageOrAuto(value.inlineStart, b, {
      allowAuto: true,
    }),
    "margin-inline-end": lengthPercentageOrAuto(value.inlineEnd, b, {
      allowAuto: true,
    }),
  });
}

function objectFit(tokens: TokenOrValue[], b: DeclarationBuilder) {
  return unparsed(tokens, b);
}

function objectPosition(tokens: TokenOrValue[], b: DeclarationBuilder) {
  const value = unparsed(tokens, b);

  if (value === undefined) {
    return;
  }

  return value;
}

function outlineOffset(tokens: TokenOrValue[], b: DeclarationBuilder) {
  return unparsed(tokens, b);
}

function outlineStyle(
  declaration: DeclarationType<"outline-style">,
  b: DeclarationBuilder,
) {
  const allowed = ["solid", "dotted", "dashed"];

  if (
    declaration.value.type !== "auto" &&
    allowed.includes(declaration.value.value)
  ) {
    b.set("outlineStyle", declaration.value.value);
  } else {
    //b.addWarning(
    //   "value",
    //   declaration.value.type === "auto" ? "auto" : declaration.value.value,
    // );
  }
}

export function overflow(
  { value }: DeclarationType<"overflow">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set(["visible", "hidden"]);

  if (allowed.has(value.x)) {
    return value.x;
  }

  //b.addWarning("value", value.x);
  return undefined;
}

function padding({ value }: DeclarationType<"padding">, b: DeclarationBuilder) {
  b.setShorthand("padding", {
    "padding-top": size(value.top, b),
    "padding-bottom": size(value.bottom, b),
    "padding-left": size(value.left, b),
    "padding-right": size(value.right, b),
  });
}

function paddingBlock(
  { value }: DeclarationType<"padding-block">,
  b: DeclarationBuilder,
) {
  b.setShorthand("padding-block", {
    "padding-block-start": lengthPercentageOrAuto(value.blockStart, b),
    "padding-block-end": lengthPercentageOrAuto(value.blockEnd, b),
  });
}

function paddingInline(
  { value }: DeclarationType<"padding-inline">,
  b: DeclarationBuilder,
) {
  b.setShorthand("padding-inline", {
    "padding-inline-start": lengthPercentageOrAuto(value.inlineStart, b),
    "padding-inline-end": lengthPercentageOrAuto(value.inlineEnd, b),
  });
}

function pointerEvents({ value }: { value: string }, _b: DeclarationBuilder) {
  switch (value) {
    case "none":
    case "box-none":
    case "box-only":
    case "auto":
      return value;
    case "visible":
    case "visiblePainted":
    case "visibleFill":
    case "visibleStroke":
    case "painted":
    case "fill":
    case "stroke":
    //b.addWarning("value", value);
  }

  return;
}

function position(
  { value }: DeclarationType<"position">,
  _b: DeclarationBuilder,
) {
  if (
    value.type === "absolute" ||
    value.type === "relative" ||
    value.type === "static"
  ) {
    return value.type;
  }

  //b.addWarning("value", value.type);
  return;
}

function rippleLayer(tokens: TokenOrValue[], b: DeclarationBuilder) {
  const value = parseTokens(tokens, b);
  if (value === "foreground") {
    return true;
  }

  return;
}

function rippleStyle(tokens: TokenOrValue[], b: DeclarationBuilder) {
  const value = parseTokens(tokens, b);
  if (value === "borderless") {
    return true;
  }

  return;
}

function rotate({ value }: DeclarationType<"rotate">, b: DeclarationBuilder) {
  if (value.x) {
    b.set("rotateX", angle(value.angle, b));
  }

  if (value.y) {
    b.set("rotateY", angle(value.angle, b));
  }

  if (value.z) {
    b.set("rotateZ", angle(value.angle, b));
  }
}

function scale({ value }: DeclarationType<"scale">, b: DeclarationBuilder) {
  b.set("scaleX", scaleValue(value, "x", b));
  b.set("scaleY", scaleValue(value, "y", b));
}

function scaleValue(
  translate: Scale,
  prop: keyof Extract<Scale, object>,
  b: DeclarationBuilder,
) {
  if (translate === "none") {
    return 0;
  }

  return length(translate[prop], b);
}

function size(
  size: Size | MaxSize,
  b: DeclarationBuilder,
  options?: { allowAuto?: boolean },
): ValueType | undefined;
function size(
  size: Size | MaxSize,
  b: DeclarationBuilder,
  property: string,
  options?: { allowAuto?: boolean },
): ValueType | undefined;
function size(
  size: Size | MaxSize,
  b: DeclarationBuilder,
  options?: string | { allowAuto?: boolean },
  { allowAuto = false } = {},
) {
  allowAuto =
    (typeof options === "object" ? options.allowAuto : allowAuto) ?? false;

  switch (size.type) {
    case "length-percentage":
      return length(size.value, b);
    case "none":
      return size.type;
    case "auto":
      if (allowAuto) {
        return size.type;
      } else {
        //b.addWarning("value", size.type);
        return undefined;
      }
    case "min-content":
    case "max-content":
    case "fit-content":
    case "fit-content-function":
    case "stretch":
    case "contain":
      //b.addWarning("value", size.type);
      return undefined;
    default: {
      size satisfies never;
    }
  }

  return;
}

function sizeDeclaration(
  declaration: { value: Size | MaxSize },
  b: DeclarationBuilder,
) {
  return size(declaration.value, b);
}

function sizeWithAutoDeclaration(
  declaration: { value: Size | MaxSize },
  b: DeclarationBuilder,
) {
  return size(declaration.value, b, { allowAuto: true });
}

function size2DDimensionPercentageDeclaration(
  declaration: { value: Size2DFor_DimensionPercentageFor_LengthValue },
  b: DeclarationBuilder,
) {
  return length(declaration.value[0], b);
}

function svgPaint(
  { value }: DeclarationType<"fill" | "stroke">,
  b: DeclarationBuilder,
) {
  if (value.type === "none") {
    return "transparent";
  } else if (value.type === "color") {
    return color(value.value, b);
  } else {
    //b.addWarning("value", value.type);
    return;
  }
}

function textAlign(
  { value }: DeclarationType<"text-align">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set(["auto", "left", "right", "center", "justify"]);
  if (allowed.has(value)) {
    return value;
  }

  //b.addWarning("value", value);
  return;
}

function textDecoration(
  { value }: DeclarationType<"text-decoration">,
  b: DeclarationBuilder,
) {
  b.set("text-decoration-color", color(value.color, b));
  b.set("text-decoration-line", textDecorationLine(value.line, b));
}

function textDecorationLine(
  value: DeclarationType<"text-decoration-line">["value"],
  _b: DeclarationBuilder,
) {
  if (!Array.isArray(value)) {
    if (value === "none") {
      return value;
    }
    //b.addWarning("value", value);
    return;
  }

  const set = new Set(value);

  if (set.has("underline")) {
    if (set.has("line-through")) {
      return "underline line-through";
    } else {
      return "underline";
    }
  } else if (set.has("line-through")) {
    return "line-through";
  }

  //b.addWarning("value", value.join(" "));
  return;
}

function textDecorationLineDeclaration(
  declaration: DeclarationType<"text-decoration-line">,
  b: DeclarationBuilder,
) {
  return textDecorationLine(declaration.value, b);
}

function textDecorationStyle(
  declaration: DeclarationType<"text-decoration-style">,
  _b: DeclarationBuilder,
) {
  const allowed = new Set(["solid", "double", "dotted", "dashed"]);

  if (allowed.has(declaration.value)) {
    return declaration.value;
  }

  //b.addWarning("value", declaration.value);
  return;
}

function textShadow(
  declaration: DeclarationType<"text-shadow">,
  b: DeclarationBuilder,
) {
  const [textShadow] = declaration.value;

  if (!textShadow) {
    return;
  }
  b.set("textShadowColor", color(textShadow.color, b));
  b.set("textShadowOffsetWidth", length(textShadow.xOffset, b));
  b.set("textShadowOffsetHeight", length(textShadow.yOffset, b));
  b.set("textShadowRadius", length(textShadow.blur, b));
}

function time(time: Time) {
  return round(time.type === "milliseconds" ? time.value : time.value * 1000);
}

function translate(
  { value }: DeclarationType<"translate">,
  b: DeclarationBuilder,
) {
  b.set("translateX", value === "none" ? "unset" : length(value.x, b));
  b.set("translateY", value === "none" ? "unset" : length(value.y, b));
}

function transform(
  { value }: DeclarationType<"transform">,
  b: DeclarationBuilder,
) {
  for (const t of value) {
    switch (t.type) {
      case "perspective":
        b.set("perspective", length(t.value, b));
        break;
      case "translate":
        b.set("translateX", length(t.value[0], b));
        b.set("translateY", length(t.value[1], b));
        break;
      case "translateX":
        b.set("translateX", length(t.value, b));
        break;
      case "translateY":
        b.set("translateY", length(t.value, b));
        break;
      case "rotate": {
        b.set("rotate", angle(t.value, b));
        break;
      }
      case "rotateX": {
        b.set("rotateX", angle(t.value, b));
        break;
      }
      case "rotateY": {
        b.set("rotateY", angle(t.value, b));
        break;
      }
      case "rotateZ": {
        b.set("rotateZ", angle(t.value, b));
        break;
      }
      case "scale":
        b.set("scaleX", length(t.value[0], b));
        b.set("scaleY", length(t.value[1], b));
        break;
      case "scaleX":
        b.set("scaleX", length(t.value, b));
        break;
      case "scaleY":
        b.set("scaleY", length(t.value, b));
        break;
      case "skew": {
        b.set("skewX", angle(t.value[0], b));
        b.set("skewY", angle(t.value[1], b));
        break;
      }
      case "skewX":
        b.set("skewX", angle(t.value, b));
        break;
      case "skewY":
        b.set("skewY", angle(t.value, b));
        break;
      case "translateZ":
      case "translate3d":
      case "scaleZ":
      case "scale3d":
      case "rotate3d":
      case "matrix":
      case "matrix3d":
    }
  }
  return;
}

function transition(
  { value }: DeclarationType<"transition">,
  b: DeclarationBuilder,
) {
  const grouped: Record<string, unknown[]> = {};
  for (const transition of value) {
    for (const [key, value] of Object.entries(transition)) {
      grouped[key] ??= [];
      grouped[key].push(value);
    }
  }

  for (const [key, value] of Object.entries(grouped)) {
    switch (key) {
      case "delay":
        b.set(
          "transitionDelay",
          transitionDelay(
            {
              property: "transition-delay",
              value: value as Time[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      case "duration":
        b.set(
          "transitionDuration",
          transitionDuration(
            {
              property: "transition-duration",
              value: value as Time[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      case "property":
        b.set(
          "transitionProperty",
          transitionProperty(
            {
              property: "transition-property",
              value: value as PropertyId[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
      case "timingFunction":
        b.set(
          "transitionTimingFunction",
          transitionTimingFunction(
            {
              property: "transition-timing-function",
              value: value as EasingFunction[],
              vendorPrefix: [],
            },
            b,
          ),
        );
        break;
    }
  }
}

function transitionDelay(
  { value }: DeclarationType<"transition-delay">,
  _b: DeclarationBuilder,
) {
  return value.map((t) => time(t));
}

function transitionDuration(
  { value }: DeclarationType<"transition-duration">,
  _b: DeclarationBuilder,
) {
  return value.map((t) => time(t));
}

function transitionProperty(
  { value }: DeclarationType<"transition-property">,
  _b: DeclarationBuilder,
) {
  return value
    .map((prop) => prop.property)
    .filter((value) => {
      return (
        value === "all" ||
        value === "none" ||
        (value in parsers && value !== "visibility")
      );
    });
}

function transitionTimingFunction(
  { value }: DeclarationType<"transition-timing-function">,
  _b: DeclarationBuilder,
) {
  return value.map((easing) => {
    switch (easing.type) {
      case "linear":
      case "ease":
      case "ease-in":
      case "ease-out":
      case "ease-in-out":
        return easing.type;
      case "cubic-bezier":
        return [
          "fn",
          "cubicBezier",
          easing.x1,
          easing.y1,
          easing.x2,
          easing.y2,
        ];
      case "steps":
        return easing.position
          ? ["fn", "steps", easing.count, easing.position.type]
          : ["fn", "steps", easing.count];
    }
  });
}

function unresolvedColor(color: UnresolvedColor, b: DeclarationBuilder) {
  switch (color.type) {
    case "rgb":
      return [
        "fn",
        "rgba",
        round(color.r * 255),
        round(color.g * 255),
        round(color.b * 255),
        ...(unparsed(color.alpha, b) ?? []),
      ];
    case "hsl":
      return [
        "fn",
        color.type,
        color.h,
        color.s,
        color.l,
        ...(unparsed(color.alpha, b) ?? []),
      ];
    case "light-dark": {
      const light = parseTokens(color.light, b);
      const dark = parseTokens(color.dark, b);

      if (light === undefined || dark === undefined) {
        return;
      }
      return ["___light-dark___", light, dark];
    }
    default:
      color satisfies never;
      return;
  }
}

function userSelect(
  { value }: DeclarationType<"user-select">,
  _b: DeclarationBuilder,
) {
  const allowed = ["auto", "text", "none", "contain", "all"];
  if (allowed.includes(value)) {
    return value;
  } else {
    //b.addWarning("value", value);
    return;
  }
}

function verticalAlign(
  { value }: DeclarationType<"vertical-align">,
  _b: DeclarationBuilder,
) {
  if (value.type === "length") {
    return undefined;
  }

  const allowed = new Set(["auto", "top", "bottom", "middle"]);

  if (allowed.has(value.value)) {
    return value.value;
  }

  //b.addWarning("value", value.value);
  return undefined;
}

function visibility(
  declaration: DeclarationType<"visibility">,
  b: DeclarationBuilder,
) {
  if (declaration.value === "visible") {
    b.set("opacity", 1);
  } else if (declaration.value === "hidden") {
    b.set("opacity", 0);
  } else {
    //b.addWarning("value", declaration.value);
  }
}

function zIndex({ value }: DeclarationType<"z-index">, b: DeclarationBuilder) {
  if (value.type === "integer") {
    return length(value.value, b);
  } else {
    //b.addWarning("value", value.type);
    return;
  }
}

/************************************ Utils ***********************************/

export function round(number: number) {
  return Math.round((number + Number.EPSILON) * 10000) / 10000;
}

const CommaSeparator = Symbol("CommaSeparator");
function parseTokens(
  tokenOrValues: TokenOrValue[],
  b: DeclarationBuilder,
  allowAuto = false,
) {
  let currentGroup: ValueType[] = [];
  const groups: ValueType[] = [currentGroup];
  for (const tokenOrValue of tokenOrValues) {
    if (tokenOrValue.type === "token" && tokenOrValue.value.type === "comma") {
      currentGroup = [];
      groups.push(currentGroup);
      continue;
    }

    const value = unparsed(tokenOrValue, b, allowAuto);

    if (!value) {
      return;
    }

    currentGroup.push(value);
  }

  const flatGroups: ValueType[] = [];

  for (const group of groups) {
    if (!Array.isArray(group)) {
      return;
    }

    if (group.length === 0) {
      return;
    }

    const first = group[0];

    if (group.length === 1 && first !== undefined) {
      flatGroups.push(first);
    } else {
      flatGroups.push(group);
    }
  }

  const first = flatGroups[0];
  return flatGroups.length === 1 && first !== undefined ? first : flatGroups;
}

const namedColors = new Set([
  "aliceblue",
  "antiquewhite",
  "aqua",
  "aquamarine",
  "azure",
  "beige",
  "bisque",
  "black",
  "blanchedalmond",
  "blue",
  "blueviolet",
  "brown",
  "burlywood",
  "cadetblue",
  "chartreuse",
  "chocolate",
  "coral",
  "cornflowerblue",
  "cornsilk",
  "crimson",
  "cyan",
  "darkblue",
  "darkcyan",
  "darkgoldenrod",
  "darkgray",
  "darkgreen",
  "darkgrey",
  "darkkhaki",
  "darkmagenta",
  "darkolivegreen",
  "darkorange",
  "darkorchid",
  "darkred",
  "darksalmon",
  "darkseagreen",
  "darkslateblue",
  "darkslategrey",
  "darkturquoise",
  "darkviolet",
  "deeppink",
  "deepskyblue",
  "dimgray",
  "dimgrey",
  "dodgerblue",
  "firebrick",
  "floralwhite",
  "forestgreen",
  "fuchsia",
  "gainsboro",
  "ghostwhite",
  "gold",
  "goldenrod",
  "gray",
  "green",
  "greenyellow",
  "grey",
  "honeydew",
  "hotpink",
  "indianred",
  "indigo",
  "ivory",
  "khaki",
  "lavender",
  "lavenderblush",
  "lawngreen",
  "lemonchiffon",
  "lightblue",
  "lightcoral",
  "lightcyan",
  "lightgoldenrodyellow",
  "lightgray",
  "lightgreen",
  "lightgrey",
  "lightpink",
  "lightsalmon",
  "lightseagreen",
  "lightskyblue",
  "lightslategrey",
  "lightsteelblue",
  "lightyellow",
  "lime",
  "limegreen",
  "linen",
  "magenta",
  "maroon",
  "mediumaquamarine",
  "mediumblue",
  "mediumorchid",
  "mediumpurple",
  "mediumseagreen",
  "mediumslateblue",
  "mediumspringgreen",
  "mediumturquoise",
  "mediumvioletred",
  "midnightblue",
  "mintcream",
  "mistyrose",
  "moccasin",
  "navajowhite",
  "navy",
  "oldlace",
  "olive",
  "olivedrab",
  "orange",
  "orangered",
  "orchid",
  "palegoldenrod",
  "palegreen",
  "paleturquoise",
  "palevioletred",
  "papayawhip",
  "peachpuff",
  "peru",
  "pink",
  "plum",
  "powderblue",
  "purple",
  "rebeccapurple",
  "red",
  "rosybrown",
  "royalblue",
  "saddlebrown",
  "salmon",
  "sandybrown",
  "seagreen",
  "seashell",
  "sienna",
  "silver",
  "skyblue",
  "slateblue",
  "slategray",
  "snow",
  "springgreen",
  "steelblue",
  "tan",
  "teal",
  "thistle",
  "tomato",
  "turquoise",
  "violet",
  "wheat",
  "white",
  "whitesmoke",
  "yellow",
  "yellowgreen",
]);
