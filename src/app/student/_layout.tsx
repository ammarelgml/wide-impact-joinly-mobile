import { Stack } from 'expo-router';

import { ProfileButton } from '@/features/auth/profile-button';
import { stackScreenOptions } from '@/ui';

/** Deep links into this stack (for example a QR join link) still get the home screen underneath. */
export const unstable_settings = { initialRouteName: 'index' };

export default function StudentLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: 'My classrooms', headerRight: () => <ProfileButton /> }}
      />
      <Stack.Screen
        name="join/scan"
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen name="join/code" options={{ title: 'Enter code' }} />
      <Stack.Screen name="join/confirm" options={{ title: 'Join class' }} />
      <Stack.Screen name="classes/[id]" options={{ title: '' }} />
    </Stack>
  );
}
