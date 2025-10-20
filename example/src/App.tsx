import { StyleSheet, View } from "react-native";

import { multiply, specificity, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.addStyleSheet({
  s: [
    [
      "text-red-500",
      [
        {
          s: specificity({ className: 1, important: 1 }),
          d: [
            {
              color: "green",
            },
          ],
        },
        {
          s: specificity({ className: 2 }),
          d: [
            {
              color: "red",
              // transitionProperty: "color",
              // transitionDuration: "5s",
            },
            {
              selectionColor: "blue",
            },
          ],
        },
        // {
        //   s: specificity({ className: 4 }),
        //   d: [{ color: ["fn", "var", "my-custom-color"] }, { color: "blue" }],
        //   aq: { a: [["true", "disabled"]] },
        // },
      ],
    ],
  ],
});

// StyleRegistry.setRootVariables({
//   "my-custom-color": ["fn", "var", "second-color"],
//   "second-color": "green",
// });

export default function App() {
  return (
    <View style={styles.container}>
      <Text className="text-red-500" style={{ fontSize: 30 }} selectable>
        Multiply17: {multiply(3, 7)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
