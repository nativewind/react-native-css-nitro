import { useId } from "react";
import { View as RNView, type ViewProps } from "react-native";

import { useRef } from "../../native/useRef";
import { useStyled } from "../../native/useStyled";
import { StyleRegistry } from "../../specs/StyleRegistry";
import { copyComponentProperties, getDeepKeys } from "../../utils";

export const View = copyComponentProperties(RNView, (props: ViewProps) => {
  const componentId = useId();

  const style = useStyled(
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
    <RNView
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

export default View;
