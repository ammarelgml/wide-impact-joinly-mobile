import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Role } from '@/api/client';
import { isApiError } from '@/api/errors';
import { Banner, Button, Icon, Screen, Text, colors, radius, space, type IconName } from '@/ui';

import { cancelSignUp, completeSignUp } from './auth-service';
import { useSession } from './session';

const OPTIONS: { role: Role; title: string; description: string; icon: IconName }[] = [
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Create classes and invite students',
    icon: 'school-outline',
  },
  { role: 'student', title: 'Student', description: 'Join your classes', icon: 'person-outline' },
];

/** S3: shown only on a first sign-in, after the API answered ROLE_REQUIRED. */
export function RoleScreen() {
  const pending = useSession((s) => s.pendingRoleIdToken);
  const [role, setRole] = useState<Role | null>(null);
  const submit = useMutation({ mutationFn: completeSignUp });

  if (!pending) return <Redirect href="/welcome" />;

  // Google ID tokens last about an hour; if it lapsed, the only fix is to sign in again.
  const tokenExpired = isApiError(submit.error, 'GOOGLE_TOKEN_INVALID');

  return (
    <Screen
      footer={
        <>
          {submit.isError ? (
            <Banner
              tone="error"
              message={
                tokenExpired
                  ? 'Your Google sign-in expired while choosing. Please sign in again.'
                  : "Couldn't save your role. Check your connection and try again."
              }
            />
          ) : null}
          {tokenExpired ? (
            <Button
              label="Sign in again"
              onPress={() => {
                cancelSignUp();
                router.replace('/welcome');
              }}
            />
          ) : (
            <Button
              testID="role-continue"
              label={submit.isError ? 'Try again' : role ? `Continue as ${role}` : 'Continue'}
              disabled={!role}
              busy={submit.isPending}
              busyLabel="Setting up…"
              onPress={() => role && submit.mutate(role)}
            />
          )}
        </>
      }
      contentStyle={styles.content}
    >
      <View style={styles.spacer} />
      <Text variant="title" accessibilityRole="header">
        How will you use Joinly?
      </Text>
      <Text variant="body2">Pick the one that fits you.</Text>

      <View
        accessibilityRole="radiogroup"
        accessibilityLabel="Choose your role"
        style={styles.options}
      >
        {OPTIONS.map((option) => {
          const selected = role === option.role;
          return (
            <Pressable
              key={option.role}
              testID={`role-${option.role}`}
              onPress={() => setRole(option.role)}
              disabled={submit.isPending}
              accessibilityRole="radio"
              accessibilityState={{ checked: selected, disabled: submit.isPending }}
              accessibilityLabel={`${option.title}. ${option.description}`}
              style={[styles.card, selected && styles.cardSelected]}
            >
              <View style={[styles.cardIcon, selected && styles.cardIconSelected]}>
                <Icon name={option.icon} size={28} color={selected ? colors.primary : colors.ink} />
              </View>
              <View style={styles.cardText}>
                <Text variant="headline">{option.title}</Text>
                <Text variant="body2">{option.description}</Text>
              </View>
              <View style={[styles.radio, selected && styles.radioSelected]}>
                {selected ? <Icon name="checkmark" size={16} color={colors.onPrimary} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>

      <Banner message="Your role can't be changed later." />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[4] },
  spacer: { height: 32 - space[4] },
  options: { gap: space[3] },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[4],
    padding: 20,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    borderColor: colors.line,
    backgroundColor: colors.surface,
  },
  cardSelected: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
  },
  cardIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardIconSelected: { backgroundColor: colors.surface },
  cardText: { flex: 1 },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.lineStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
});
