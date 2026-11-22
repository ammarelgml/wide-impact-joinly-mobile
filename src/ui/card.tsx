import { Children, Fragment, type ReactNode } from 'react';
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, space } from './theme';

/** Flat surface with a 1 dp line edge. Pressable when given onPress. */
export function Card({
  children,
  onPress,
  accessibilityLabel,
  accessibilityHint,
  style,
  testID,
}: {
  children: ReactNode;
  onPress?: () => void;
  accessibilityLabel?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
  testID?: string;
}) {
  if (!onPress) {
    return (
      <View testID={testID} style={[styles.card, style]}>
        {children}
      </View>
    );
  }
  return (
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityHint={accessibilityHint}
      style={({ pressed }) => [styles.card, pressed && styles.pressed, style]}
    >
      {children}
    </Pressable>
  );
}

/** A grouped list (roster): one card edge, rows divided by 1 dp lines. */
export function ListGroup({ children }: { children: ReactNode }) {
  const rows = Children.toArray(children);
  return (
    <View style={styles.list}>
      {rows.map((row, i) => (
        <Fragment key={i}>
          {i > 0 ? <View style={styles.divider} /> : null}
          {row}
        </Fragment>
      ))}
    </View>
  );
}

/** 1 dp rule inside a card. */
export function Divider() {
  return <View style={styles.divider} />;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space[4],
  },
  pressed: { backgroundColor: colors.surface2 },
  list: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    overflow: 'hidden',
  },
  divider: { height: 1, backgroundColor: colors.line },
});
