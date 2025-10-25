import { createElement, type ComponentType, type ExoticComponent } from "react";

import { ContainerContext, VariableContext } from "./contexts";
import type { useStyledProps } from "./useStyled";

export function useElement(
  component: ComponentType | ExoticComponent<any>,
  next: ReturnType<typeof useStyledProps>,
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
