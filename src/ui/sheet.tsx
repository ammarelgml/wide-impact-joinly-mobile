import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Icon, type IconName } from './icon';
import { Spinner } from './spinner';
import { Text } from './text';
import { colors, motion, radius, space } from './theme';
import { useReducedMotion } from './use-reduced-motion';

/**
 * Bottom sheet for every confirm and chooser: drag handle, 24 dp padding, slides up in 250 ms.
 * Tapping the scrim or pressing system back cancels, except while an action runs (`dismissible`).
 */
export function Sheet({
  visible,
  onClose,
  children,
  dismissible = true,
  testID,
}: {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  dismissible?: boolean;
  testID?: string;
}) {
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const [offset] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!visible) return;
    if (reduced) {
      offset.setValue(0);
      return;
    }
    offset.setValue(1);
    Animated.timing(offset, {
      toValue: 0,
      duration: motion.sheetIn,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [visible, reduced, offset]);

  const cancel = () => {
    if (dismissible) onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={cancel}
    >
      <View style={styles.root}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={cancel}
          accessibilityRole="button"
          accessibilityLabel="Close"
          importantForAccessibility="no"
        />
        <Animated.View
          testID={testID}
          style={[
            styles.sheet,
            { paddingBottom: Math.max(28, insets.bottom + space[3]) },
            {
              transform: [
                { translateY: offset.interpolate({ inputRange: [0, 1], outputRange: [0, 400] }) },
              ],
            },
          ]}
          accessibilityViewIsModal
        >
          <View style={styles.handle} />
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Sheet title: focus lands here when the sheet opens. */
export function SheetTitle({ children }: { children: string }) {
  return (
    <Text variant="headline" accessibilityRole="header">
      {children}
    </Text>
  );
}

/** Large chooser row inside a sheet: icon tile, title, one line of help. */
export function SheetOption({
  icon,
  title,
  caption,
  onPress,
  tone = 'default',
  highlighted = false,
  chevron = false,
  busy = false,
  disabled,
  testID,
}: {
  icon: IconName;
  title: string;
  caption?: string;
  onPress: () => void;
  tone?: 'default' | 'danger';
  /** Tints the icon tile (the fastest path, e.g. Scan QR code). */
  highlighted?: boolean;
  chevron?: boolean;
  /** Shows a spinner at the end while this option's action runs. */
  busy?: boolean;
  disabled?: boolean;
  testID?: string;
}) {
  const fg = tone === 'danger' ? colors.danger : colors.ink;
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      disabled={disabled || busy}
      accessibilityRole="button"
      accessibilityLabel={caption ? `${title}. ${caption}` : title}
      accessibilityState={{ disabled: !!disabled || busy, busy }}
      style={({ pressed }) => [
        styles.option,
        pressed && { backgroundColor: colors.line },
        disabled && !busy && { opacity: 0.5 },
      ]}
    >
      {tone === 'danger' ? (
        <Icon name={icon} color={fg} />
      ) : (
        <View style={[styles.tile, highlighted && { backgroundColor: colors.primarySoft }]}>
          <Icon name={icon} color={highlighted ? colors.onPrimarySoft : colors.ink} />
        </View>
      )}
      <View style={styles.optionText}>
        <Text variant="subhead" style={{ color: fg }}>
          {title}
        </Text>
        {caption ? <Text variant="caption">{caption}</Text> : null}
      </View>
      {busy ? (
        <Spinner />
      ) : chevron ? (
        <Icon name="chevron-forward" size={20} color={colors.ink2} />
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: 'flex-end', backgroundColor: colors.scrim },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: space[5],
    paddingTop: space[2],
    gap: space[3],
  },
  handle: {
    alignSelf: 'center',
    width: 32,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.lineStrong,
    marginBottom: space[2],
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    minHeight: 72,
    paddingVertical: space[3],
    paddingHorizontal: space[4],
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
  },
  tile: {
    width: 48,
    height: 48,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1 },
});
