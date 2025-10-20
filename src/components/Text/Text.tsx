import { Text as RNText, type TextProps } from "react-native";

import { copyComponentProperties } from "../../utils";
import { useStyled } from "../../web/useStyled";

export const Text = copyComponentProperties(
  RNText,
  ({ className, style, ...props }: TextProps & { className?: string }) => {
    const nextStyle = useStyled(className, style);
    return <RNText {...props} style={nextStyle} />;
  },
);
