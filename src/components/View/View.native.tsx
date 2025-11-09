import { useId, type ComponentProps } from "react";
import { Pressable } from "react-native";

import { createAnimatedComponent } from "react-native-reanimated";

import { useStyledWithRef } from "../../native/useStyled";
import { flattenStyles, useElement } from "../../native/utils";
import { copyComponentProperties } from "../../utils";

const AnimatedView = createAnimatedComponent(Pressable);

export const View = copyComponentProperties(
  AnimatedView,
  (p: ComponentProps<typeof AnimatedView>) => {
    const componentId = useId();
    const { styled, ref } = useStyledWithRef(
      componentId,
      p.className,
      p,
      p.style,
      p.disabled ?? p["aria-disabled"],
    );

    return useElement(AnimatedView, styled, {
      ...styled.props,
      ...p,
      ...styled.importantProps,
      ref,
      style: flattenStyles(styled.style, p.style, styled.importantStyle),
    });
  },
);

export default View;
