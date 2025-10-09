import { useId, useState, type RefObject } from 'react';
import { HybridStyleRegistry } from '../specs/StyleRegistry';
import type { StyleConfig } from '../specs/StyleRegistry/StyleRegistry.nitro';
import type { ViewHandle } from '../specs/StyleRegistry/types';

export function useClassNameMeta(
  classNames: string,
  variableContext: string,
  containerContext: string,
  _originalProps: Record<string, unknown> = {},
  configs: StyleConfig[] = [['className', ['style'], []]]
) {
  const componentId = useId();
  const [rerender, setState] = useState<() => void>(
    () => () => setState(() => () => undefined)
  );

  const data = HybridStyleRegistry.registerComponent(
    componentId,
    classNames,
    variableContext,
    containerContext,
    configs,
    () => {
      return false;
    }
  );

  const ref = (elementRef: RefObject<ViewHandle>) => {
    const subscriptionId = HybridStyleRegistry.link(
      componentId,
      findShadowNodeForHandle(elementRef.current),
      rerender
    );
    return () => HybridStyleRegistry.unlink(subscriptionId);
  };

  return [data, ref];
}

function findShadowNodeForHandle(handle: ViewHandle) {
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
