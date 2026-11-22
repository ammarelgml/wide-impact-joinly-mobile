import { router } from 'expo-router';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';

import type { Classroom } from '@/api/client';
import { formatStudentCount } from '@/lib/format';
import {
  Badge,
  Banner,
  Button,
  Card,
  EmptyState,
  ErrorState,
  Icon,
  OfflineBanner,
  Screen,
  SkeletonList,
  Text,
  colors,
  spacing,
} from '@/ui';

import { useClassrooms } from './api';

function openClassroom(id: string) {
  router.push({ pathname: '/teacher/classrooms/[id]', params: { id } });
}

function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const status = classroom.joiningOpen ? 'Joining open' : 'Joining closed';
  return (
    <Card
      testID={`classroom-${classroom.id}`}
      onPress={() => openClassroom(classroom.id)}
      accessibilityLabel={`${classroom.name}, ${formatStudentCount(classroom.studentCount)}, ${status}`}
      accessibilityHint="Opens the classroom"
      style={styles.card}
    >
      <View style={styles.cardText}>
        <Text variant="heading" numberOfLines={2}>
          {classroom.name}
        </Text>
        <View style={styles.meta}>
          <Text tone="muted">{formatStudentCount(classroom.studentCount)}</Text>
          <Badge
            label={status}
            tone={classroom.joiningOpen ? 'success' : 'neutral'}
            icon={classroom.joiningOpen ? 'lock-open' : 'lock-closed'}
          />
        </View>
      </View>
      <Icon name="chevron-forward" color={colors.textMuted} />
    </Card>
  );
}

/** T1: the teacher's classrooms. */
export function ClassroomsScreen() {
  const query = useClassrooms();
  const classrooms = query.data?.pages.flatMap((page) => page.items) ?? [];
  const newClassroom = () => router.push('/teacher/classrooms/new');

  let body;
  if (query.isPending) body = <SkeletonList />;
  else if (query.isError && classrooms.length === 0)
    body = <ErrorState error={query.error} onRetry={() => void query.refetch()} />;
  else if (classrooms.length === 0)
    body = (
      <EmptyState
        icon="easel"
        title="Create your first classroom"
        message="Then invite students with a QR code or a 6-digit code."
      />
    );

  return (
    <Screen
      scroll={false}
      offlineBanner={false}
      footer={
        <Button testID="new-classroom" label="New classroom" icon="add" onPress={newClassroom} />
      }
    >
      <FlatList
        data={body ? [] : classrooms}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ClassroomCard classroom={item} />}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <View style={styles.header}>
            <OfflineBanner />
            {query.isError && classrooms.length > 0 ? (
              <Banner
                tone="error"
                message="Couldn't refresh. Showing your last loaded classrooms."
              />
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
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, gap: spacing.md, paddingBottom: spacing.lg },
  header: { gap: spacing.sm },
  card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  cardText: { flex: 1, gap: spacing.xs },
  meta: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, flexWrap: 'wrap' },
});
