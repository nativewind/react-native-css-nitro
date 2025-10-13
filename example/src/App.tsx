import { View, StyleSheet, processColor } from 'react-native';
import { multiply, StyleRegistry } from 'react-native-css-nitro';
import { Text } from 'react-native-css-nitro/components/Text';

// StyleRegistry.set('text-red-500', { s: [], d: [{ color: 4278190335 }] });
StyleRegistry.set('text-red-500', { s: [], d: [{ color: 'red' }] });

console.log({ red: processColor('red') });

export default function App() {
  return (
    <View style={styles.container}>
      <Text
        className="text-red-500"
        onPress={() => {
          console.log('Pressed!');
          StyleRegistry.set('text-red-500', { s: [], d: [{ fontSize: 30 }] });
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
    alignItems: 'center',
    justifyContent: 'center',
  },
});
