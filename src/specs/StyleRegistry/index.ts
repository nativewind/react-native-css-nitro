import { processColor } from 'react-native';
import { NitroModules } from 'react-native-nitro-modules';
import type { HybridStyleRegistry } from './HybridStyleRegistry.nitro';

export const StyleRegistry =
  NitroModules.createHybridObject<HybridStyleRegistry>('HybridStyleRegistry');

// const { width, height, scale, fontScale } = Dimensions.get('window');
// StyleRegistry.setWindowDimensions(width, height, scale, fontScale);
// Dimensions.addEventListener('change', ({ window }) => {
//   StyleRegistry.setWindowDimensions(
//     window.width,
//     window.height,
//     window.scale,
//     window.fontScale
//   );
// });

StyleRegistry.registerExternalMethods({
  processColor,
});
