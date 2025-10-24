import type {
  AnimationIterationCount,
  EasingFunction as CSSEasingFunction,
} from "lightningcss";

export function parseIterationCount(
  value: AnimationIterationCount[],
): (number | "infinite")[] {
  return value.map((value) => {
    return value.type === "infinite" ? value.type : value.value;
  });
}

export function parseEasingFunction(value: CSSEasingFunction[]) {
  const easingFn = value.map((value) => {
    switch (value.type) {
      case "linear":
      case "ease":
      case "ease-in":
      case "ease-out":
      case "ease-in-out":
        return value.type;
      case "cubic-bezier":
        return [
          {},
          "cubicBezier",
          [value.x1, value.y1, value.x2, value.y2],
        ] as const;
      case "steps":
        return [{}, "steps", [value.count, value.position?.type]] as const;
    }
  });

  if (easingFn.length === 1) {
    return easingFn[0];
  }
  return easingFn;
}
