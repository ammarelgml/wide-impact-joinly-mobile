import { router } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { IconButton } from './icon-button';
import { Text } from './text';
import { colors, font, size, space } from './theme';

export type AppBarProps = {
  title?: string;
  /** Home lists (T1, P1) use the large 28 dp title. */
  large?: boolean;
  /** Back arrow, close cross, or nothing. */
  leading?: 'back' | 'close' | null;
  onLeading?: () => void;
  /** At most one icon action at the end. */
  action?: ReactNode;
  tint?: string;
};

export function goBackOr(fallback: Parameters<typeof router.replace>[0]) {
  if (router.canGoBack()) router.back();
  else router.replace(fallback);
}

/** 56 dp app bar: back or close, title, up to one icon action. Nothing important goes top-right. */
export function AppBar({
  title,
  large = false,
  leading = 'back',
  onLeading,
  action,
  tint = colors.ink,
}: AppBarProps) {
  return (
    <View style={styles.bar}>
      {leading ? (
        <IconButton
          testID="app-bar-leading"
          icon={leading === 'back' ? 'arrow-back' : 'close'}
          label={leading === 'back' ? 'Back' : 'Close'}
          color={tint}
          onPress={onLeading ?? (() => goBackOr('/'))}
        />
      ) : null}
      <View style={styles.titleWrap}>
        {title ? (
          <Text
            accessibilityRole="header"
            numberOfLines={1}
            style={[large ? styles.large : styles.title, { color: tint }]}
          >
            {title}
          </Text>
        ) : null}
      </View>
      {action}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[1],
    minHeight: size.appBar,
    paddingHorizontal: space[2],
  },
  titleWrap: { flex: 1, minWidth: 0 },
  title: { ...font(600, 20, 28), paddingHorizontal: space[2] },
  large: { ...font(700, 28, 36), letterSpacing: -0.28, paddingHorizontal: space[3] },
});
