import { useMemo } from "react";

export function useStyled(className?: string, style?: any): any {
  return useMemo(() => {
    if (className && style) {
      return [{ $$css: true, className }, style];
    } else if (className) {
      return { $$css: true, className };
    } else if (style) {
      return style;
    } else {
      return undefined;
    }
  }, [className, style]);
}
