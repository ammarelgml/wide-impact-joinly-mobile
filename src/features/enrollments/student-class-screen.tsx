import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';

import { formatSince } from '@/lib/format';
import { useIsOffline } from '@/lib/network';
import { Button, ConfirmSheet, EmptyState, Screen } from '@/ui';

import { useEnrollments, useLeave } from './api';
import { ClassSummaryCard, ClassSummarySkeleton } from './class-summary-card';

const backHome = () => router.dismissTo('/student');

/**
 * P5: one joined class. The API has no single-enrollment endpoint, so this reads the student's
 * enrollment list (already cached from P1) and pages further only if the class is not loaded yet.
 */
export function StudentClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useEnrollments();
  const offline = useIsOffline();
  const leave = useLeave(id);
  const [confirmLeave, setConfirmLeave] = useState(false);

  const enrollment = query.data?.pages
    .flatMap((page) => page.items)
    .find((e) => e.classroom.id === id);
  const searching =
    !enrollment && (query.isPending || query.hasNextPage || query.isFetchingNextPage);

  useEffect(() => {
    if (!enrollment && query.hasNextPage && !query.isFetchingNextPage) void query.fetchNextPage();
  }, [enrollment, query]);

  const appBar = { title: 'Class' };

  if (leave.isSuccess) return null;

  if (enrollment) {
    const { classroom } = enrollment;
    return (
      <Screen
        appBar={appBar}
        footer={
          <Button
            testID="leave-class"
            label="Leave class"
            variant="dangerText"
            icon="exit-outline"
            disabled={offline}
            onPress={() => setConfirmLeave(true)}
          />
        }
      >
        <ClassSummaryCard
          classroom={classroom}
          joined={`Joined ${formatSince(enrollment.joinedAt)}`}
        />
        <ConfirmSheet
          visible={confirmLeave}
          title={`Leave ${classroom.name}?`}
          message="You'll lose access right away. To come back, you'll need a new code from your teacher."
          confirmLabel="Leave class"
          busyLabel="Leaving…"
          cancelLabel="Stay in class"
          onCancel={() => setConfirmLeave(false)}
          onConfirm={async () => {
            await leave.mutateAsync();
            setConfirmLeave(false);
            backHome();
          }}
        />
      </Screen>
    );
  }

  if (searching) {
    return (
      <Screen
        appBar={appBar}
        footer={
          <Button
            label="Leave class"
            variant="dangerText"
            icon="exit-outline"
            disabled
            onPress={() => {}}
          />
        }
      >
        <ClassSummarySkeleton />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen
        appBar={appBar}
        center
        footer={<Button label="Try again" icon="refresh" onPress={() => void query.refetch()} />}
      >
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load this class"
          message="Check your connection and try again."
        />
      </Screen>
    );
  }

  // Removed by the teacher, or the class was deleted since the list was loaded.
  return (
    <Screen
      appBar={appBar}
      center
      footer={<Button label="Back to my classrooms" onPress={backHome} />}
    >
      <EmptyState
        icon="file-tray-outline"
        tone="neutral"
        title="This class is no longer available"
        message="Your teacher removed you or deleted the class."
      />
    </Screen>
  );
}
