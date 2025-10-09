import { Text, View, StyleSheet } from 'react-native';
import { multiply, add, useClassNameMeta } from 'react-native-css-nitro';

export default function App() {
  console.log('App rendered');
  console.log(useClassNameMeta('text-red-500', '0', '0'));
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
