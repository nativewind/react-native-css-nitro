import { useCallback } from "react";

import { StyleRegistry } from "../specs/StyleRegistry";

export function useDualRefs(componentId: string, existingRef?: any): any {
  return useCallback(
    (handle: { __nativeTag?: number } | null) => {
      if (existingRef) {
        return typeof existingRef === "function"
          ? existingRef(handle)
          : (existingRef.current = handle);
      }

      if (handle?.__nativeTag) {
        StyleRegistry.linkComponent(componentId, handle.__nativeTag);
      }

      return () => {
        StyleRegistry.unlinkComponent(componentId);
      };
    },
    [existingRef, componentId],
  );
}
