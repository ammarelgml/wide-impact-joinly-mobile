import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppBar, type AppBarProps } from './app-bar';
import { OfflineStrip } from './offline-strip';
import { colors, space } from './theme';

export type ScreenProps = {
  children?: ReactNode;
  /** App bar under the status bar; omit for screens without one (welcome, role, joined). */
  appBar?: AppBarProps;
  /** Primary action area pinned to the bottom third. */
  footer?: ReactNode;
  /** Footer as a bar: surface background and a top rule, content scrolls under it (T2, T3). */
  footerBar?: boolean;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** The offline strip's message, or false for screens that work offline. */
  offline?: string | false;
  /** Surface background instead of bg (invite, scanner prompts, joined). */
  surface?: boolean;
  /** Centre the content (empty and error states). */
  center?: boolean;
  /** Floating elements over the content: the FAB, toasts. */
  overlay?: ReactNode;
  contentStyle?: StyleProp<ViewStyle>;
  testID?: string;
};

/**
 * Screen anatomy from the design: safe-area top, 56 dp app bar, offline strip, content with 16 dp
 * margins, then the bottom action area (12 dp top, 28 dp bottom above the gesture bar).
 */
export function Screen({
  children,
  appBar,
  footer,
  footerBar = false,
  scroll = true,
  refreshControl,
  offline,
  surface = false,
  center = false,
  overlay,
  contentStyle,
  testID,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(28, insets.bottom + space[3]);
  const contentStyles = [
    styles.content,
    center && styles.center,
    !footer && { paddingBottom: bottomPad },
    contentStyle,
  ];
  return (
    <View
      testID={testID}
      style={[
        styles.root,
        { paddingTop: insets.top, backgroundColor: surface ? colors.surface : colors.bg },
      ]}
    >
      {appBar ? <AppBar {...appBar} /> : null}
      {offline !== false ? <OfflineStrip message={offline} /> : null}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        {scroll ? (
          <ScrollView
            style={styles.flex}
            contentContainerStyle={contentStyles}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.flex, ...contentStyles]}>{children}</View>
        )}
        {footer ? (
          <View
            style={[styles.footer, { paddingBottom: bottomPad }, footerBar && styles.footerBar]}
          >
            {footer}
          </View>
        ) : null}
      </KeyboardAvoidingView>
      {overlay}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingTop: space[2],
    paddingHorizontal: space[4],
    paddingBottom: space[4],
    gap: space[3],
  },
  center: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: space[6] },
  footer: { paddingHorizontal: space[4], paddingTop: space[3], gap: space[2] },
  footerBar: {
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
});
