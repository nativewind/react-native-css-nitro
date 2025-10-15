import { StyleSheet, View } from "react-native";

import { multiply, specificity, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.addStyleSheet({
  s: [
    [
      "text-red-500",
      [
        { s: specificity({ className: 1 }), d: [{ color: "red" }] },
        {
          s: specificity({ className: 2 }),
          d: [{ color: "green" }],
          m: { orientation: ["=", "landscape"] },
        },
      ],
    ],
    [
      "text-[--test]",
      [
        {
          s: specificity({ className: 3 }),
          d: [{ color: ["fn", "var", "test"] }],
          p: { a: true },
        },
      ],
    ],
  ],
});

StyleRegistry.setRootVariables({
  test: [{ v: "pink" }],
});

export default function App() {
  return (
    <View style={styles.container}>
      <Text
        className="text-red-500 text-[--test]"
        onPress={() => {
          console.log("Pressed!");
        }}
      >
        Multiply: {multiply(3, 7)}
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
