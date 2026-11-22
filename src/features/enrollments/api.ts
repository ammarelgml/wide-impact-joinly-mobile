import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
  type QueryClient,
} from '@tanstack/react-query';

import { api, unwrap, type ClassroomPreview, type JoinedVia, type Schemas } from '@/api/client';
import { queryKeys } from '@/api/query-client';

type EnrollmentPage = Schemas['EnrollmentPage'];

export function useEnrollments() {
  return useInfiniteQuery({
    queryKey: queryKeys.enrollments.list(),
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.GET('/v1/enrollments', {
          params: { query: { cursor: pageParam, limit: 20 } },
          signal,
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: EnrollmentPage) => last.nextCursor ?? undefined,
  });
}

function fetchPreview(code: string, signal?: AbortSignal) {
  return unwrap(api.POST('/v1/enrollments/preview', { body: { code }, signal }));
}

/**
 * Resolves a code to its classroom before joining (spec D8). Errors are answers here (invalid,
 * expired, closed, rate limited), so they are never retried: a retry would also spend one of the
 * student's limited attempts.
 */
export function usePreview(code: string) {
  return useQuery<ClassroomPreview>({
    queryKey: queryKeys.enrollments.preview(code),
    queryFn: ({ signal }) => fetchPreview(code, signal),
    retry: false,
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
}

/** Used by the code entry screen: checks the code there, so errors stay on that screen, and seeds the confirm screen's cache. */
export function prefetchPreview(queryClient: QueryClient, code: string) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.enrollments.preview(code),
    queryFn: ({ signal }) => fetchPreview(code, signal),
    retry: false,
    staleTime: 30_000,
  });
}

/** Joining is idempotent on the API (spec D9): a repeat join returns the existing membership. */
export function useJoin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { code: string; via: JoinedVia }) =>
      unwrap(api.POST('/v1/enrollments', { body: input })),
    onSuccess: (_enrollment, input) => {
      queryClient.setQueryData<ClassroomPreview>(
        queryKeys.enrollments.preview(input.code),
        (preview) => (preview ? { ...preview, alreadyMember: true } : preview),
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.enrollments.list() });
    },
  });
}

export function useLeave(classroomId: string) {
  const queryClient = useQueryClient();
  const key = queryKeys.enrollments.list();
  return useMutation({
    mutationFn: () =>
      unwrap(api.DELETE('/v1/enrollments/{classroomId}', { params: { path: { classroomId } } })),
    onSuccess: () => {
      // Cached previews may say "already a member" for this class; they are no longer true.
      queryClient.removeQueries({ queryKey: [...queryKeys.enrollments.all, 'preview'] });
      queryClient.setQueryData<InfiniteData<EnrollmentPage>>(key, (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                ...page,
                items: page.items.filter((e) => e.classroom.id !== classroomId),
              })),
            }
          : data,
      );
      void queryClient.invalidateQueries({ queryKey: key });
    },
  });
}
