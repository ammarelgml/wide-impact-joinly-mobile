import { Pressable, StyleSheet, View } from 'react-native';

import { Text } from './text';
import { colors, radius, space } from './theme';

/** The design's switch: 52 × 32, thumb grows when on. Announced as a switch with its state. */
export function Switch({
  value,
  onValueChange,
  label,
  disabled,
  testID,
}: {
  value: boolean;
  onValueChange: (next: boolean) => void;
  label: string;
  disabled?: boolean;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value, disabled: !!disabled }}
      hitSlop={8}
      style={[styles.track, value ? styles.trackOn : styles.trackOff, disabled && styles.disabled]}
    >
      <View style={[styles.thumb, value ? styles.thumbOn : styles.thumbOff]} />
    </Pressable>
  );
}

/** Settings row with a title, a subtitle that states the effect, and a switch. */
export function SwitchRow({
  title,
  subtitle,
  value,
  onValueChange,
  disabled,
  bare = false,
  testID,
}: {
  title: string;
  subtitle?: string;
  value: boolean;
  onValueChange: (next: boolean) => void;
  disabled?: boolean;
  /** Without the card edge (landscape invite). */
  bare?: boolean;
  testID?: string;
}) {
  return (
    <View style={[styles.row, !bare && styles.card]}>
      <View style={styles.text}>
        <Text variant={bare ? 'label' : 'subhead'}>{title}</Text>
        {subtitle ? <Text variant="caption">{subtitle}</Text> : null}
      </View>
      <Switch
        testID={testID}
        value={value}
        onValueChange={onValueChange}
        label={title}
        disabled={disabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  card: {
    minHeight: 72,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
  },
  text: { flex: 1 },
  track: { width: 52, height: 32, borderRadius: radius.full, justifyContent: 'center' },
  trackOn: { backgroundColor: colors.primary },
  trackOff: { backgroundColor: colors.surface2, borderWidth: 2, borderColor: colors.lineStrong },
  disabled: { opacity: 0.5 },
  thumb: { position: 'absolute', borderRadius: radius.full },
  thumbOn: { width: 24, height: 24, start: 24, backgroundColor: colors.onPrimary },
  thumbOff: { width: 16, height: 16, start: 6, backgroundColor: colors.lineStrong },
});
