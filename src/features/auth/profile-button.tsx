import { router } from 'expo-router';
import { Pressable } from 'react-native';

import { Avatar, touchTarget } from '@/ui';

import { useSession } from './session';

/** Header avatar that opens the profile sheet. */
export function ProfileButton() {
  const user = useSession((s) => s.user);
  if (!user) return null;
  return (
    <Pressable
      testID="profile-button"
      onPress={() => router.push('/profile')}
      accessibilityRole="button"
      accessibilityLabel="Profile and sign out"
      hitSlop={8}
      style={{
        width: touchTarget,
        height: touchTarget,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Avatar name={user.name} uri={user.avatarUrl} size={36} />
    </Pressable>
  );
}
