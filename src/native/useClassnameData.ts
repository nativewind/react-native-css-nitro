import { useId, useState, type RefObject } from 'react';
import { HybridStyleRegistry } from '../specs/StyleRegistry';
import type {
  BaseStyleConfig,
  StyleConfig,
} from '../specs/StyleRegistry/StyleRegistry.nitro';
import type { AnyMap } from 'react-native-nitro-modules';
import type { ViewHandle } from '../specs/StyleRegistry/types';

export function useClassnames(
  classNames: string,
  variableContext: number,
  containerContext: number,
  configs: BaseStyleConfig[] = [],
  originalProps: Record<string, unknown> = {}
) {
  const id = useId();
  const [rerender, setState] = useState<() => void>(
    () => () => setState(() => () => undefined)
  );

  const data = HybridStyleRegistry.registerComponent(
    id,
    classNames,
    variableContext,
    containerContext,
    configs.map((config) => getStyleConfig(config, originalProps)),
    () => {
      return false;
    }
  );

  const ref = (elementRef: RefObject<ViewHandle>) => {
    const subscriptionId = HybridStyleRegistry.subscribeComponentRef(
      id,
      findShadowNodeForHandle(elementRef.current),
      rerender
    );
    return () => HybridStyleRegistry.unsubscribeComponentRef(subscriptionId);
  };

  return [data, ref];
}

function getStyleConfig(
  base: BaseStyleConfig,
  props: Record<string, unknown> | undefined
): StyleConfig {
  const paths = base[1];
  const lastPath = paths.pop();

  let target: Record<string, unknown> | undefined;

  if (lastPath) {
    if (props) {
      target = props;
      for (const path of paths) {
        target = target[path] as Record<string, unknown> | undefined;
        if (!target) {
          break;
        }
      }
      target = target?.[lastPath] as Record<string, unknown> | undefined;
    }
  }

  return [base[0], base[1], target as AnyMap | undefined, base[2]];
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
