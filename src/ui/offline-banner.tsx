import { useIsOffline } from '@/lib/network';

import { Banner } from './banner';

export function OfflineBanner() {
  const offline = useIsOffline();
  if (!offline) return null;
  return (
    <Banner
      tone="warning"
      message="You're offline. Changes need a connection."
      testID="offline-banner"
    />
  );
}
