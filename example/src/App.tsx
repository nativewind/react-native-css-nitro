import { useId } from 'react';
import { Text, View, StyleSheet } from 'react-native';
import {
  multiply,
  add,
  useStyled,
  StyleRegistry,
} from 'react-native-css-nitro';

StyleRegistry.set('text-red-500', { s: [], d: [{ color: 'red' }] });

export default function App() {
  console.log('App rendered');
  const componentId = useId();
  console.log(useStyled(componentId, 'text-red-500', {}));
  return (
    <View style={styles.container}>
      <Text>Multiply: {multiply(3, 7)}</Text>
      <Text>Add: {add(3, 7)}</Text>
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
