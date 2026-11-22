import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, elevation, fonts, motion, radius, space } from './theme';

/** Short-lived message over content (3 s), e.g. "That's not a Joinly code" on the scanner. */
export function Toast({
  message,
  onHide,
  icon = 'information-circle-outline',
  light = false,
  bottom = 140,
  durationMs = motion.toast,
}: {
  message: string | null;
  onHide: () => void;
  icon?: IconName;
  /** Light toast for the dark camera screen. */
  light?: boolean;
  bottom?: number;
  durationMs?: number;
}) {
  const [opacity] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!message) return;
    Animated.timing(opacity, { toValue: 1, duration: 150, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 150, useNativeDriver: true }).start(onHide);
    }, durationMs);
    return () => clearTimeout(id);
  }, [message, durationMs, onHide, opacity]);

  if (!message) return null;
  const bg = light ? colors.onInverse : colors.inverse;
  const fg = light ? colors.ink : colors.onInverse;
  return (
    <Animated.View
      style={[styles.toast, { opacity, bottom, backgroundColor: bg }]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <Icon name={icon} size={20} color={fg} />
      <Text style={[styles.text, { color: fg }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    start: space[4],
    end: space[4],
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    borderRadius: radius.md,
    paddingHorizontal: space[4],
    paddingVertical: 14,
    ...elevation.toast,
  },
  text: { flex: 1, fontFamily: fonts[500], fontSize: 14, lineHeight: 20 },
});
