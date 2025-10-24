import { compile } from "../../compiler";

test("nested classes", () => {
  const compiled = compile(`
.my-class .test {
  color: red;
}`);

  expect(compiled.stylesheet()).toStrictEqual({
    s: {
      test: [
        {
          d: {
            color: "#f00",
          },
          s: [0, 0, 0, 0, 0],
          v: {
            "__rn-css-color": "#f00",
          },
          cq: [
            {
              n: "my-class",
            },
          ],
        },
      ],
    },
  });
});
