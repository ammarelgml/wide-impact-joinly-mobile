import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from './icon';
import { colors, radius, touchTarget } from './theme';

export function IconButton({
  icon,
  label,
  onPress,
  color = colors.text,
  disabled,
}: {
  icon: IconName;
  /** Required: icon-only buttons need a screen-reader label. */
  label: string;
  onPress: () => void;
  color?: string;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={4}
      style={({ pressed }) => [styles.base, pressed && { backgroundColor: colors.surfaceMuted }]}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: touchTarget,
    height: touchTarget,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
