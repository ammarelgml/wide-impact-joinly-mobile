import { router } from 'expo-router';
import { AccessibilityInfo, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Classroom } from '@/api/client';
import { ProfileButton } from '@/features/auth/profile-button';
import { formatStudentCount } from '@/lib/format';
import { useIsOffline } from '@/lib/network';
import {
  Banner,
  Button,
  Card,
  EmptyState,
  ExtendedFab,
  Icon,
  Loading,
  Screen,
  SkeletonBlock,
  StatusPill,
  Text,
  colors,
  font,
  radius,
  space,
} from '@/ui';

import { useClassrooms } from './api';

function openClassroom(id: string) {
  router.push({ pathname: '/teacher/classrooms/[id]', params: { id } });
}

function newClassroom() {
  router.push('/teacher/classrooms/new');
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
      <View style={styles.cardMain}>
        <Text variant="subhead" numberOfLines={1}>
          {classroom.name}
        </Text>
        <View style={styles.meta}>
          <Icon name="people-outline" size={16} color={colors.ink2} />
          <Text style={styles.metaText}>{formatStudentCount(classroom.studentCount)}</Text>
        </View>
        <StatusPill kind={classroom.joiningOpen ? 'open' : 'closed'} label={status} />
      </View>
      <Icon name="chevron-forward" size={20} color={colors.ink2} />
    </Card>
  );
}

function SkeletonCards() {
  return (
    <Loading>
      {[0, 1, 2, 3].map((i) => (
        <Card key={i} style={styles.card}>
          <View style={styles.cardMain}>
            <SkeletonBlock width="72%" height={18} />
            <SkeletonBlock width="44%" height={14} />
            <SkeletonBlock width={104} height={24} rounded={radius.full} />
          </View>
        </Card>
      ))}
    </Loading>
  );
}

/** T1: the teacher's classrooms. */
export function ClassroomsScreen() {
  const query = useClassrooms();
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const classrooms = query.data?.pages.flatMap((page) => page.items) ?? [];
  const appBar = { title: 'My classrooms', large: true, leading: null, action: <ProfileButton /> };

  if (query.isError && classrooms.length === 0) {
    return (
      <Screen
        appBar={appBar}
        center
        footer={
          <Button
            label="Retry"
            icon="refresh"
            busy={query.isFetching}
            busyLabel="Retrying…"
            onPress={() => void query.refetch()}
          />
        }
      >
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load your classrooms"
          message="Check your connection and try again."
        />
      </Screen>
    );
  }

  // Opened offline with nothing cached: the query is paused, not loading, so skeletons would never end.
  if (query.isPending && query.fetchStatus === 'paused') {
    return (
      <Screen appBar={appBar} center offline={false}>
        <EmptyState
          icon="cloud-offline-outline"
          title="You're offline"
          message="Connect to the internet to see your classrooms."
        />
      </Screen>
    );
  }

  if (!query.isPending && classrooms.length === 0) {
    return (
      <Screen
        appBar={appBar}
        center
        footer={
          <Button
            testID="new-classroom"
            label="New classroom"
            icon="add"
            disabled={offline}
            onPress={newClassroom}
          />
        }
      >
        <EmptyState
          icon="easel-outline"
          title="Create your first classroom"
          message="Then invite students with a QR code or a 6-digit code."
        />
      </Screen>
    );
  }

  return (
    <Screen
      appBar={appBar}
      scroll={false}
      contentStyle={styles.noPad}
      overlay={
        <ExtendedFab
          testID="new-classroom"
          label="New classroom"
          icon="add"
          disabled={offline || query.isPending}
          bottomInset={insets.bottom}
          onPress={newClassroom}
        />
      }
    >
      <FlatList
        data={query.isPending ? [] : classrooms}
        keyExtractor={(c) => c.id}
        renderItem={({ item }) => <ClassroomCard classroom={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: 112 + insets.bottom }]}
        ListHeaderComponent={
          query.isError ? (
            <Banner tone="error" message="Couldn't refresh. Showing your last loaded classrooms." />
          ) : undefined
        }
        ListEmptyComponent={query.isPending ? <SkeletonCards /> : undefined}
        onEndReached={() =>
          query.hasNextPage && !query.isFetchingNextPage && void query.fetchNextPage()
        }
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={query.isRefetching && !query.isFetchingNextPage}
            onRefresh={() => {
              AccessibilityInfo.announceForAccessibility('Refreshing classrooms');
              void query.refetch();
            }}
            colors={[colors.primary]}
            progressBackgroundColor={colors.surface}
          />
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPad: { paddingTop: 0, paddingHorizontal: 0, paddingBottom: 0 },
  list: { flexGrow: 1, gap: space[3], paddingTop: space[2], paddingHorizontal: space[4] },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 88 },
  cardMain: { flex: 1, minWidth: 0, gap: 6 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  metaText: { ...font(500, 14, 20), color: colors.ink2 },
});
