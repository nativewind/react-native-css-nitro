import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

import { compile } from "../../compiler";

test("tailwind", async () => {
  const css = `@import "tailwindcss";
  @source inline("text-red-500");
  `;

  const { css: output } = await postcss([
    /* Tailwind seems to internally cache things, so we need a random value to cache bust */
    tailwind({ base: Date.now().toString() }),
  ]).process(css, {
    from: __dirname,
  });

  const compiled = compile(output);

  expect(compiled.stylesheet()).toStrictEqual({
    s: {
      "text-red-500": [
        {
          d: {
            color: "#fb2c36",
          },
          s: [0, 0, 0, 0, 0],
          v: {
            "___css-color___": "#fb2c36",
          },
        },
      ],
    },
  });
});
