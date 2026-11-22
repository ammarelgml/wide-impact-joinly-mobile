import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from './icon';
import { Spinner } from './spinner';
import { Text } from './text';
import { colors, elevation, font, radius, size, space } from './theme';

export type ButtonVariant = 'primary' | 'secondary' | 'tonal' | 'text' | 'danger' | 'dangerText';

export type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Busy keeps the button's width and shows a spinner plus a verb-ing label ("Joining…"). */
  busy?: boolean;
  busyLabel?: string;
  disabled?: boolean;
  /** Full width is the default in action areas; `false` sizes the button to its label. */
  fullWidth?: boolean;
  small?: boolean;
  /** Screen-reader label when it should differ from the visible label. */
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

type Look = { bg: string; pressed: string; fg: string; border?: string };

const looks: Record<ButtonVariant, Look> = {
  primary: { bg: colors.primary, pressed: colors.primaryPressed, fg: colors.onPrimary },
  secondary: {
    bg: colors.surface,
    pressed: colors.surface2,
    fg: colors.ink,
    border: colors.lineStrong,
  },
  tonal: { bg: colors.primarySoft, pressed: colors.surface2, fg: colors.onPrimarySoft },
  text: { bg: 'transparent', pressed: colors.primarySoft, fg: colors.primary },
  danger: { bg: colors.danger, pressed: colors.danger, fg: colors.onDanger },
  dangerText: { bg: 'transparent', pressed: colors.dangerSoft, fg: colors.danger },
};

const isText = (v: ButtonVariant) => v === 'text' || v === 'dangerText';

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  busy = false,
  busyLabel,
  disabled = false,
  fullWidth = true,
  small = false,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: ButtonProps) {
  const look = looks[variant];
  // Disabled and busy both use the quiet fill, so a busy button reads as "working", not as an action.
  const off = disabled || busy;
  const fg = off ? colors.ink2 : look.fg;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={off}
      accessibilityRole="button"
      accessibilityLabel={busy && busyLabel ? busyLabel : (accessibilityLabel ?? label)}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: off, busy }}
      style={({ pressed }) => [
        styles.base,
        small && styles.small,
        !fullWidth && styles.auto,
        {
          backgroundColor: off
            ? isText(variant)
              ? 'transparent'
              : colors.surface2
            : pressed
              ? look.pressed
              : look.bg,
          borderColor: !off && look.border ? look.border : 'transparent',
        },
        variant === 'danger' && pressed && !off ? styles.dangerPressed : null,
        style,
      ]}
    >
      <View style={styles.content}>
        {busy ? <Spinner color={fg} /> : icon ? <Icon name={icon} size={20} color={fg} /> : null}
        <Text style={[small ? styles.labelSmall : styles.label, { color: fg }]} numberOfLines={1}>
          {busy && busyLabel ? busyLabel : label}
        </Text>
      </View>
    </Pressable>
  );
}

/** Extended FAB: the primary action on the T1 and P1 lists, 16 dp from the end and bottom edges. */
export function ExtendedFab({
  label,
  icon,
  onPress,
  disabled,
  bottomInset = 0,
  testID,
}: {
  label: string;
  icon: IconName;
  onPress: () => void;
  disabled?: boolean;
  bottomInset?: number;
  testID?: string;
}) {
  return (
    <Button
      testID={testID}
      label={label}
      icon={icon}
      onPress={onPress}
      disabled={disabled}
      fullWidth={false}
      style={[styles.fab, { bottom: 28 + bottomInset }, !disabled && elevation.fab]}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: size.button,
    borderRadius: radius.md,
    borderWidth: 1.5,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignSelf: 'stretch',
  },
  small: { minHeight: size.buttonSmall, paddingHorizontal: space[4] },
  auto: { alignSelf: 'auto' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space[2],
  },
  label: font(600, 16, 20),
  labelSmall: font(600, 15, 20),
  dangerPressed: { opacity: 0.88 },
  fab: {
    position: 'absolute',
    end: space[4],
    minHeight: size.fab,
    borderRadius: radius.lg,
    paddingStart: space[4],
    paddingEnd: 20,
  },
});
