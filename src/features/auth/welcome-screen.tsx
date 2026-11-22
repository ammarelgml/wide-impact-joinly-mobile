import { useMutation } from '@tanstack/react-query';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Role } from '@/api/client';
import { errorMessage } from '@/api/messages';
import { config } from '@/lib/config';
import { Banner, Button, Screen, Sheet, Text, spacing } from '@/ui';

import { signInAsDemo, signInWithGoogle } from './auth-service';
import { GoogleSignInError } from './google';
import { useSession } from './session';

function signInErrorMessage(error: unknown): string {
  if (error instanceof GoogleSignInError) {
    if (error.reason === 'play-services')
      return 'Google Play services are needed to sign in. Update them and try again.';
    if (error.reason === 'in-progress') return 'Sign-in is already open. Finish it or try again.';
    return "Google sign-in didn't complete. Please try again.";
  }
  return errorMessage(error);
}

/** S2: Welcome and sign in. */
export function WelcomeScreen() {
  const signOutReason = useSession((s) => s.signOutReason);
  const pendingJoinCode = useSession((s) => s.pendingJoinCode);
  const [demoOpen, setDemoOpen] = useState(false);

  const google = useMutation({
    mutationFn: signInWithGoogle,
    onSuccess: (outcome) => {
      if (outcome === 'roleRequired') router.push('/role');
    },
  });
  const demo = useMutation({
    mutationFn: (account: Role) => signInAsDemo(account),
    onSuccess: () => setDemoOpen(false),
  });

  const busy = google.isPending || demo.isPending;

  return (
    <Screen
      edges={['top', 'bottom']}
      footer={
        <>
          <Button
            testID="google-sign-in"
            label="Continue with Google"
            icon="logo-google"
            loading={google.isPending}
            disabled={busy}
            onPress={() => google.mutate()}
          />
          {config.demoLoginEnabled ? (
            <Button
              label="Demo accounts"
              variant="ghost"
              disabled={busy}
              accessibilityHint="Sign in as a sample teacher or student for review"
              onPress={() => {
                demo.reset();
                setDemoOpen(true);
              }}
            />
          ) : null}
        </>
      }
    >
      <View style={styles.hero}>
        <Image
          source={require('../../../assets/splash-icon.png')}
          style={styles.mark}
          accessibilityIgnoresInvertColors
          accessible={false}
        />
        <Text variant="display" align="center" accessibilityRole="header">
          Joinly
        </Text>
        <Text tone="muted" align="center" style={styles.tagline}>
          Create classes and bring students in within seconds, with a QR code or a 6-digit code.
        </Text>
      </View>

      <View style={styles.messages}>
        {pendingJoinCode ? <Banner message="Sign in to join the class you scanned." /> : null}
        {signOutReason === 'expired' ? (
          <Banner tone="warning" message="Your session ended. Please sign in again." />
        ) : null}
        {google.isError ? (
          <Banner tone="error" message={signInErrorMessage(google.error)} testID="sign-in-error" />
        ) : null}
      </View>

      <Sheet visible={demoOpen} onClose={() => !demo.isPending && setDemoOpen(false)}>
        <Text variant="heading" accessibilityRole="header">
          Demo accounts
        </Text>
        <Text tone="muted">
          Sample accounts for reviewing the app, with classrooms already set up.
        </Text>
        {demo.isError ? <Banner tone="error" message={errorMessage(demo.error)} /> : null}
        <Button
          testID="demo-teacher"
          label="Continue as demo teacher"
          icon="school"
          loading={demo.isPending && demo.variables === 'teacher'}
          disabled={demo.isPending}
          onPress={() => demo.mutate('teacher')}
        />
        <Button
          testID="demo-student"
          label="Continue as demo student"
          icon="person"
          variant="secondary"
          loading={demo.isPending && demo.variables === 'student'}
          disabled={demo.isPending}
          onPress={() => demo.mutate('student')}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  hero: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    paddingTop: spacing.xxxl,
  },
  mark: { width: 88, height: 88, marginBottom: spacing.sm },
  tagline: { maxWidth: 320 },
  messages: { gap: spacing.sm },
});
