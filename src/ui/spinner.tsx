import { ActivityIndicator } from 'react-native';

import { colors } from './theme';

/** Progress spinner. 18 dp inline (buttons, status lines), 32 dp for block states. */
export function Spinner({ color = colors.primary, large }: { color?: string; large?: boolean }) {
  return <ActivityIndicator color={color} size={large ? 32 : 18} />;
}
