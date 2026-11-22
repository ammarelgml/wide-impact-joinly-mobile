import type { ReactElement, ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type RefreshControlProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { OfflineBanner } from './offline-banner';
import { colors, spacing } from './theme';

export type ScreenProps = {
  children: ReactNode;
  /** Primary action pinned to the bottom, in thumb reach. */
  footer?: ReactNode;
  scroll?: boolean;
  refreshControl?: ReactElement<RefreshControlProps>;
  /** Screens under a native header only need the bottom safe area. */
  edges?: ('top' | 'bottom')[];
  offlineBanner?: boolean;
};

export function Screen({
  children,
  footer,
  scroll = true,
  refreshControl,
  edges = ['bottom'],
  offlineBanner = true,
}: ScreenProps) {
  const content = (
    <>
      {offlineBanner ? (
        <View style={styles.banner}>
          <OfflineBanner />
        </View>
      ) : null}
      {children}
    </>
  );
  return (
    <SafeAreaView style={styles.root} edges={edges}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {scroll ? (
          <ScrollView
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
            refreshControl={refreshControl}
          >
            {content}
          </ScrollView>
        ) : (
          <View style={[styles.flex, styles.content]}>{content}</View>
        )}
        {footer ? <View style={styles.footer}>{footer}</View> : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  content: { flexGrow: 1, padding: spacing.lg, gap: spacing.lg },
  banner: { marginBottom: -spacing.sm },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    gap: spacing.md,
    backgroundColor: colors.background,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border,
  },
});
