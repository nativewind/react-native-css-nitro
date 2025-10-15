import {
  StyleRegistry,
  type Declarations,
  type PseudoClassType,
  type Styled,
} from "../specs/StyleRegistry";

export function useHandlers(
  componentId: string,
  props: Record<string, any>,
  declarations: Declarations,
  styled: Styled,
) {
  if (
    declarations.pressable ||
    declarations.container ||
    declarations.active ||
    declarations.focus ||
    declarations.hover
  ) {
    styled = { ...styled };
    styled.importantProps = { ...styled.importantProps };
    const p = styled.importantProps as Record<string, unknown>;

    if (declarations.active) {
      p.onPress = getInteractionHandler(componentId, "onPress", props, true);
      p.onPressIn = getInteractionHandler(
        componentId,
        "onPressIn",
        props,
        true,
      );
      p.onPressOut = getInteractionHandler(
        componentId,
        "onPressOut",
        props,
        false,
      );
    }

    if (declarations.hover) {
      p.onHoverIn = getInteractionHandler(
        componentId,
        "onHoverIn",
        props,
        true,
      );
      p.onHoverOut = getInteractionHandler(
        componentId,
        "onHoverOut",
        props.onHoverOut,
        false,
      );
    }

    if (declarations.focus) {
      p.onFocus = getInteractionHandler(componentId, "onFocus", props, true);
      p.onBlur = getInteractionHandler(componentId, "onBlur", props, false);
    }
  }

  return styled;
}

const cache = new WeakMap<WeakKey, (event: unknown) => void>();
function getInteractionHandler(
  componentId: string,
  type:
    | "onPress"
    | "onPressIn"
    | "onPressOut"
    | "onHoverIn"
    | "onHoverOut"
    | "onFocus"
    | "onBlur",
  props: Record<string, any> | null | undefined,
  value: boolean,
) {
  const inlineHandler = props?.[type];

  const pseudoClass: PseudoClassType = type.includes("Press")
    ? "active"
    : type.includes("Hover")
      ? "hover"
      : "focus";

  if (!inlineHandler) {
    return () => {
      if (type !== "onPress") {
        StyleRegistry.updateComponentState(componentId, pseudoClass, value);
      }
    };
  }

  const cached = cache.get(inlineHandler);
  if (cached) {
    return cached;
  }

  const handler = (event: unknown) => {
    inlineHandler(event);
    if (type !== "onPress") {
      StyleRegistry.updateComponentState(componentId, pseudoClass, value);
    }
  };

  cache.set(inlineHandler, handler);
  return handler;
}
