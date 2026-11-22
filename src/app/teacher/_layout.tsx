import { Stack } from 'expo-router';

import { ProfileButton } from '@/features/auth/profile-button';
import { stackScreenOptions } from '@/ui';

export default function TeacherLayout() {
  return (
    <Stack screenOptions={stackScreenOptions}>
      <Stack.Screen
        name="index"
        options={{ title: 'My classrooms', headerRight: () => <ProfileButton /> }}
      />
      <Stack.Screen
        name="classrooms/new"
        options={{ title: 'New classroom', presentation: 'modal' }}
      />
      <Stack.Screen name="classrooms/[id]/index" options={{ title: '' }} />
      <Stack.Screen
        name="classrooms/[id]/edit"
        options={{ title: 'Edit classroom', presentation: 'modal' }}
      />
      <Stack.Screen
        name="classrooms/[id]/invite"
        options={{ headerShown: false, presentation: 'fullScreenModal', animation: 'fade' }}
      />
    </Stack>
  );
}
