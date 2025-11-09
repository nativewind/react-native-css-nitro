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
            "___css-color___": "#f00",
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
