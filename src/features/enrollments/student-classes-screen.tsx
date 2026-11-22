import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Enrollment } from '@/api/client';
import { formatSince } from '@/lib/format';
import {
  Avatar,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  OfflineBanner,
  Screen,
  Sheet,
  SkeletonList,
  Text,
  colors,
  spacing,
} from '@/ui';

import { useEnrollments } from './api';

const scan = () => router.push('/student/join/scan');
const enterCode = () => router.push('/student/join/code');

function ClassCard({ enrollment }: { enrollment: Enrollment }) {
  const { classroom } = enrollment;
  const joined = `Joined ${formatSince(enrollment.joinedAt)}`;
  return (
    <Card
      testID={`class-${classroom.id}`}
      onPress={() =>
        router.push({ pathname: '/student/classes/[id]', params: { id: classroom.id } })
      }
      accessibilityLabel={`${classroom.name}, taught by ${classroom.teacher.name}. ${joined}`}
      accessibilityHint="Opens the class"
      style={styles.card}
    >
      <View style={styles.cardText}>
        <Text variant="heading" numberOfLines={2}>
          {classroom.name}
        </Text>
        <View style={styles.teacher}>
          <Avatar name={classroom.teacher.name} uri={classroom.teacher.avatarUrl} size={24} />
          <Text tone="muted" numberOfLines={1} style={styles.flex}>
            {classroom.teacher.name}
          </Text>
        </View>
        <Text variant="caption" tone="muted">
          {joined}
        </Text>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

/** P1: the student's classes. */
export function StudentClassesScreen() {
  const query = useEnrollments();
  const [chooser, setChooser] = useState(false);
  const enrollments = query.data?.pages.flatMap((page) => page.items) ?? [];

  let body;
  if (query.isPending) body = <SkeletonList />;
  else if (query.isError && enrollments.length === 0)
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else if (enrollments.length === 0)
    body = (
      <EmptyState
        icon="school-outline"
        title="Join your first class"
        message="Scan the QR code your teacher shows, or type their 6-digit code."
      >
        <Button testID="empty-scan" label="Scan QR" icon="qr-code" onPress={scan} />
        <Button
          testID="empty-code"
          label="Enter code"
          icon="keypad-outline"
          variant="secondary"
          onPress={enterCode}
        />
      </EmptyState>
    );

  const showFooter = enrollments.length > 0;

  return (
    <Screen
      scroll={false}
      offlineBanner={false}
      footer={
        showFooter ? (
          <Button
            testID="join-class"
            label="Join a class"
            icon="add"
            onPress={() => setChooser(true)}
          />
        ) : undefined
      }
    >
      <FlatList
        data={body ? [] : enrollments}
        keyExtractor={(e) => e.classroom.id}
        renderItem={({ item }) => <ClassCard enrollment={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <OfflineBanner />
            {query.isError && enrollments.length > 0 ? (
              <Banner tone="error" message="Couldn't refresh. Showing your last loaded classes." />
            ) : null}
          </View>
        }
        ListEmptyComponent={body}
        onEndReached={() =>
          query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()
        }
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => void query.refetch()}
            colors={[colors.primary]}
          />
        }
      />

      <Sheet visible={chooser} onClose={() => setChooser(false)}>
        <Text variant="heading" accessibilityRole="header">
          Join a class
        </Text>
        <Button
          label="Scan QR code"
          icon="qr-code"
          onPress={() => {
            setChooser(false);
            scan();
          }}
        />
        <Button
          label="Enter 6-digit code"
          icon="keypad-outline"
          variant="secondary"
          onPress={() => {
            setChooser(false);
            enterCode();
          }}
        />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.lg },
  header: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardText: { flex: 1, gap: spacing.xs },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  flex: { flex: 1 },
});
