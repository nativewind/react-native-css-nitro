import { Text as RNText, type TextProps } from 'react-native';
import { copyComponentProperties } from '../../utils';

export const Text = copyComponentProperties(RNText, (props: TextProps) => {
  return <RNText {...props} />;
});
