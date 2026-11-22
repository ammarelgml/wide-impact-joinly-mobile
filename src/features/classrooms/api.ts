import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';

import { api, unwrap, type Classroom, type RosterStudent, type Schemas } from '@/api/client';
import { queryKeys } from '@/api/query-client';

type ClassroomPage = Schemas['ClassroomPage'];
type RosterPage = Schemas['RosterPage'];
type ClassroomInput = Schemas['CreateClassroomBody'];
type ClassroomPatch = Schemas['UpdateClassroomBody'];

/**
 * Live updates by polling, only while the screen is focused. The invite screen's counter must move
 * within 2 s of a join; the classroom screen's roster picks up new students every 5 s.
 */
export const INVITE_POLL_MS = 2_000;
export const ROSTER_POLL_MS = 5_000;

export function useClassrooms() {
  return useInfiniteQuery({
    queryKey: queryKeys.classrooms.list(),
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.GET('/v1/classrooms', {
          params: { query: { cursor: pageParam, limit: 20 } },
          signal,
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: ClassroomPage) => last.nextCursor ?? undefined,
  });
}

export function useClassroom(id: string, options: { pollMs?: number | false } = {}) {
  const queryClient = useQueryClient();
  return useQuery<Classroom>({
    queryKey: queryKeys.classrooms.detail(id),
    queryFn: ({ signal }) =>
      unwrap(api.GET('/v1/classrooms/{id}', { params: { path: { id } }, signal })),
    refetchInterval: options.pollMs ?? false,
    // Opening a class from the list renders instantly from the list's copy, then refreshes.
    placeholderData: () =>
      queryClient
        .getQueryData<InfiniteData<ClassroomPage>>(queryKeys.classrooms.list())
        ?.pages.flatMap((page) => page.items)
        .find((classroom) => classroom.id === id),
  });
}

export function useRoster(id: string, options: { pollMs?: number | false } = {}) {
  return useInfiniteQuery({
    queryKey: queryKeys.classrooms.roster(id),
    queryFn: ({ pageParam, signal }) =>
      unwrap(
        api.GET('/v1/classrooms/{id}/students', {
          params: { path: { id }, query: { cursor: pageParam, limit: 50 } },
          signal,
        }),
      ),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last: RosterPage) => last.nextCursor ?? undefined,
    refetchInterval: options.pollMs ?? false,
  });
}

function useClassroomCache() {
  const queryClient = useQueryClient();
  return {
    queryClient,
    setDetail(classroom: Classroom) {
      queryClient.setQueryData(queryKeys.classrooms.detail(classroom.id), classroom);
    },
    invalidateList() {
      return queryClient.invalidateQueries({ queryKey: queryKeys.classrooms.list() });
    },
  };
}

export function useCreateClassroom() {
  const cache = useClassroomCache();
  return useMutation({
    mutationFn: (body: ClassroomInput) => unwrap(api.POST('/v1/classrooms', { body })),
    onSuccess: (classroom) => {
      cache.setDetail(classroom);
      void cache.invalidateList();
    },
  });
}

export function useUpdateClassroom(id: string) {
  const cache = useClassroomCache();
  const key = queryKeys.classrooms.detail(id);
  return useMutation({
    mutationFn: (body: ClassroomPatch) =>
      unwrap(api.PATCH('/v1/classrooms/{id}', { params: { path: { id } }, body })),
    // Optimistic, so the "Joining open" switch responds instantly; rolled back if the API refuses.
    onMutate: async (body) => {
      await cache.queryClient.cancelQueries({ queryKey: key });
      const previous = cache.queryClient.getQueryData<Classroom>(key);
      if (previous) cache.setDetail({ ...previous, ...body } as Classroom);
      return { previous };
    },
    onError: (_error, _body, context) => {
      if (context?.previous) cache.setDetail(context.previous);
    },
    onSuccess: (classroom) => cache.setDetail(classroom),
    onSettled: () => cache.invalidateList(),
  });
}

export function useDeleteClassroom(id: string) {
  const cache = useClassroomCache();
  return useMutation({
    mutationFn: () => unwrap(api.DELETE('/v1/classrooms/{id}', { params: { path: { id } } })),
    onSuccess: () => {
      cache.queryClient.removeQueries({ queryKey: queryKeys.classrooms.detail(id) });
      cache.queryClient.removeQueries({ queryKey: queryKeys.classrooms.roster(id) });
      void cache.invalidateList();
    },
  });
}

/** Issues a new code; the old code and its QR stop working immediately (spec D4). */
export function useRegenerateCode(id: string) {
  const cache = useClassroomCache();
  return useMutation({
    mutationFn: () =>
      unwrap(api.POST('/v1/classrooms/{id}/join-code', { params: { path: { id } } })),
    onSuccess: (joinCode) => {
      const key = queryKeys.classrooms.detail(id);
      const current = cache.queryClient.getQueryData<Classroom>(key);
      if (current) cache.setDetail({ ...current, joinCode });
      void cache.queryClient.invalidateQueries({ queryKey: key });
      void cache.invalidateList();
    },
  });
}

export function useRemoveStudent(classroomId: string) {
  const cache = useClassroomCache();
  const rosterKey = queryKeys.classrooms.roster(classroomId);
  const detailKey = queryKeys.classrooms.detail(classroomId);
  return useMutation({
    mutationFn: (student: RosterStudent) =>
      unwrap(
        api.DELETE('/v1/classrooms/{id}/students/{studentId}', {
          params: { path: { id: classroomId, studentId: student.id } },
        }),
      ),
    onMutate: async (student) => {
      await cache.queryClient.cancelQueries({ queryKey: rosterKey });
      const previous = cache.queryClient.getQueryData<InfiniteData<RosterPage>>(rosterKey);
      if (previous) {
        cache.queryClient.setQueryData<InfiniteData<RosterPage>>(rosterKey, {
          ...previous,
          pages: previous.pages.map((page) => ({
            ...page,
            total: Math.max(0, page.total - 1),
            items: page.items.filter((s) => s.id !== student.id),
          })),
        });
      }
      return { previous };
    },
    onError: (_error, _student, context) => {
      if (context?.previous) cache.queryClient.setQueryData(rosterKey, context.previous);
    },
    onSettled: () => {
      void cache.queryClient.invalidateQueries({ queryKey: rosterKey });
      void cache.queryClient.invalidateQueries({ queryKey: detailKey });
      void cache.invalidateList();
    },
  });
}
