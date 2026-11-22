import { useMutation } from '@tanstack/react-query';
import { Redirect, router } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import type { Role } from '@/api/client';
import { isApiError } from '@/api/errors';
import { errorMessage } from '@/api/messages';
import { Banner, Button, Icon, Screen, Text, colors, radius, spacing, type IconName } from '@/ui';

import { cancelSignUp, completeSignUp } from './auth-service';
import { useSession } from './session';

const OPTIONS: { role: Role; title: string; description: string; icon: IconName }[] = [
  {
    role: 'teacher',
    title: 'Teacher',
    description: 'Create classes and invite students',
    icon: 'school',
  },
  { role: 'student', title: 'Student', description: 'Join your classes', icon: 'person' },
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
        tokenExpired ? (
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
            label="Continue"
            disabled={!role}
            loading={submit.isPending}
            onPress={() => role && submit.mutate(role)}
          />
        )
      }
    >
      <View style={styles.intro}>
        <Text variant="title" accessibilityRole="header">
          How will you use Joinly?
        </Text>
        <Text tone="muted">You can&apos;t change this later.</Text>
      </View>

      <View accessibilityRole="radiogroup" style={styles.options}>
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
              style={[styles.option, selected && styles.optionSelected]}
            >
              <View style={[styles.optionIcon, selected && { backgroundColor: colors.primary }]}>
                <Icon
                  name={option.icon}
                  size={28}
                  color={selected ? colors.onPrimary : colors.primary}
                />
              </View>
              <View style={styles.optionText}>
                <Text variant="heading">{option.title}</Text>
                <Text tone="muted">{option.description}</Text>
              </View>
              <Icon
                name={selected ? 'radio-button-on' : 'radio-button-off'}
                color={selected ? colors.primary : colors.textDisabled}
              />
            </Pressable>
          );
        })}
      </View>

      {submit.isError ? (
        <Banner
          tone="error"
          message={
            tokenExpired
              ? 'Your Google sign-in expired while choosing. Please sign in again.'
              : errorMessage(submit.error)
          }
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, marginTop: spacing.md },
  options: { gap: spacing.md },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    minHeight: 96,
  },
  optionSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  optionIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: { flex: 1, gap: spacing.xxs },
});
