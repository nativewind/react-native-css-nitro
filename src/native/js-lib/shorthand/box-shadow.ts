import { createShorthandResolver, type ShorthandResolver } from "./handler";

const color = ["color", "string"] as const;
const offsetX = ["offsetX", "number"] as const;
const offsetY = ["offsetY", "number"] as const;
const blurRadius = ["blurRadius", "number"] as const;
const spreadDistance = ["spreadDistance", "number"] as const;
// const inset = ["inset", "string"] as const;

const handler = createShorthandResolver(
  [
    [offsetX, offsetY, blurRadius, spreadDistance],
    [offsetX, offsetY, blurRadius, spreadDistance, color],
    [color, offsetX, offsetY],
    [color, offsetX, offsetY, blurRadius, spreadDistance],
    [offsetX, offsetY, color],
    [offsetX, offsetY, blurRadius, color],
  ],
  [],
  "object",
);

// function omitTransparentShadows(style: unknown) {
//   if (typeof style === "object" && style && "color" in style) {
//     if (style.color === "#0000" || style.color === "transparent") {
//       return;
//     }
//   }

//   return style;
// }

export const boxShadow: ShorthandResolver = (args) => {
  const result = handler(args);
  return result;
};
