import { useId, type ComponentPropsWithRef } from "react";
import { Text as RNText } from "react-native";

import { createAnimatedComponent } from "react-native-reanimated";

import { useStyledWithRef } from "../../native/useStyled";
import { flattenStyles, useElement } from "../../native/utils";
import { copyComponentProperties } from "../../utils";

const AnimatedText = createAnimatedComponent(RNText);

export const Text = copyComponentProperties(
  RNText,
  (p: ComponentPropsWithRef<typeof AnimatedText>) => {
    const componentId = useId();
    const { styled, ref } = useStyledWithRef(
      componentId,
      p.className,
      p,
      p.style,
      p.disabled ?? p["aria-disabled"],
    );

    return useElement(AnimatedText, styled, {
      ...styled.props,
      ...p,
      ...styled.importantProps,
      ref,
      style: flattenStyles(styled.style, p.style, styled.importantStyle),
    });
  },
);

export default Text;
