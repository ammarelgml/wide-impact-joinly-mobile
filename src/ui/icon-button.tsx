import { Pressable, StyleSheet } from 'react-native';

import { Icon, type IconName } from './icon';
import { colors, radius, size } from './theme';

/** 48 dp target with a 24 dp icon. Icon-only, so a screen-reader label is required. */
export function IconButton({
  icon,
  label,
  onPress,
  color = colors.ink,
  tonal = false,
  disabled,
  selected,
  style,
  testID,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  color?: string;
  tonal?: boolean;
  disabled?: boolean;
  /** For toggles such as the torch: announced as pressed. */
  selected?: boolean;
  style?: object;
  testID?: string;
}) {
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={selected === undefined ? 'button' : 'togglebutton'}
      accessibilityLabel={label}
      accessibilityState={{ disabled: !!disabled, checked: selected }}
      style={({ pressed }) => [
        styles.base,
        tonal && { backgroundColor: colors.surface2 },
        pressed && { backgroundColor: tonal ? colors.line : colors.surface2 },
        disabled && { opacity: 0.5 },
        style,
      ]}
    >
      <Icon name={icon} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.touchTarget,
    height: size.touchTarget,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
