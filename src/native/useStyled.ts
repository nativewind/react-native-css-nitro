import { use, useEffect, useMemo, useReducer } from "react";

import type { AnyMap } from "react-native-nitro-modules";

import { StyleRegistry } from "../specs/StyleRegistry";
import type {
  Declarations,
  Styled,
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
  }, [componentId, instance, containerScope, validClassNames, variableScope]);

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
      p.onPress = getInteractionHandler("onPress", styled, props);
      p.onPressIn = getInteractionHandler("onPressIn", styled, props);
      p.onPressOut = getInteractionHandler(
        "onPressOut",
        styled,
        props.onPressOut,
      );
    }

    if (declarations.hover) {
      p.onHoverIn = getInteractionHandler("onHoverIn", styled, props.onHoverIn);
      p.onHoverOut = getInteractionHandler(
        "onHoverOut",
        styled,
        props.onHoverOut,
      );
    }

    if (declarations.focus) {
      p.onFocus = getInteractionHandler("onFocus", styled, props.onFocus);
      p.onBlur = getInteractionHandler("onBlur", styled, props.onBlur);
    }
  }

  return styled;
}

const cache = new WeakMap<WeakKey, (event: unknown) => void>();
function getInteractionHandler(
  type: Parameters<(typeof StyleRegistry)["updateComponentState"]>[1],
  styled: Styled,
  props: Record<string, any>,
) {
  const inlineHandler = props[type];
  if (!inlineHandler) {
    return styled[type];
  }

  const cached = cache.get(inlineHandler);
  if (cached) {
    return cached;
  }

  const handler = (event: unknown) => {
    inlineHandler(event);
    styled[type]?.();
  };

  cache.set(inlineHandler, handler);
  return handler;
}
