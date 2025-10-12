import type { ViewHandle } from './specs/StyleRegistry/types';

export function copyComponentProperties(Component: any, StyledComponent: any) {
  Object.entries(Component).forEach(([key, value]) => {
    // Filter out the keys we don't want to copy
    if (['$$typeof', 'render'].includes(key)) {
      return;
    }

    StyledComponent[key] = value;
  });

  StyledComponent.displayName = Component.displayName;

  return StyledComponent;
}

export function getDeepKeys(obj: unknown, keys = new Set<string>()): string[] {
  if (typeof obj !== 'object' || !obj) {
    return [];
  }

  if (Array.isArray(obj)) {
    for (const item of obj) {
      getDeepKeys(item, keys);
    }
  } else {
    for (const key of Object.keys(obj)) {
      keys.add(key);
      getDeepKeys((obj as Record<string, unknown>)[key], keys);
    }
  }

  return Array.from(keys);
}

export function findShadowNodeForHandle(handle: ViewHandle) {
  const node =
    handle?.__internalInstanceHandle?.stateNode?.node ??
    handle?.getScrollResponder?.()?.getNativeScrollRef?.()
      ?.__internalInstanceHandle?.stateNode?.node ??
    handle?.getNativeScrollRef?.()?.__internalInstanceHandle?.stateNode?.node ??
    handle?._viewRef?.__internalInstanceHandle?.stateNode?.node ??
    handle?.viewRef?.current?.__internalInstanceHandle?.stateNode?.node ??
    handle?._nativeRef?.__internalInstanceHandle?.stateNode?.node;

  if (
    !node &&
    handle?.props?.horizontal &&
    handle?.constructor?.name === 'FlatList'
  ) {
    throw new Error(
      'react-native-css: detected an unsupported FlatList with the horizontal prop. This will cause crashes on Android due to a bug in React Native core. Read more: https://github.com/facebook/react-native/issues/51601'
    );
  }

  if (!node) {
    throw new Error(
      `react-native-css: Could not find shadow node for one of your components of type ${handle?.constructor?.name ?? 'unknown'}`
    );
  }

  return node;
}
