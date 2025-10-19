import { useId, type ComponentProps, type Ref } from "react";
import { Text as RNText } from "react-native";

import { createAnimatedComponent } from "react-native-reanimated";

import { useElement } from "../../native/useElement";
import { useDualRefs } from "../../native/useRef";
import { useStyledProps } from "../../native/useStyled";
import { StyleRegistry } from "../../specs/StyleRegistry";
import { copyComponentProperties, getDeepKeys } from "../../utils";

const AnimatedText = createAnimatedComponent(RNText);

export const Text = copyComponentProperties(
  RNText,
  (
    p: ComponentProps<typeof AnimatedText> & {
      className?: string;
      ref?: Ref<RNText>;
    },
  ) => {
    const componentId = useId();
    const styled = useStyledProps(componentId, p.className, p);

    const ref = useDualRefs(componentId, p.ref);

    if (p.style) {
      StyleRegistry.updateComponentInlineStyleKeys(
        componentId,
        getDeepKeys(p.style),
      );
    }

    return useElement(AnimatedText, styled, {
      ...styled.props,
      ...p,
      ...styled.importantProps,
      ref,
      style:
        styled.style || styled.importantStyle
          ? [styled.style, p.style, styled.importantStyle]
          : p.style,
    });
  },
);

export default Text;
