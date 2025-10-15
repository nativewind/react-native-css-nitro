import { createElement, type ComponentType, type ExoticComponent } from "react";

import { StyleRegistry } from "../specs/StyleRegistry";
import { ContainerContext, VariableContext } from "./contexts";
import type { useStyledProps } from "./useStyled";

export function useElement(
  component: ComponentType | ExoticComponent<any>,
  componentId: string,
  next: ReturnType<typeof useStyledProps>,
  p: Record<string, any>,
) {
  if (next.declarations.active) {
    p.onPress =
      p.onPress ??
      (() => {
        return;
      });
    p.onPressIn = onPressIn(componentId, p);
    p.onPressOut = onPressOut(componentId, p);
  }

  if (next.declarations.hover) {
    p.onHoverIn = onHoverIn(componentId, p);
    p.onHoverOut = onHoverOut(componentId, p);
  }

  if (next.declarations.focus) {
    p.onFocus = onFocus(componentId, p);
    p.onBlur = onBlur(componentId, p);
  }

  if (next.declarations.animated) {
    component = getAnimatedComponent(component);
  }

  if (next.containerScope === componentId) {
    p = {
      value: next.containerScope,
      children: createElement(component, p),
    };
    component = ContainerContext;
  }

  if (next.variableScope === componentId) {
    p = {
      value: next.variableScope,
      children: createElement(component, p),
    };
    component = VariableContext;
  }

  return createElement(component, p);
}

const onPressIn = (id: string, props: Record<string, any>) => () => {
  props.onPressIn?.();
  StyleRegistry.updateComponentState(id, "active", true);
};

const onPressOut = (id: string, props: Record<string, any>) => () => {
  props.onPressIn?.();
  StyleRegistry.updateComponentState(id, "active", false);
};

const onHoverIn = (id: string, props: Record<string, any>) => () => {
  props.onHoverIn?.();
  StyleRegistry.updateComponentState(id, "hover", true);
};

const onHoverOut = (id: string, props: Record<string, any>) => () => {
  props.onHoverOut?.();
  StyleRegistry.updateComponentState(id, "hover", false);
};

const onFocus = (id: string, props: Record<string, any>) => () => {
  props.onFocus?.();
  StyleRegistry.updateComponentState(id, "focus", true);
};

const onBlur = (id: string, props: Record<string, any>) => () => {
  props.onBlur?.();
  StyleRegistry.updateComponentState(id, "focus", false);
};

const animatedCache = new WeakMap<ComponentType, ComponentType>();
function getAnimatedComponent(component: ComponentType) {
  if (
    "displayName" in component &&
    component.displayName?.startsWith("Animated.")
  ) {
    return component;
  }

  const cached = animatedCache.get(component);
  if (cached) {
    return cached;
  }

  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const createAnimatedComponent = require("react-native-reanimated")
    .createAnimatedComponent as (component: ComponentType) => ComponentType;

  const animatedComponent = createAnimatedComponent(component);
  animatedCache.set(component, animatedComponent);
  return animatedComponent;
}
