import { StyleSheet, View } from 'react-native';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, radius, spacing } from './theme';

type Tone = 'info' | 'error' | 'warning' | 'success';

const tones: Record<Tone, { bg: string; fg: string; icon: IconName }> = {
  info: { bg: colors.primarySoft, fg: colors.text, icon: 'information-circle' },
  error: { bg: colors.dangerSoft, fg: colors.danger, icon: 'alert-circle' },
  warning: { bg: colors.warningSoft, fg: colors.warning, icon: 'warning' },
  success: { bg: colors.successSoft, fg: colors.success, icon: 'checkmark-circle' },
};

/** Inline message on the screen where something happened, with an optional next action. */
export function Banner({
  message,
  tone = 'info',
  actionLabel,
  onAction,
  testID,
}: {
  message: string;
  tone?: Tone;
  actionLabel?: string;
  onAction?: () => void;
  testID?: string;
}) {
  const t = tones[tone];
  return (
    <View
      testID={testID}
      style={[styles.base, { backgroundColor: t.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion="polite"
    >
      <View style={styles.row}>
        <Icon name={t.icon} size={20} color={t.fg} />
        <Text
          variant="caption"
          style={[styles.message, { color: tone === 'info' ? colors.text : t.fg }]}
        >
          {message}
        </Text>
      </View>
      {actionLabel && onAction ? (
        <Button label={actionLabel} variant="ghost" onPress={onAction} style={styles.action} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { borderRadius: radius.md, padding: spacing.md, gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm, alignItems: 'flex-start' },
  message: { flex: 1 },
  action: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, minHeight: 40 },
});
