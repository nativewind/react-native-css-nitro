import { use, useEffect, useMemo, useReducer } from "react";

import type { AnyMap } from "react-native-nitro-modules";

import { StyleRegistry } from "../specs/StyleRegistry";
import type {
  Declarations,
  PseudoClassType,
} from "../specs/StyleRegistry/HybridStyleRegistry.nitro";
import { ContainerContext, VariableContext } from "./contexts";

const EMPTY_DECLARATIONS: Declarations = { classNames: "" };

export function useStyled(
  componentId: string,
  className: string | undefined,
  props: Record<string, any>,
  isDisabled = false,
) {
  const [instance, rerender] = useReducer(() => ({}), {});

  let variableScope = use(VariableContext);
  let containerScope = use(ContainerContext);

  const declarations = className
    ? StyleRegistry.getDeclarations(
        componentId,
        className,
        variableScope,
        containerScope,
      )
    : EMPTY_DECLARATIONS;

  let validClassNames = declarations.classNames;

  if (declarations.requiresRuntimeCheck) {
    for (const entry of declarations.requiresRuntimeCheck) {
      if (entry[1](componentId, props as AnyMap, isDisabled)) {
        validClassNames += " " + entry[0];
      }
    }
  }

  variableScope = declarations.variableScope ?? variableScope;
  containerScope = declarations.containerScope ?? containerScope;

  let styled = useMemo(() => {
    if (!validClassNames) {
      return {};
    }

    return StyleRegistry.registerComponent(
      componentId,
      rerender,
      validClassNames,
      variableScope,
      containerScope,
    );
  }, [componentId, instance, validClassNames, variableScope, containerScope]);

  useEffect(
    () => () => {
      StyleRegistry.deregisterComponent(componentId);
    },
    [componentId],
  );

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
