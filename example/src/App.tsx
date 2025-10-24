import { StyleSheet, View } from "react-native";

import { multiply, specificity, StyleRegistry } from "react-native-css-nitro";
import { Text } from "react-native-css-nitro/components/Text";

StyleRegistry.addStyleSheet({
  s: {
    "text-red-500": [
      {
        s: specificity({ className: 1 }),
        d: {
          color: "blue",
        },
      },
    ],
  },
});

export default function App() {
  return (
    <View style={styles.container}>
      <Text className="text-red-500" style={{ fontSize: 30 }}>
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
