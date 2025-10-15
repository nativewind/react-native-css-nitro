import { use, useEffect, useMemo, useReducer } from "react";

import type { AnyMap } from "react-native-nitro-modules";

import { StyleRegistry, type Declarations } from "../specs/StyleRegistry";
import { ContainerContext, VariableContext } from "./contexts";
import { useHandlers } from "./useHandlers";

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

  // Update the variable scope after we have retrieved the declarations, so it uses its own scope
  variableScope = declarations.variableScope ?? variableScope;

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

  // Update the container scope after we have registered the component, so it doesn't use its own scope
  containerScope = declarations.containerScope ?? containerScope;

  useEffect(
    () => () => {
      StyleRegistry.deregisterComponent(componentId);
    },
    [componentId],
  );

  styled = useHandlers(componentId, props, declarations, styled);

  return styled;
}
