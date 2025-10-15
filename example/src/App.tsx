import { StyleSheet, View } from "react-native";

import { multiply, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.addStyleSheet({
  s: [
    [
      "text-red-500",
      [
        { s: [], d: [{ color: "red" }] },
        {
          s: [],
          d: [{ color: "green" }],
          m: { orientation: ["=", "landscape"] },
        },
        { s: [], d: [{ color: ["fn", "var", "test", "yellow"] }] },
      ],
    ],
  ],
});

export default function App() {
  return (
    <View style={styles.container}>
      <Text
        className="text-red-500"
        onPress={() => {
          console.log("Pressed!");
          StyleRegistry.setRootVariables({
            test: [{ v: "pink", m: { orientation: ["=", "landscape"] } }],
          });
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
