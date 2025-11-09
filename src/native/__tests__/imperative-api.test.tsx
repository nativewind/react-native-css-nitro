import { act, render, screen } from "@testing-library/react-native";
import { View } from "react-native-css-nitro/components/View";

import { specificity, StyleRegistry, testID } from "../js-lib/jest";

test("basic", () => {
  StyleRegistry.setClassname("my-class", [
    { s: specificity({ className: 1 }), d: { color: "red" } },
  ]);

  render(<View testID={testID} className="my-class" />);
  const component = screen.getByTestId(testID);

  expect(component.type).toBe("View");
  expect(component.props.style).toEqual({ color: "red" });
});

test("updates", () => {
  StyleRegistry.setClassname("my-class", [
    { s: specificity({ className: 1 }), d: { color: "red" } },
  ]);

  render(<View testID={testID} className="my-class" />);
  const component = screen.getByTestId(testID);

  expect(component.type).toBe("View");
  expect(component.props.style).toEqual({ color: "red" });

  act(() => {
    StyleRegistry.setClassname("my-class", [
      { s: specificity({ className: 1 }), d: { color: "blue" } },
    ]);
  });

  expect(component.props.style).toEqual({ color: "blue" });
});
