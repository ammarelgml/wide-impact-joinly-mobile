import { useEffect, useRef } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { Dot, Text, colors, font, motion, radius } from '@/ui';

export function joinedLabel(count: number): string {
  return `${count} ${count === 1 ? 'student' : 'students'} joined`;
}

/**
 * T4's live counter. Screen readers hear changes politely, at most once every 5 s, so a burst of
 * joins does not talk over the teacher.
 */
export function LiveCounter({ count, live = true }: { count: number; live?: boolean }) {
  const lastAnnounced = useRef({ count, at: 0 });
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (count === lastAnnounced.current.count) return;
    const announce = () => {
      lastAnnounced.current = { count, at: Date.now() };
      AccessibilityInfo.announceForAccessibility(joinedLabel(count));
    };
    const wait = lastAnnounced.current.at + motion.counterAnnounceThrottle - Date.now();
    if (pending.current) clearTimeout(pending.current);
    if (wait <= 0) announce();
    else pending.current = setTimeout(announce, wait);
  }, [count]);

  useEffect(
    () => () => {
      if (pending.current) clearTimeout(pending.current);
    },
    [],
  );

  return (
    <View style={styles.counter}>
      <Dot color={colors.success} size={10} pulse={live} />
      <Text testID="live-count" style={styles.text}>
        {joinedLabel(count)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  counter: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    gap: 10,
    minHeight: 44,
    paddingHorizontal: 18,
    borderRadius: radius.full,
    backgroundColor: colors.successSoft,
  },
  text: { ...font(600, 18, 24), color: colors.ink, fontVariant: ['tabular-nums'] },
});
