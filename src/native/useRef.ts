import { useCallback } from 'react';
import { findShadowNodeForHandle } from '../utils';
import type { ViewHandle } from '../specs/StyleRegistry/types';
import { StyleRegistry } from '../specs/StyleRegistry';

export function useRef(componentId: string, existingRef?: any): any {
  return useCallback(
    (handle: ViewHandle | null) => {
      if (existingRef) {
        return typeof existingRef === 'function'
          ? existingRef(handle)
          : (existingRef.current = handle);
      }

      if (handle) {
        StyleRegistry.linkComponent(
          componentId,
          findShadowNodeForHandle(handle)
        );
      }

      return () => StyleRegistry.unlinkComponent(componentId);
    },
    [existingRef, componentId]
  );
}
