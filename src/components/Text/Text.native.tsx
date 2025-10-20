import { useId, type ComponentPropsWithRef } from "react";
import { Text as RNText } from "react-native";

import { createAnimatedComponent } from "react-native-reanimated";

import { useStyledProps } from "../../native/useStyled";
// import { useDualRefs } from "../../native/useRef";
import { copyComponentProperties } from "../../utils";

const AnimatedText = createAnimatedComponent(RNText);

export const Text = copyComponentProperties(
  RNText,
  (p: ComponentPropsWithRef<typeof AnimatedText>) => {
    const componentId = useId();
    const styled = useStyledProps(componentId, p.className, p);

    // // const ref = useDualRefs(componentId, p.ref);

    // if (p.style) {
    //   StyleRegistry.updateComponentInlineStyleKeys(
    //     componentId,
    //     getDeepKeys(p.style),
    //   );
    // }

    // return useElement(AnimatedText, styled, {
    //   ...styled.props,
    //   ...p,
    //   ...styled.importantProps,
    //   // ref,
    //   style:
    //     styled.style || styled.importantStyle
    //       ? [styled.style, p.style, styled.importantStyle]
    //       : p.style,
    // });
    console.log("render", styled);

    return <AnimatedText {...p} />;
  },
);

export default Text;
