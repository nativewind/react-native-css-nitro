import { use, useEffect, useMemo, useReducer } from "react";

import { StyleRegistry, type Declarations } from "../specs/StyleRegistry";
import { testAttributeQuery } from "./attributeQuery";
import { ContainerContext, VariableContext } from "./contexts";

const EMPTY_DECLARATIONS: Declarations = {};
const REDUCER = <T>(state: T) => ({ ...state });

export function useStyledProps(
  componentId: string,
  className: string | undefined,
  originalProps: Record<string, any>,
  isDisabled = false,
) {
  const [instance, rerender] = useReducer(REDUCER, EMPTY_DECLARATIONS);

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

  let validAttributeQueryIds = "";

  if (declarations.attributeQueries) {
    for (const [id, query] of declarations.attributeQueries) {
      if (testAttributeQuery(originalProps, query, isDisabled)) {
        validAttributeQueryIds += id + " ";
      }
    }
  }

  // Update the variable scope after we have retrieved the declarations, so it uses its own scope
  variableScope = declarations.variableScope ?? variableScope;

  const componentData = useMemo(() => {
    if (!className) {
      return {};
    }

    console.log("validAttributeQueries before", validAttributeQueryIds);

    const validAttributeQueries = validAttributeQueryIds.split(" ");
    // Remove the trailing empty string
    validAttributeQueries.pop();

    console.log("validAttributeQueries", validAttributeQueries);

    return StyleRegistry.registerComponent(
      componentId,
      rerender,
      className,
      variableScope,
      containerScope,
      validAttributeQueries,
    );
  }, [
    componentId,
    className,
    variableScope,
    containerScope,
    validAttributeQueryIds,
    // This is not used, but if the registry fires a rerender it will have a different identity
    instance,
  ]);

  // Update the container scope after we have registered the component, so it doesn't use its own scope
  containerScope = declarations.containerScope ?? containerScope;

  const p: Record<string, unknown> = {
    ...componentData.importantProps,
  };

  useEffect(
    () => () => {
      StyleRegistry.deregisterComponent(componentId);
    },
    [componentId],
  );

  if (declarations.active) {
    p.onPress =
      p.onPress ??
      (() => {
        return;
      });
    p.onPressIn = onPressIn(componentId, p);
    p.onPressOut = onPressOut(componentId, p);
  }

  if (declarations.hover) {
    p.onHoverIn = onHoverIn(componentId, p);
    p.onHoverOut = onHoverOut(componentId, p);
  }

  if (declarations.focus) {
    p.onFocus = onFocus(componentId, p);
    p.onBlur = onBlur(componentId, p);
  }

  return {
    props: componentData.props,
    importantProps: p,
    style: componentData.style,
    importantStyle: componentData.importantStyle,
    variableScope,
    containerScope,
  };
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
