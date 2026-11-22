import { useMutation } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Role } from '@/api/client';
import { errorMessage } from '@/api/messages';
import { config } from '@/lib/config';
import { formatJoinCode } from '@/lib/format';
import { useIsOffline } from '@/lib/network';
import {
  Banner,
  Button,
  JoinlyMark,
  Screen,
  Sheet,
  SheetOption,
  SheetTitle,
  Text,
  space,
} from '@/ui';

import { signInAsDemo, signInWithGoogle } from './auth-service';
import { GoogleSignInError } from './google';
import { useSession } from './session';

const SIGN_IN_FAILED = "Couldn't sign in with Google. Check your connection and try again.";

function signInErrorMessage(error: unknown): string {
  if (error instanceof GoogleSignInError) {
    if (error.reason === 'play-services')
      return 'Google Play services are needed to sign in. Update them and try again.';
    if (error.reason === 'in-progress') return 'Sign-in is already open. Finish it or try again.';
    return SIGN_IN_FAILED;
  }
  return errorMessage(error);
}

/** S2: Welcome and sign in. Cancelling the Google picker returns here with no error. */
export function WelcomeScreen() {
  const signOutReason = useSession((s) => s.signOutReason);
  const pendingJoinCode = useSession((s) => s.pendingJoinCode);
  const offline = useIsOffline();
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
      offline="You're offline."
      footer={
        <>
          {google.isError && !offline ? (
            <Banner
              tone="error"
              message={signInErrorMessage(google.error)}
              testID="sign-in-error"
            />
          ) : null}
          {offline ? (
            <Text variant="caption" align="center">
              Connect to the internet to sign in.
            </Text>
          ) : null}
          <Button
            testID="google-sign-in"
            variant="secondary"
            icon="logo-google"
            label={google.isError ? 'Try again' : 'Continue with Google'}
            busy={google.isPending}
            busyLabel="Signing in…"
            disabled={busy || offline}
            onPress={() => google.mutate()}
          />
          {!offline ? (
            <Text variant="caption" align="center">
              Teachers and students use the same sign-in.
            </Text>
          ) : null}
          {config.demoLoginEnabled && !offline ? (
            <Button
              testID="demo-accounts"
              label="Demo accounts"
              variant="text"
              small
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
      <View style={styles.spacer} />
      {signOutReason === 'expired' || pendingJoinCode ? (
        <View style={styles.banners}>
          {signOutReason === 'expired' ? (
            <Banner tone="warning" lead="Your session expired." message="Please sign in again." />
          ) : null}
          {pendingJoinCode ? (
            <Banner
              testID="pending-code"
              message={`Code ${formatJoinCode(pendingJoinCode)} is saved. You'll join after you sign in.`}
            />
          ) : null}
        </View>
      ) : null}

      <View style={styles.hero}>
        <JoinlyMark />
        <Text variant="display" align="center" accessibilityRole="header">
          Joinly
        </Text>
        <Text variant="body2" align="center" style={styles.tagline}>
          Create classes and join them with a code or a scan.
        </Text>
      </View>

      <Sheet visible={demoOpen} onClose={() => setDemoOpen(false)} dismissible={!demo.isPending}>
        <SheetTitle>Demo accounts</SheetTitle>
        <Text variant="body2">
          For app review only. Each opens a sample account with test data.
        </Text>
        {demo.isError ? <Banner tone="error" message={errorMessage(demo.error)} /> : null}
        <SheetOption
          testID="demo-teacher"
          icon="school-outline"
          title="Teacher demo"
          caption="Classrooms with students"
          chevron
          busy={demo.isPending && demo.variables === 'teacher'}
          disabled={demo.isPending}
          onPress={() => demo.mutate('teacher')}
        />
        <SheetOption
          testID="demo-student"
          icon="person-outline"
          title="Student demo"
          caption="Already a member of a class"
          chevron
          busy={demo.isPending && demo.variables === 'student'}
          disabled={demo.isPending}
          onPress={() => demo.mutate('student')}
        />
        <Button
          label="Cancel"
          variant="text"
          disabled={demo.isPending}
          onPress={() => setDemoOpen(false)}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  spacer: { height: 32 },
  banners: { gap: space[2] },
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: space[4] },
  tagline: { maxWidth: 260 },
});
