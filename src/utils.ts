export function copyComponentProperties(Component: any, StyledComponent: any) {
  Object.entries(Component).forEach(([key, value]) => {
    // Filter out the keys we don't want to copy
    if (["$$typeof", "render"].includes(key)) {
      return;
    }

    StyledComponent[key] = value;
  });

  StyledComponent.displayName = Component.displayName;

  return StyledComponent;
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
