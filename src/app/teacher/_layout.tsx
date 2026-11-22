import { Stack } from 'expo-router';

import { colors } from '@/ui';

/** Deep links into this stack still get the home screen underneath. */
export const unstable_settings = { initialRouteName: 'index' };

export default function TeacherLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="classrooms/new" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen name="classrooms/[id]/index" />
      <Stack.Screen name="classrooms/[id]/edit" options={{ animation: 'slide_from_bottom' }} />
      <Stack.Screen
        name="classrooms/[id]/invite"
        options={{ presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack>
  );
}
