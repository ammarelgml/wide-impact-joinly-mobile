import { Stack } from 'expo-router';

import { colors } from '@/ui';

/** Deep links into this stack (for example a QR join link) still get the home screen underneath. */
export const unstable_settings = { initialRouteName: 'index' };

export default function StudentLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="join/scan"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
      <Stack.Screen name="join/code" />
      <Stack.Screen name="join/confirm" />
      <Stack.Screen name="classes/[id]" />
    </Stack>
  );
}
