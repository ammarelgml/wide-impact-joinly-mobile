import { useEffect, useState, type ReactNode } from 'react';
import { Animated, StyleSheet, View, type DimensionValue } from 'react-native';

import { colors, motion, radius } from './theme';
import { useReducedMotion } from './use-reduced-motion';

/** Placeholder block that pulses (1.4 s). Hidden from screen readers; the container says "Loading". */
export function SkeletonBlock({
  width = '100%',
  height = 16,
  rounded = radius.sm,
}: {
  width?: DimensionValue;
  height?: number;
  rounded?: number;
}) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (reduced) return;
    const half = motion.skeletonPulse / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: half, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: half, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduced]);
  return (
    <Animated.View
      style={[styles.block, { width, height, borderRadius: rounded, opacity }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
}

/** Wraps a skeleton layout: announced once as "Loading", its blocks hidden. */
export function Loading({ children, gap = 12 }: { children: ReactNode; gap?: number }) {
  return (
    <View accessible accessibilityLabel="Loading" accessibilityRole="progressbar" style={{ gap }}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.skeleton },
});
