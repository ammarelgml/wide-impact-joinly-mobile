import { Redirect, router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';

import { setPendingJoinCode, useSession } from '@/features/auth/session';
import { isJoinCode } from '@/features/join/join-code';
import { Button, EmptyState, Screen } from '@/ui';

/**
 * Target of the QR deep link `joinly://join?code=482913`, whether the student scanned it with the
 * phone camera or another app opened it. The code is validated before anything else sees it.
 */
export default function JoinLink() {
  const { code } = useLocalSearchParams<{ code?: string }>();
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);
  const valid = isJoinCode(code) ? code : null;

  useEffect(() => {
    if (valid && status === 'signedOut') {
      setPendingJoinCode(valid);
      router.replace('/welcome');
    }
  }, [valid, status]);

  if (!valid) return <Redirect href="/" />;
  if (status === 'signedOut') return null;
  if (role === 'student') {
    return (
      <Redirect href={{ pathname: '/student/join/confirm', params: { code: valid, via: 'qr' } }} />
    );
  }
  return (
    <Screen edges={['top', 'bottom']}>
      <EmptyState
        icon="qr-code"
        title="This is a class invite"
        message="Invites are for student accounts. You're signed in as a teacher."
      >
        <Button label="Go to my classrooms" onPress={() => router.replace('/teacher')} />
      </EmptyState>
    </Screen>
  );
}
