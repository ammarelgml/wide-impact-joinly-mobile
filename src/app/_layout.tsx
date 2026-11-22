// Per-weight imports, so only the four weights the design uses are bundled (not all 18).
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { connectQueryToAppState, createQueryClient } from '@/api/query-client';
import { signOutOfGoogle } from '@/features/auth/google';
import { onSessionEnded, restoreSession, syncProfile, useSession } from '@/features/auth/session';
import { connectQueryToNetwork } from '@/lib/network';
import { colors } from '@/ui';

// S1: the native splash (the Joinly mark) stays up while fonts load and the saved session is restored.
void SplashScreen.preventAutoHideAsync();

// Portrait everywhere; the invite screen (T4) unlocks landscape while it is open.
if (Platform.OS !== 'web') {
  void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(() => {});
}

export default function RootLayout() {
  const [queryClient] = useState(createQueryClient);
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  // A font that fails to load falls back to the system font rather than blocking the app.
  const fontsReady = fontsLoaded || !!fontError;

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

  const ready = status !== 'restoring' && fontsReady;
  useEffect(() => {
    if (ready) void SplashScreen.hideAsync();
  }, [ready]);

  if (!ready) return null;

  const signedIn = status === 'signedIn';
  return (
    <QueryClientProvider client={queryClient}>
      <StatusBar style="dark" />
      {/* Every screen draws its own app bar from the design, so native headers are off. */}
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="join" options={{ animation: 'none' }} />
        {/* Role routing is a layout guard: each group exists only for the matching session. */}
        <Stack.Protected guard={!signedIn}>
          <Stack.Screen name="welcome" />
          <Stack.Screen name="role" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'teacher'}>
          <Stack.Screen name="teacher" />
        </Stack.Protected>
        <Stack.Protected guard={signedIn && role === 'student'}>
          <Stack.Screen name="student" />
        </Stack.Protected>
      </Stack>
    </QueryClientProvider>
  );
}
