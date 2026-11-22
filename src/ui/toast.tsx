import { useEffect, useState } from 'react';
import { Animated, StyleSheet } from 'react-native';

import { Text } from './text';
import { colors, radius, spacing } from './theme';

/** Short-lived message over content, e.g. "This isn't a Joinly code" on the scanner. */
export function Toast({
  message,
  onHide,
  durationMs = 2500,
}: {
  message: string | null;
  onHide: () => void;
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
  return (
    <Animated.View
      style={[styles.toast, { opacity }]}
      accessibilityLiveRegion="assertive"
      accessibilityRole="alert"
    >
      <Text variant="label" tone="onPrimary" align="center">
        {message}
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    alignSelf: 'center',
  },
});
