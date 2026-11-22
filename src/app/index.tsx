import { Redirect } from 'expo-router';

import { useSession } from '@/features/auth/session';

/** Entry point and guard anchor: routes to the home of the signed-in role, or to sign-in. */
export default function Index() {
  const status = useSession((s) => s.status);
  const role = useSession((s) => s.user?.role);
  const pendingJoinCode = useSession((s) => s.pendingJoinCode);

  if (status !== 'signedIn') return <Redirect href="/welcome" />;
  if (role === 'teacher') return <Redirect href="/teacher" />;
  if (pendingJoinCode) {
    // A QR link opened while signed out continues to the join confirm (spec F1). The confirm screen clears it.
    return (
      <Redirect
        href={{ pathname: '/student/join/confirm', params: { code: pendingJoinCode, via: 'qr' } }}
      />
    );
  }
  return <Redirect href="/student" />;
}
