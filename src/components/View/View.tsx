import { View as RNView, type ViewProps } from "react-native";

import { copyComponentProperties } from "../../utils";
import { useStyled } from "../../web/useStyled";

export const View = copyComponentProperties(
  RNView,
  ({ className, style, ...props }: ViewProps) => {
    const nextStyle = useStyled(className, style);
    return <RNView {...props} style={nextStyle} />;
  },
);
