import NetInfo, { useNetInfo } from '@react-native-community/netinfo';
import { onlineManager } from '@tanstack/react-query';

/** Lets TanStack Query pause requests while offline and refetch when the connection returns. */
export function connectQueryToNetwork(): () => void {
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => {
      setOnline(state.isConnected !== false);
    }),
  );
  return () => onlineManager.setEventListener(() => undefined);
}

/** True only when the device is known to be offline (unknown counts as online). */
export function useIsOffline(): boolean {
  const { isConnected } = useNetInfo();
  return isConnected === false;
}
