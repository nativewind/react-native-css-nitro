/**
 * Environment: Window dimensions tracking
 * Converted from cpp/Environment.cpp
 */

import { Observable } from "./Observable";

const EnvironmentState = (() => {
  const widthObs = Observable.create(0);
  const heightObs = Observable.create(0);
  const scaleObs = Observable.create(0);
  const fontScaleObs = Observable.create(0);

  return {
    windowWidth(): Observable<number> {
      return widthObs;
    },

    windowHeight(): Observable<number> {
      return heightObs;
    },

    windowScale(): Observable<number> {
      return scaleObs;
    },

    windowFontScale(): Observable<number> {
      return fontScaleObs;
    },

    setWindowDimensions(
      width: number,
      height: number,
      scale: number,
      fontScale: number,
    ): void {
      widthObs.set(width);
      heightObs.set(height);
      scaleObs.set(scale);
      fontScaleObs.set(fontScale);
    },
  };
})();

export const env = EnvironmentState;
