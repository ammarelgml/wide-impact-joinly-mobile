import { useMutation } from '@tanstack/react-query';
import * as Application from 'expo-application';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Avatar, Button, Sheet, StatusPill, Text, size, space } from '@/ui';

import { signOut, useSession } from './session';

/** App-bar avatar on the home lists. Opens S4, the profile sheet. */
export function ProfileButton() {
  const user = useSession((s) => s.user);
  const [open, setOpen] = useState(false);
  const out = useMutation({ mutationFn: signOut });
  if (!user) return null;

  const version = Application.nativeApplicationVersion ?? '1.0.0';
  const build = Application.nativeBuildVersion;
  const isTeacher = user.role === 'teacher';

  return (
    <>
      <Pressable
        testID="profile-button"
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Profile and sign out"
        style={styles.button}
      >
        <Avatar name={user.name} uri={user.avatarUrl} size={28} tinted={false} />
      </Pressable>
      {/* The sheet stays open until the session is cleared; the guard then shows S2. */}
      <Sheet visible={open} onClose={() => setOpen(false)} dismissible={!out.isPending}>
        <View style={styles.identity}>
          <Avatar name={user.name} uri={user.avatarUrl} size={72} tinted={false} />
          <Text variant="headline" align="center" accessibilityRole="header">
            {user.name}
          </Text>
          <Text variant="body2" align="center">
            {user.email}
          </Text>
          <View>
            <StatusPill
              kind="role"
              label={isTeacher ? 'Teacher' : 'Student'}
              icon={isTeacher ? 'school-outline' : 'person-outline'}
            />
          </View>
        </View>
        <View style={styles.actions}>
          <Button
            testID="sign-out"
            label="Sign out"
            variant="secondary"
            icon="log-out-outline"
            busy={out.isPending}
            busyLabel="Signing out…"
            onPress={() => out.mutate()}
          />
        </View>
        <Text variant="caption" align="center">
          Joinly version {version}
          {build ? ` (${build})` : ''}
        </Text>
      </Sheet>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: size.touchTarget,
    height: size.touchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  identity: { alignItems: 'center', gap: space[2], paddingBottom: space[2] },
  actions: { gap: space[2], marginTop: space[2] },
});
