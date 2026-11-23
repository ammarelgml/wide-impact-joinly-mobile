import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, font, motion, radius } from './theme';
import { useReducedMotion } from './use-reduced-motion';

export type PillKind = 'open' | 'closed' | 'expired' | 'role';

const looks: Record<PillKind, { bg: string; fg: string; icon?: IconName }> = {
  open: { bg: colors.successSoft, fg: colors.success },
  closed: { bg: colors.surface2, fg: colors.ink2, icon: 'lock-closed-outline' },
  expired: { bg: colors.warningSoft, fg: colors.warning, icon: 'time-outline' },
  role: { bg: colors.primarySoft, fg: colors.onPrimarySoft },
};

/** Status is always an icon or dot plus words, never colour alone. */
export function StatusPill({
  kind,
  label,
  icon,
  live = false,
  style,
}: {
  kind: PillKind;
  label: string;
  /** Overrides the kind's icon (the role pill uses the role's icon). */
  icon?: IconName;
  /** The open dot pulses on live screens. */
  live?: boolean;
  /** E.g. alignSelf center on a centred screen; the pill hugs the start edge by default. */
  style?: StyleProp<ViewStyle>;
}) {
  const look = looks[kind];
  const iconName = icon ?? look.icon;
  return (
    <View style={[styles.pill, { backgroundColor: look.bg }, style]}>
      {kind === 'open' ? (
        <Dot color={look.fg} pulse={live} />
      ) : iconName ? (
        <Icon name={iconName} size={14} color={look.fg} />
      ) : null}
      <Text style={[styles.label, { color: look.fg }]}>{label}</Text>
    </View>
  );
}

/** Status dot; pulses (1.6 s) when `pulse` is set, and holds still with reduced motion. */
export function Dot({
  color,
  size = 8,
  pulse = false,
}: {
  color: string;
  size?: number;
  pulse?: boolean;
}) {
  const reduced = useReducedMotion();
  const [opacity] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!pulse || reduced) return;
    const half = motion.liveDotPulse / 2;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.5, duration: half, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: half, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => {
      loop.stop();
      opacity.setValue(1);
    };
  }, [pulse, reduced, opacity]);
  return (
    <Animated.View
      style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color, opacity }}
    />
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 28,
    paddingHorizontal: 10,
    borderRadius: radius.full,
  },
  label: font(600, 13, 18),
});
