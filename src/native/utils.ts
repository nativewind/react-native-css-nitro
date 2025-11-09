import { createElement, type ComponentType, type ExoticComponent } from "react";

import { ContainerContext, VariableContext } from "./contexts";
import type { useStyled } from "./useStyled";

export function useElement(
  component: ComponentType | ExoticComponent<any>,
  next: ReturnType<typeof useStyled>,
  p: Record<string, any>,
) {
  p = {
    value: next.containerScope,
    children: createElement(component, p),
  };
  component = ContainerContext;

  p = {
    value: next.variableScope,
    children: createElement(component, p),
  };
  component = VariableContext;

  return createElement(component, p);
}

export function flattenStyles(
  normal: unknown,
  inline: unknown,
  important: unknown,
) {
  if (normal && inline && important) {
    return [normal, inline, important];
  } else if (normal && inline) {
    return [normal, inline];
  } else if (normal && important) {
    return [normal, important];
  } else if (inline && important) {
    return [inline, important];
  } else if (normal) {
    return normal;
  } else if (inline) {
    return inline;
  } else if (important) {
    return important;
  } else {
    return undefined;
  }
}
