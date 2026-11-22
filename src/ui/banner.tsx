import { StyleSheet, View } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, fonts, radius, space } from './theme';

export type BannerTone = 'info' | 'error' | 'warning' | 'success';

const tones: Record<BannerTone, { bg: string; icon: IconName; iconColor: string }> = {
  info: {
    bg: colors.primarySoft,
    icon: 'information-circle-outline',
    iconColor: colors.onPrimarySoft,
  },
  error: { bg: colors.dangerSoft, icon: 'alert-circle-outline', iconColor: colors.danger },
  warning: { bg: colors.warningSoft, icon: 'warning-outline', iconColor: colors.warning },
  success: { bg: colors.successSoft, icon: 'checkmark-circle-outline', iconColor: colors.success },
};

/**
 * Inline message that stays until the problem is fixed. An optional bold `lead` states what
 * happened; `message` says what to do. Errors announce assertively, the rest politely.
 */
export function Banner({
  tone = 'info',
  lead,
  message,
  icon,
  testID,
}: {
  tone?: BannerTone;
  lead?: string;
  message?: string;
  icon?: IconName;
  testID?: string;
}) {
  const t = tones[tone];
  return (
    <View
      testID={testID}
      style={[styles.base, { backgroundColor: t.bg }]}
      accessibilityRole={tone === 'error' ? 'alert' : undefined}
      accessibilityLiveRegion={tone === 'error' ? 'assertive' : 'polite'}
    >
      <Icon name={icon ?? t.icon} size={20} color={t.iconColor} />
      <Text style={styles.message}>
        {lead ? <Text style={styles.lead}>{lead}</Text> : null}
        {lead && message ? ' ' : null}
        {message}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    gap: space[3],
    alignItems: 'flex-start',
    paddingVertical: space[3],
    paddingHorizontal: 14,
    borderRadius: radius.md,
  },
  message: { flex: 1, fontFamily: fonts[500], fontSize: 14, lineHeight: 20, color: colors.ink },
  lead: { fontFamily: fonts[700] },
});
