import type { ComponentType } from "react";

export function copyComponentProperties<P1, P2>(
  Component: ComponentType<P1>,
  StyledComponent: ComponentType<P2>,
) {
  Object.entries(Component as Record<string, any>).forEach(([key, value]) => {
    // Filter out the keys we don't want to copy
    if (["$$typeof", "render"].includes(key)) {
      return;
    }

    StyledComponent[key as keyof ComponentType<P2>] = value;
  });

  StyledComponent.displayName = Component.displayName;

  return StyledComponent as ComponentType<P1 & P2>;
}

export function getDeepKeys(obj: unknown, keys = new Set<string>()): string[] {
  if (typeof obj !== "object" || !obj) {
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
