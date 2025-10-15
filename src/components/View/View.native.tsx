import { useId } from "react";
import { Pressable, View as RNView, type ViewProps } from "react-native";

import { useElement } from "../../native/useElement";
import { useRef } from "../../native/useRef";
import { useStyledProps } from "../../native/useStyled";
import { StyleRegistry } from "../../specs/StyleRegistry";
import { copyComponentProperties, getDeepKeys } from "../../utils";

export const View = copyComponentProperties(
  RNView,
  (originalProps: ViewProps) => {
    let p = originalProps as Record<string, any>;
    const componentId = useId();
    const next = useStyledProps(componentId, p.className, p);
    const ref = useRef(componentId, p.ref);

    if (p.style) {
      StyleRegistry.updateComponentInlineStyleKeys(
        componentId,
        getDeepKeys(p.style),
      );
    }

    p = {
      ...next.props,
      ...p,
      ...next.importantProps,
      ref,
      style:
        next.style || next.importantStyle
          ? [next.style, p.style, next.importantStyle]
          : p.style,
    };

    return useElement(
      next.declarations.active || next.declarations.hover ? Pressable : RNView,
      componentId,
      next,
      p,
    );
  },
);

export default View;
