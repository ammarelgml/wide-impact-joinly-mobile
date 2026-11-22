import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, Switch, View } from 'react-native';

import type { Classroom, RosterStudent } from '@/api/client';
import { errorMessage } from '@/api/messages';
import { useNow } from '@/lib/use-now';
import {
  Banner,
  Button,
  ConfirmDialog,
  EmptyState,
  ErrorState,
  IconButton,
  OfflineBanner,
  Screen,
  Sheet,
  SkeletonBlock,
  SkeletonList,
  Text,
  colors,
  radius,
  spacing,
} from '@/ui';

import {
  useClassroom,
  useRegenerateCode,
  useRemoveStudent,
  useRoster,
  useUpdateClassroom,
} from './api';
import { InviteCard } from './invite-card';
import { REGENERATE_MESSAGE } from './join-code-status';
import { RosterRow } from './roster-row';

function openInvite(id: string) {
  router.push({ pathname: '/teacher/classrooms/[id]/invite', params: { id } });
}

/** T3: one classroom, its invite card, the joining switch and the roster. */
export function ClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const classroom = useClassroom(id);

  return (
    <>
      <Stack.Screen
        options={{
          title: classroom.data?.name ?? '',
          headerRight: () =>
            classroom.data ? (
              <IconButton
                icon="create-outline"
                label="Edit classroom"
                onPress={() =>
                  router.push({ pathname: '/teacher/classrooms/[id]/edit', params: { id } })
                }
              />
            ) : null,
        }}
      />
      {classroom.data ? (
        <ClassroomDetail classroom={classroom.data} onRefresh={() => classroom.refetch()} />
      ) : classroom.isError ? (
        <Screen>
          <ErrorState error={classroom.error} onRetry={() => void classroom.refetch()} />
        </Screen>
      ) : (
        <Screen>
          <SkeletonBlock width="70%" height={28} />
          <SkeletonList count={3} />
        </Screen>
      )}
    </>
  );
}

function ClassroomDetail({
  classroom,
  onRefresh,
}: {
  classroom: Classroom;
  onRefresh: () => Promise<unknown>;
}) {
  const now = useNow();
  const roster = useRoster(classroom.id);
  const update = useUpdateClassroom(classroom.id);
  const regenerate = useRegenerateCode(classroom.id);
  const remove = useRemoveStudent(classroom.id);

  const [menuFor, setMenuFor] = useState<RosterStudent | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<RosterStudent | null>(null);
  const [offerRegenerate, setOfferRegenerate] = useState<RosterStudent | null>(null);

  const students = roster.data?.pages.flatMap((page) => page.items) ?? [];
  const total = roster.data?.pages[0]?.total ?? classroom.studentCount;
  const refreshing = roster.isRefetching && !roster.isFetchingNextPage;

  const header = (
    <View style={styles.header}>
      <OfflineBanner />
      {classroom.description ? <Text tone="muted">{classroom.description}</Text> : null}

      <InviteCard
        classroom={classroom}
        now={now}
        onShowQr={() => openInvite(classroom.id)}
        onRegenerate={() => regenerate.mutate()}
        regenerating={regenerate.isPending}
      />
      {regenerate.isError ? <Banner tone="error" message={errorMessage(regenerate.error)} /> : null}

      <View style={styles.switchRow}>
        <View style={styles.switchText}>
          <Text variant="bodyStrong">Joining open</Text>
          <Text variant="caption" tone="muted">
            {classroom.joiningOpen
              ? 'Students can join with the code or QR.'
              : 'New students can’t join. Students already in stay.'}
          </Text>
        </View>
        <Switch
          testID="joining-switch"
          value={classroom.joiningOpen}
          onValueChange={(joiningOpen) => update.mutate({ joiningOpen })}
          accessibilityLabel="Joining open"
          trackColor={{ true: colors.primary, false: colors.border }}
          thumbColor={colors.surface}
        />
      </View>
      {update.isError ? <Banner tone="error" message={errorMessage(update.error)} /> : null}
      {remove.isError ? <Banner tone="error" message={errorMessage(remove.error)} /> : null}

      <Text variant="heading" accessibilityRole="header" style={styles.rosterTitle}>
        Students ({total})
      </Text>
    </View>
  );

  let rosterEmpty;
  if (roster.isPending) rosterEmpty = <SkeletonList count={3} />;
  else if (roster.isError && students.length === 0)
    rosterEmpty = <ErrorState error={roster.error} onRetry={() => void roster.refetch()} />;
  else
    rosterEmpty = (
      <EmptyState
        icon="people-outline"
        title="No students yet"
        message="Show the QR code or share the 6-digit code with your class."
      >
        {classroom.joiningOpen && classroom.joinCode ? (
          <Button
            label="Show QR"
            icon="qr-code"
            variant="secondary"
            onPress={() => openInvite(classroom.id)}
          />
        ) : null}
      </EmptyState>
    );

  return (
    <Screen scroll={false} offlineBanner={false}>
      <FlatList
        data={students}
        keyExtractor={(s) => s.id}
        renderItem={({ item, index }) => (
          <View
            style={[
              styles.rowWrap,
              index === 0 && styles.first,
              index === students.length - 1 && styles.last,
            ]}
          >
            <RosterRow student={item} onMenu={() => setMenuFor(item)} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListHeaderComponent={header}
        ListEmptyComponent={rosterEmpty}
        ListFooterComponent={
          roster.hasNextPage ? (
            <Button
              label="Show more students"
              variant="ghost"
              loading={roster.isFetchingNextPage}
              onPress={() => void roster.fetchNextPage()}
            />
          ) : undefined
        }
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => void Promise.all([onRefresh(), roster.refetch()])}
            colors={[colors.primary]}
          />
        }
      />

      <Sheet visible={menuFor !== null} onClose={() => setMenuFor(null)}>
        <Text variant="heading">{menuFor?.name}</Text>
        <Button
          testID="remove-student"
          label="Remove from class"
          variant="dangerGhost"
          icon="person-remove-outline"
          onPress={() => {
            setConfirmRemove(menuFor);
            setMenuFor(null);
          }}
        />
      </Sheet>

      <ConfirmDialog
        visible={confirmRemove !== null}
        title={`Remove ${confirmRemove?.name ?? 'student'}?`}
        message="They will lose access to this class. They can join again only with a valid code."
        confirmLabel="Remove"
        destructive
        onCancel={() => setConfirmRemove(null)}
        onConfirm={async () => {
          if (!confirmRemove) return;
          const student = confirmRemove;
          await remove.mutateAsync(student);
          setConfirmRemove(null);
          // A removed student could rejoin with the current code, so offer the fix right away (spec D11).
          if (classroom.joiningOpen && classroom.joinCode) setOfferRegenerate(student);
        }}
      />

      <ConfirmDialog
        visible={offerRegenerate !== null}
        title="Also regenerate the code?"
        message={`${offerRegenerate?.name ?? 'They'} could rejoin with the current code. ${REGENERATE_MESSAGE}`}
        confirmLabel="Regenerate code"
        cancelLabel="Keep current code"
        onCancel={() => setOfferRegenerate(null)}
        onConfirm={async () => {
          await regenerate.mutateAsync();
          setOfferRegenerate(null);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: { flexGrow: 1, paddingBottom: spacing.xl },
  header: { gap: spacing.lg, marginBottom: spacing.md },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
    minHeight: 72,
  },
  switchText: { flex: 1, gap: spacing.xxs },
  rosterTitle: { marginTop: spacing.sm },
  rowWrap: {
    overflow: 'hidden',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: colors.border,
  },
  first: { borderTopWidth: 1, borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg },
  last: {
    borderBottomWidth: 1,
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing.lg,
  },
});
