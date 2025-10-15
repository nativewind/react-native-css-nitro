import { useId } from "react";
import { Text as RNText, type TextProps } from "react-native";

import { useRef } from "../../native/useRef";
import { useStyledProps } from "../../native/useStyled";
import { StyleRegistry } from "../../specs/StyleRegistry";
import { copyComponentProperties, getDeepKeys } from "../../utils";

export const Text = copyComponentProperties(RNText, (props: TextProps) => {
  const componentId = useId();

  const style = useStyledProps(
    componentId,
    (props as Record<string, string>).className,
    props,
  );

  const ref = useRef(componentId, (props as Record<string, any>).ref);

  if (props.style) {
    StyleRegistry.updateComponentInlineStyleKeys(
      componentId,
      getDeepKeys(props.style),
    );
  }

  return (
    <RNText
      {...style.props}
      {...props}
      {...style.importantProps}
      ref={ref}
      style={
        style.style || style.importantStyle
          ? [style.style, props.style, style.importantStyle]
          : props.style
      }
    />
  );
});

export default Text;
