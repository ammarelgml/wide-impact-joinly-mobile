import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/messages';

import { Button } from './button';
import { Icon, type IconName } from './icon';
import { Text } from './text';
import { colors, spacing } from './theme';

/** Empty screen with one clear next action. */
export function EmptyState({
  icon,
  title,
  message,
  children,
}: {
  icon: IconName;
  title: string;
  message?: string;
  children?: ReactNode;
}) {
  return (
    <View style={styles.container}>
      <View style={styles.iconCircle}>
        <Icon name={icon} size={32} color={colors.primary} />
      </View>
      <Text variant="heading" align="center" accessibilityRole="header">
        {title}
      </Text>
      {message ? (
        <Text tone="muted" align="center">
          {message}
        </Text>
      ) : null}
      {children ? <View style={styles.actions}>{children}</View> : null}
    </View>
  );
}

/** Full-area error with a retry, for when there is no cached data to show. */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <View style={styles.container}>
      <View style={[styles.iconCircle, { backgroundColor: colors.dangerSoft }]}>
        <Icon name="cloud-offline" size={32} color={colors.danger} />
      </View>
      <Text variant="heading" align="center" accessibilityRole="header">
        Couldn&apos;t load this
      </Text>
      <Text tone="muted" align="center">
        {errorMessage(error)}
      </Text>
      <View style={styles.actions}>
        <Button label="Try again" variant="secondary" icon="refresh" onPress={onRetry} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
    gap: spacing.md,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  actions: { alignSelf: 'stretch', gap: spacing.md, marginTop: spacing.md },
});
