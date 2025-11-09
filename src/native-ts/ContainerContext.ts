/**
 * ContainerContext: Container context management for layout tracking
 * Converted from cpp/ContainerContext.cpp
 */

import type { GetProxy } from "./Effect";
import { Observable } from "./Observable";

interface LayoutBounds {
  x: Observable<number>;
  y: Observable<number>;
  width: Observable<number>;
  height: Observable<number>;
}

interface ScopeHierarchy {
  parent: string;
  names: Set<string>;
}

// Replace static-only class with a module-level singleton object (closure over private maps)
const layoutMap = new Map<string, LayoutBounds>();
const scopeMap = new Map<string, ScopeHierarchy>();

export const ContainerContext = {
  findInScope(containerScope: string, name?: string): string | undefined {
    if (!name) {
      return containerScope;
    }
    const hierarchy = scopeMap.get(containerScope);
    if (!hierarchy) {
      return undefined;
    }
    if (hierarchy.names.has(name)) {
      return containerScope;
    }
    if (hierarchy.parent && hierarchy.parent !== "root") {
      return this.findInScope(hierarchy.parent, name);
    }
    return undefined;
  },

  setScope(containerScope: string, parent: string, names: Set<string>): void {
    scopeMap.set(containerScope, { parent, names });
  },

  getX(
    containerScope: string,
    name: string | undefined,
    get: GetProxy,
  ): number | undefined {
    const foundKey = this.findInScope(containerScope, name);
    if (!foundKey) return undefined;
    const bounds = layoutMap.get(foundKey);
    if (!bounds) return undefined;
    return get(bounds.x);
  },

  getY(
    containerScope: string,
    name: string | undefined,
    get: GetProxy,
  ): number | undefined {
    const foundKey = this.findInScope(containerScope, name);
    if (!foundKey) return undefined;
    const bounds = layoutMap.get(foundKey);
    if (!bounds) return undefined;
    return get(bounds.y);
  },

  getWidth(
    containerScope: string,
    name: string | undefined,
    get: GetProxy,
  ): number | undefined {
    const foundKey = this.findInScope(containerScope, name);
    if (!foundKey) return undefined;
    const bounds = layoutMap.get(foundKey);
    if (!bounds) return undefined;
    return get(bounds.width);
  },

  getHeight(
    containerScope: string,
    name: string | undefined,
    get: GetProxy,
  ): number | undefined {
    const foundKey = this.findInScope(containerScope, name);
    if (!foundKey) return undefined;
    const bounds = layoutMap.get(foundKey);
    if (!bounds) return undefined;
    return get(bounds.height);
  },

  setLayout(
    key: string,
    x: number,
    y: number,
    width: number,
    height: number,
  ): void {
    let bounds = layoutMap.get(key);
    if (!bounds) {
      bounds = {
        x: Observable.create(x),
        y: Observable.create(y),
        width: Observable.create(width),
        height: Observable.create(height),
      };
      layoutMap.set(key, bounds);
    } else {
      bounds.x.set(x);
      bounds.y.set(y);
      bounds.width.set(width);
      bounds.height.set(height);
    }
  },
};
