import { ActivityIndicator, Pressable, StyleSheet, View, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, radius, spacing, touchTarget } from './theme';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'dangerGhost';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: Variant;
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  /** Screen-reader label when it should differ from the visible label. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: ViewStyle;
  testID?: string;
};

const palette: Record<Variant, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary },
  secondary: {
    bg: colors.surface,
    pressed: colors.surfaceMuted,
    fg: colors.text,
    border: colors.border,
  },
  ghost: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary },
  danger: { bg: colors.danger, pressed: colors.dangerPressed, fg: colors.onPrimary },
  dangerGhost: { bg: 'transparent', pressed: colors.dangerSoft, fg: colors.danger },
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const p = palette[variant];
  const inactive = disabled || loading;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={inactive}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: inactive, busy: loading }}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: pressed ? p.pressed : p.bg,
          borderColor: p.border ?? 'transparent',
          opacity: disabled && !loading ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator color={p.fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={20} color={p.fg} /> : null}
            <Text variant="bodyStrong" style={{ color: p.fg }}>
              {label}
            </Text>
          </>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: touchTarget + 4,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.xl,
    justifyContent: 'center',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
});
