import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, space } from './theme';

export type StateTone = 'primary' | 'error' | 'success' | 'neutral';

const tones: Record<StateTone, { bg: string; fg: string }> = {
  primary: { bg: colors.primarySoft, fg: colors.onPrimarySoft },
  error: { bg: colors.dangerSoft, fg: colors.danger },
  success: { bg: colors.successSoft, fg: colors.success },
  neutral: { bg: colors.surface2, fg: colors.ink2 },
};

/** Tinted icon tile used by empty, error and success states. */
export function StateIcon({
  icon,
  tone = 'primary',
  size = 72,
}: {
  icon: IconName;
  tone?: StateTone;
  size?: 48 | 56 | 72 | 96;
}) {
  const t = tones[tone];
  const corner = size === 96 ? 32 : size === 72 ? 24 : size === 56 ? 18 : 14;
  const iconSize = size === 96 ? 48 : size === 72 ? 32 : size === 56 ? 28 : 24;
  return (
    <View
      style={[
        styles.tile,
        { width: size, height: size, borderRadius: corner, backgroundColor: t.bg },
      ]}
    >
      <Icon name={icon} size={iconSize} color={t.fg} />
    </View>
  );
}

/**
 * Centred empty, error or "gone" state: icon, title, one line of help. The next action goes in the
 * screen's bottom area, in thumb reach.
 */
export function EmptyState({
  icon,
  tone = 'primary',
  title,
  message,
  testID,
}: {
  icon: IconName;
  tone?: StateTone;
  title: string;
  message?: string;
  testID?: string;
}) {
  return (
    <View style={styles.container} testID={testID}>
      <StateIcon icon={icon} tone={tone} />
      <Text variant="title" align="center" accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text variant="body2" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space[4],
    gap: space[4],
  },
  tile: { alignItems: 'center', justifyContent: 'center' },
  message: { maxWidth: 280 },
});
