import { StyleSheet, View } from "react-native";

import { multiply, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.set("text-red-500", [
  { s: [], d: [{ color: "red" }] },
  { s: [], d: [{ color: "green" }], m: { orientation: ["=", "landscape"] } },
  { s: [], d: [{ color: ["fn", "test", []] }] },
]);

export default function App() {
  return (
    <View style={styles.container}>
      <Text
        className="text-red-500"
        onPress={() => {
          console.log("Pressed!");
          StyleRegistry.set("text-red-500", [
            {
              s: [],
              d: [{ color: "blue", fontSize: 40 }],
            },
          ]);
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
