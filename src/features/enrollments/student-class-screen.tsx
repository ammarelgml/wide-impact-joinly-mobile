import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatSince, formatStudentCount } from '@/lib/format';
import {
  Avatar,
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  Icon,
  Screen,
  SkeletonBlock,
  Text,
  colors,
  spacing,
} from '@/ui';

import { useEnrollments, useLeave } from './api';

/**
 * P5: one joined class. The API has no single-enrollment endpoint, so this reads the student's
 * enrollment list (already cached from P1) and pages further only if the class is not loaded yet.
 */
export function StudentClassScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const query = useEnrollments();
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

  const title = <Stack.Screen options={{ title: '' }} />;

  if (leave.isSuccess) return null;

  if (enrollment) {
    const { classroom } = enrollment;
    return (
      <Screen
        footer={
          <Button
            testID="leave-class"
            label="Leave class"
            variant="dangerGhost"
            icon="exit-outline"
            onPress={() => setConfirmLeave(true)}
          />
        }
      >
        {title}
        <Text variant="title" accessibilityRole="header">
          {classroom.name}
        </Text>
        {classroom.description ? <Text tone="muted">{classroom.description}</Text> : null}
        <Card style={styles.card}>
          <View style={styles.row}>
            <Avatar name={classroom.teacher.name} uri={classroom.teacher.avatarUrl} size={48} />
            <View>
              <Text variant="caption" tone="muted">
                Teacher
              </Text>
              <Text variant="bodyStrong">{classroom.teacher.name}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <Icon name="calendar-outline" color={colors.textMuted} />
            <Text>Joined {formatSince(enrollment.joinedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Icon name="people-outline" color={colors.textMuted} />
            <Text>{formatStudentCount(classroom.studentCount)}</Text>
          </View>
        </Card>

        <ConfirmDialog
          visible={confirmLeave}
          title={`Leave "${classroom.name}"?`}
          message="You'll need a new code from your teacher to join again."
          confirmLabel="Leave class"
          destructive
          onCancel={() => setConfirmLeave(false)}
          onConfirm={async () => {
            await leave.mutateAsync();
            setConfirmLeave(false);
            router.back();
          }}
        />
      </Screen>
    );
  }

  if (searching) {
    return (
      <Screen>
        {title}
        <SkeletonBlock width="70%" height={28} />
        <SkeletonBlock height={120} />
      </Screen>
    );
  }

  if (query.isError) {
    return (
      <Screen>
        {title}
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      </Screen>
    );
  }

  // Removed by the teacher, or the class was deleted since the list was loaded.
  return (
    <Screen>
      {title}
      <EmptyState
        icon="alert-circle-outline"
        title="This class is no longer available"
        message="Your teacher may have removed you or deleted the class."
      >
        <Button label="Back to my classes" onPress={() => router.back()} />
      </EmptyState>
    </Screen>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
});
