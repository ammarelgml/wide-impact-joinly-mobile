import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform } from 'react-native';

import { ApiError } from './errors';

/** Retries only what a retry can fix: network failures and server errors. A 4xx is an answer. */
export function shouldRetry(failureCount: number, error: unknown): boolean {
  if (failureCount >= 2) return false;
  if (!(error instanceof ApiError)) return false;
  return error.code === 'NETWORK' || error.status >= 500;
}

export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: { retry: shouldRetry, staleTime: 15_000 },
      mutations: { retry: false },
    },
  });
}

/** Refetch stale queries when the app returns to the foreground (React Native has no window focus). */
export function connectQueryToAppState(): () => void {
  const subscription = AppState.addEventListener('change', (status) => {
    if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
  });
  return () => subscription.remove();
}

export const queryKeys = {
  classrooms: {
    all: ['classrooms'] as const,
    list: () => ['classrooms', 'list'] as const,
    detail: (id: string) => ['classrooms', 'detail', id] as const,
    roster: (id: string) => ['classrooms', 'roster', id] as const,
  },
  enrollments: {
    all: ['enrollments'] as const,
    list: () => ['enrollments', 'list'] as const,
    preview: (code: string) => ['enrollments', 'preview', code] as const,
  },
};
