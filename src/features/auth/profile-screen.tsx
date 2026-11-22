import { useMutation } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { StyleSheet, View } from 'react-native';

import { Avatar, Badge, Button, Card, Screen, Text, spacing } from '@/ui';

import { signOut, useSession } from './session';

/** S4: profile and sign out. */
export function ProfileScreen() {
  const user = useSession((s) => s.user);
  const out = useMutation({ mutationFn: signOut });
  if (!user) return null;

  const version = Application.nativeApplicationVersion ?? '1.0.0';
  const build = Application.nativeBuildVersion;

  return (
    <Screen
      footer={
        <Button
          testID="sign-out"
          label="Sign out"
          variant="secondary"
          icon="log-out-outline"
          loading={out.isPending}
          onPress={() => out.mutate()}
        />
      }
    >
      <Card style={styles.card}>
        <Avatar name={user.name} uri={user.avatarUrl} size={88} />
        <View style={styles.identity}>
          <Text variant="title" align="center">
            {user.name}
          </Text>
          <Text tone="muted" align="center">
            {user.email}
          </Text>
        </View>
        <View style={styles.badge}>
          <Badge
            label={user.role === 'teacher' ? 'Teacher' : 'Student'}
            tone="primary"
            icon={user.role === 'teacher' ? 'school' : 'person'}
          />
        </View>
      </Card>
      <Text variant="caption" tone="muted" align="center">
        Joinly {version}
        {build ? ` (${build})` : ''}
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center', gap: spacing.md, paddingVertical: spacing.xxl },
  identity: { gap: spacing.xxs, alignItems: 'center' },
  badge: { alignItems: 'center' },
});
