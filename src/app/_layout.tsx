import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';

import { connectQueryToAppState, createQueryClient } from '@/api/query-client';
import { signOutOfGoogle } from '@/features/auth/google';
import { onSessionEnded, restoreSession, syncProfile, useSession } from '@/features/auth/session';
import { connectQueryToNetwork } from '@/lib/network';
import { stackScreenOptions } from '@/ui';

// S1: the native splash stays up while the saved session is restored.
void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);

  useEffect(() => {
    void restoreSession().then(syncProfile);
    const disconnectNetwork = connectQueryToNetwork();
    const disconnectAppState = connectQueryToAppState();
    return () => {
      disconnectNetwork();
      disconnectAppState();
    };
  }, []);

  // A session can end anywhere (sign out, or a rejected refresh token): drop every cached response with it.
  useEffect(
    () =>
      onSessionEnded(() => {
        queryClient.clear();
        void signOutOfGoogle();
      }),
    [queryClient],
  );

  useEffect(() => {
    if (status !== 'restoring') void SplashScreen.hideAsync();
  }, [status]);

  if (status === 'restoring') return null;

  const signedIn = status === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      <Stack screenOptions={stackScreenOptions}>
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="join" options={{ headerShown: false, animation: 'none' }} />
        {/* Role routing is a layout guard: each group exists only for the matching session. */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" options={{ headerShown: false }} />
          <Stack.Screen name="role" options={{ title: 'Choose your role' }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'teacher'}>
          <Stack.Screen name="teacher" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'student'}>
          <Stack.Screen name="student" options={{ headerShown: false }} />
        </Stack.Protected>
        <Stack.Protected guard={signedIn}>
          <Stack.Screen name="profile" options={{ title: 'Profile', presentation: 'modal' }} />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
