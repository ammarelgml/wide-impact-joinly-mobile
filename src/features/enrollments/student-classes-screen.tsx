import { router } from 'expo-router';
import { useState } from 'react';
import { AccessibilityInfo, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Enrollment } from '@/api/client';
import { ProfileButton } from '@/features/auth/profile-button';
import { formatSince } from '@/lib/format';
import { useIsOffline } from '@/lib/network';
import {
  Avatar,
  Banner,
  Button,
  Card,
  EmptyState,
  ExtendedFab,
  Icon,
  Loading,
  Screen,
  Sheet,
  SheetOption,
  SheetTitle,
  SkeletonBlock,
  Text,
  colors,
  font,
  space,
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
      accessibilityLabel={`${classroom.name}, ${classroom.teacher.name}. ${joined}`}
      accessibilityHint="Opens the class"
      style={styles.card}
    >
      <Avatar name={classroom.teacher.name} uri={classroom.teacher.avatarUrl} />
      <View style={styles.cardMain}>
        <Text variant="subhead" numberOfLines={1}>
          {classroom.name}
        </Text>
        <View>
          <Text style={styles.meta} numberOfLines={1}>
            {classroom.teacher.name}
          </Text>
          <Text style={styles.meta}>{joined}</Text>
        </View>
      </View>
      <Icon name="chevron-forward" size={20} color={colors.ink2} />
    </Card>
  );
}

function SkeletonCards() {
  return (
    <Loading>
      {[0, 1, 2].map((i) => (
        <Card key={i} style={styles.card}>
          <SkeletonBlock width={40} height={40} rounded={20} />
          <View style={styles.cardMain}>
            <SkeletonBlock width="72%" height={18} />
            <SkeletonBlock width="44%" height={14} />
          </View>
        </Card>
      ))}
    </Loading>
  );
}

/** P1: the student's classes. "Join a class" opens a chooser with Scan first, the fastest path. */
export function StudentClassesScreen() {
  const query = useEnrollments();
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const [chooser, setChooser] = useState(false);
  const enrollments = query.data?.pages.flatMap((page) => page.items) ?? [];
  const appBar = { title: 'My classrooms', large: true, leading: null, action: <ProfileButton /> };

  if (query.isError && enrollments.length === 0) {
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
          title="Couldn't load your classes"
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
          message="Connect to the internet to see your classes."
        />
      </Screen>
    );
  }

  if (!query.isPending && enrollments.length === 0) {
    return (
      <Screen
        appBar={appBar}
        center
        footer={
          <>
            <Button
              testID="empty-scan"
              label="Scan QR code"
              icon="qr-code-outline"
              disabled={offline}
              onPress={scan}
            />
            <Button
              testID="empty-code"
              label="Enter code"
              icon="keypad-outline"
              variant="secondary"
              disabled={offline}
              onPress={enterCode}
            />
          </>
        }
      >
        <EmptyState
          icon="school-outline"
          title="Join your first class"
          message="Scan your teacher's QR code or type the 6-digit code."
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
          testID="join-class"
          label="Join a class"
          icon="add"
          disabled={offline || query.isPending}
          bottomInset={insets.bottom}
          onPress={() => setChooser(true)}
        />
      }
    >
      <FlatList
        data={query.isPending ? [] : enrollments}
        keyExtractor={(e) => e.classroom.id}
        renderItem={({ item }) => <ClassCard enrollment={item} />}
        contentContainerStyle={[styles.list, { paddingBottom: 112 + insets.bottom }]}
        ListHeaderComponent={
          query.isError ? (
            <Banner tone="error" message="Couldn't refresh. Showing your last loaded classes." />
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

      <Sheet visible={chooser} onClose={() => setChooser(false)}>
        <SheetTitle>Join a class</SheetTitle>
        <SheetOption
          testID="chooser-scan"
          icon="qr-code-outline"
          highlighted
          title="Scan QR code"
          caption="Point your camera at your teacher's screen"
          onPress={() => {
            setChooser(false);
            scan();
          }}
        />
        <SheetOption
          testID="chooser-code"
          icon="keypad-outline"
          title="Enter code"
          caption="Type the 6-digit code"
          onPress={() => {
            setChooser(false);
            enterCode();
          }}
        />
        <Button label="Cancel" variant="text" onPress={() => setChooser(false)} />
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  noPad: { paddingTop: 0, paddingHorizontal: 0, paddingBottom: 0 },
  list: { flexGrow: 1, gap: space[3], paddingTop: space[2], paddingHorizontal: space[4] },
  card: { flexDirection: 'row', alignItems: 'center', gap: space[3], minHeight: 88 },
  cardMain: { flex: 1, minWidth: 0, gap: 6 },
  meta: { ...font(500, 14, 20), color: colors.ink2 },
});
