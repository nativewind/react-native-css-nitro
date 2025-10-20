import { StyleSheet, View } from "react-native";

import { multiply, specificity, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.addStyleSheet({
  s: [
    [
      "text-red-500",
      [
        {
          s: specificity({ className: 1 }),
          v: {
            "my-custom-color": "green",
          },
          d: [
            {
              color: ["fn", "var", "my-custom-color", "blue"],
              animationName: "spin",
              animationDuration: "1s",
              animationIterationCount: "infinite",
            },
          ],
        },
      ],
    ],
  ],
});

StyleRegistry.setKeyframes("spin", {
  "0%": {
    rotate: "0deg",
  },
  "100%": {
    rotate: "360deg",
  },
});

StyleRegistry.setRootVariables({
  "my-custom-color": [{ v: ["fn", "var", "second-color", "green"] }],
  "second-color": [{ v: "purple" }],
});

export default function App() {
  return (
    <View style={styles.container}>
      <Text className="text-red-500" style={{ fontSize: 30 }} selectable>
        Multiply28: {multiply(3, 7)}
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
