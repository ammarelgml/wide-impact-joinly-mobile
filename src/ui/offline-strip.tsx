import { StyleSheet, View } from 'react-native';

import { useIsOffline } from '@/lib/network';

import { Icon } from './icon';
import { Text } from './text';
import { colors, fonts, space } from './theme';

export const OFFLINE_MESSAGE = "You're offline. Showing what was last loaded.";

/** Dark strip under the app bar while offline. Actions that need the network are disabled, and this says why. */
export function OfflineStrip({ message = OFFLINE_MESSAGE }: { message?: string }) {
  const offline = useIsOffline();
  if (!offline) return null;
  return (
    <View
      style={styles.strip}
      testID="offline-strip"
      accessibilityRole="text"
      accessibilityLiveRegion="polite"
    >
      <Icon name="cloud-offline-outline" size={20} color={colors.onInverse} />
      <Text style={styles.text}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 44,
    paddingVertical: 10,
    paddingHorizontal: space[4],
    backgroundColor: colors.inverse,
  },
  text: { flex: 1, fontFamily: fonts[500], fontSize: 14, lineHeight: 20, color: colors.onInverse },
});
