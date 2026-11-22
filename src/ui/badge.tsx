import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, radius, spacing } from './theme';

type Tone = 'neutral' | 'success' | 'warning' | 'primary';

const tones: Record<Tone, { bg: string; fg: string }> = {
  neutral: { bg: colors.surfaceMuted, fg: colors.textMuted },
  success: { bg: colors.successSoft, fg: colors.success },
  warning: { bg: colors.warningSoft, fg: colors.warning },
  primary: { bg: colors.primarySoft, fg: colors.primary },
};

/** A status pill. Always text plus an optional icon, never colour alone. */
export function Badge({
  label,
  tone = 'neutral',
  icon,
}: {
  label: string;
  tone?: Tone;
  icon?: IconName;
}) {
  const t = tones[tone];
  return (
    <View style={[styles.base, { backgroundColor: t.bg }]}>
      {icon ? <Icon name={icon} size={14} color={t.fg} /> : null}
      <Text variant="label" style={{ color: t.fg, fontSize: 13, lineHeight: 18 }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xxs,
    borderRadius: radius.pill,
  },
});
