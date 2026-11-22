import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { RefreshControl, StyleSheet, View } from 'react-native';

import type { Classroom, RosterStudent } from '@/api/client';
import { isApiError } from '@/api/errors';
import { errorMessage } from '@/api/messages';
import { formatJoinCode } from '@/lib/format';
import { useIsOffline } from '@/lib/network';
import { useNow } from '@/lib/use-now';
import {
  Avatar,
  Banner,
  Button,
  Card,
  ConfirmSheet,
  EmptyState,
  IconButton,
  ListGroup,
  Loading,
  Screen,
  Sheet,
  SheetOption,
  SkeletonBlock,
  StateIcon,
  SwitchRow,
  Text,
  colors,
  radius,
  space,
} from '@/ui';

import {
  ROSTER_POLL_MS,
  useClassroom,
  useRegenerateCode,
  useRemoveStudent,
  useRoster,
  useUpdateClassroom,
} from './api';
import { InviteCard } from './invite-card';
import { REGENERATE_MESSAGE, REGENERATE_TITLE, inviteState } from './join-code-status';
import { RosterRow, RosterSkeleton } from './roster-row';

function openInvite(id: string) {
  router.push({ pathname: '/teacher/classrooms/[id]/invite', params: { id } });
}

function editAction(id: string) {
  return (
    <IconButton
      testID="edit-classroom"
      icon="create-outline"
      label="Edit classroom"
      onPress={() => router.push({ pathname: '/teacher/classrooms/[id]/edit', params: { id } })}
    />
  );
}

/** T3: one classroom, its invite card, the joining switch and the roster. */
export function ClassroomScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const focused = useIsFocused();
  const classroom = useClassroom(id, { pollMs: focused && ROSTER_POLL_MS });

  if (classroom.data) return <ClassroomDetail classroom={classroom.data} focused={focused} />;

  if (classroom.isError) {
    const gone = isApiError(classroom.error, 'NOT_FOUND');
    return (
      <Screen
        appBar={{ title: 'Classroom' }}
        center
        footer={
          gone ? (
            <Button label="Back to my classrooms" onPress={() => router.dismissTo('/teacher')} />
          ) : (
            <Button label="Retry" icon="refresh" onPress={() => void classroom.refetch()} />
          )
        }
      >
        <EmptyState
          icon={gone ? 'file-tray-outline' : 'cloud-offline-outline'}
          tone={gone ? 'neutral' : 'error'}
          title={gone ? 'This classroom no longer exists' : "Couldn't load this classroom"}
          message={gone ? undefined : 'Check your connection and try again.'}
        />
      </Screen>
    );
  }

  return (
    <Screen
      appBar={{ action: editAction(id) }}
      footerBar
      footer={<Button label="Show QR code" icon="qr-code-outline" disabled onPress={() => {}} />}
    >
      <Loading>
        <SkeletonBlock width="75%" height={28} />
        <SkeletonBlock width="85%" height={16} />
        <View style={styles.skeletonCard}>
          <SkeletonBlock width="40%" height={14} />
          <SkeletonBlock width="60%" height={32} />
          <SkeletonBlock width="45%" height={12} />
        </View>
        <SkeletonBlock height={72} rounded={radius.lg} />
        <View style={{ marginTop: space[2] }}>
          <SkeletonBlock width="30%" height={18} />
        </View>
        <ListGroup>
          <RosterSkeleton />
        </ListGroup>
      </Loading>
    </Screen>
  );
}

function ClassroomDetail({ classroom, focused }: { classroom: Classroom; focused: boolean }) {
  const now = useNow();
  const offline = useIsOffline();
  // New students appear without a pull to refresh while this screen is in front.
  const roster = useRoster(classroom.id, { pollMs: focused && ROSTER_POLL_MS });
  const update = useUpdateClassroom(classroom.id);
  const regenerate = useRegenerateCode(classroom.id);
  const remove = useRemoveStudent(classroom.id);

  const [menuFor, setMenuFor] = useState<RosterStudent | null>(null);
  const [confirmRemove, setConfirmRemove] = useState<RosterStudent | null>(null);
  const [offerRegenerate, setOfferRegenerate] = useState<RosterStudent | null>(null);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  // Polling refetches quietly; only a pull shows the spinner.
  const [pulling, setPulling] = useState(false);

  const state = inviteState(classroom, now);
  const students = roster.data?.pages.flatMap((page) => page.items) ?? [];
  const total = roster.data?.pages[0]?.total ?? classroom.studentCount;

  const primary =
    state.kind === 'live' ? (
      <Button
        testID="show-qr"
        label="Show QR code"
        icon="qr-code-outline"
        onPress={() => openInvite(classroom.id)}
      />
    ) : state.kind === 'closed' ? (
      <Button
        testID="turn-on-joining"
        label="Turn on joining"
        busy={update.isPending}
        busyLabel="Turning on…"
        disabled={offline}
        onPress={() => update.mutate({ joiningOpen: true })}
      />
    ) : (
      <Button
        testID="regenerate-code"
        label="Regenerate code"
        icon="refresh"
        disabled={offline}
        onPress={() => setConfirmRegenerate(true)}
      />
    );

  return (
    <Screen
      appBar={{ action: editAction(classroom.id) }}
      footerBar
      footer={primary}
      refreshControl={
        <RefreshControl
          refreshing={pulling}
          onRefresh={() => {
            setPulling(true);
            void roster.refetch().finally(() => setPulling(false));
          }}
          colors={[colors.primary]}
        />
      }
    >
      <Text variant="title" accessibilityRole="header" testID="classroom-title">
        {classroom.name}
      </Text>
      {classroom.description ? (
        <Text variant="body2" style={styles.description}>
          {classroom.description}
        </Text>
      ) : null}

      <InviteCard state={state} now={now} />
      {regenerate.isError && !confirmRegenerate && !offerRegenerate ? (
        <Banner tone="error" message={errorMessage(regenerate.error)} />
      ) : null}

      <SwitchRow
        testID="joining-switch"
        title="Joining open"
        subtitle={
          classroom.joiningOpen
            ? 'Students can join with the code or QR'
            : "New students can't join"
        }
        value={classroom.joiningOpen}
        disabled={offline}
        onValueChange={(joiningOpen) => update.mutate({ joiningOpen })}
      />
      {update.isError ? <Banner tone="error" message={errorMessage(update.error)} /> : null}

      <View style={styles.sectionHeader}>
        <Text variant="subhead" accessibilityRole="header">
          Students
        </Text>
        <Text variant="label" tone="muted" testID="student-total">
          {total}
        </Text>
      </View>

      {roster.isPending ? (
        <ListGroup>
          <RosterSkeleton />
        </ListGroup>
      ) : roster.isError && students.length === 0 ? (
        <Card style={styles.emptyCard}>
          <Text variant="subhead">Couldn&apos;t load the students</Text>
          <Text variant="body2" align="center">
            Check your connection and try again.
          </Text>
          <Button
            label="Retry"
            variant="secondary"
            icon="refresh"
            fullWidth={false}
            small
            onPress={() => void roster.refetch()}
          />
        </Card>
      ) : students.length === 0 ? (
        <Card style={styles.emptyCard}>
          <StateIcon icon="people-outline" tone="neutral" size={56} />
          <Text variant="subhead">No students yet</Text>
          <Text variant="body2" align="center">
            {state.kind === 'live'
              ? // A no-break space keeps the two halves of the code on one line.
                `Show the QR code, or share code ${formatJoinCode(state.joinCode.code).replace(' ', '\u00A0')}.`
              : 'Students appear here as they join.'}
          </Text>
        </Card>
      ) : (
        <ListGroup>
          {students.map((student) => (
            <RosterRow key={student.id} student={student} onMenu={() => setMenuFor(student)} />
          ))}
        </ListGroup>
      )}
      {roster.hasNextPage ? (
        <Button
          label="Show more students"
          variant="text"
          busy={roster.isFetchingNextPage}
          busyLabel="Loading…"
          onPress={() => void roster.fetchNextPage()}
        />
      ) : null}

      <Sheet visible={menuFor !== null} onClose={() => setMenuFor(null)}>
        {menuFor ? (
          <View style={styles.menuHeader}>
            <Avatar name={menuFor.name} uri={menuFor.avatarUrl} />
            <View style={styles.grow}>
              <Text variant="subhead" numberOfLines={1} accessibilityRole="header">
                {menuFor.name}
              </Text>
              <Text variant="caption" numberOfLines={1}>
                {menuFor.email}
              </Text>
            </View>
          </View>
        ) : null}
        <SheetOption
          testID="remove-student"
          tone="danger"
          icon="person-remove-outline"
          title="Remove from class"
          disabled={offline}
          onPress={() => {
            setConfirmRemove(menuFor);
            setMenuFor(null);
          }}
        />
        <Button label="Cancel" variant="text" onPress={() => setMenuFor(null)} />
      </Sheet>

      <ConfirmSheet
        visible={confirmRemove !== null}
        title={`Remove ${confirmRemove?.name ?? 'this student'}?`}
        message="They lose access to this class right away. They can rejoin only with a working code."
        confirmLabel="Remove student"
        busyLabel="Removing…"
        onCancel={() => setConfirmRemove(null)}
        onConfirm={async () => {
          if (!confirmRemove) return;
          const student = confirmRemove;
          await remove.mutateAsync(student);
          setConfirmRemove(null);
          // A removed student could rejoin with the current code, so offer the fix right away.
          if (state.kind === 'live') setOfferRegenerate(student);
        }}
      />

      <ConfirmSheet
        visible={offerRegenerate !== null}
        title={`${offerRegenerate?.name ?? 'The student'} was removed`}
        message="If they still have the current code, they could rejoin. A new code stops the old code and QR working for everyone."
        confirmLabel="Regenerate code"
        busyLabel="Regenerating…"
        confirmKind="primary"
        cancelLabel="Keep current code"
        onCancel={() => setOfferRegenerate(null)}
        onConfirm={async () => {
          await regenerate.mutateAsync();
          setOfferRegenerate(null);
        }}
      />

      <ConfirmSheet
        visible={confirmRegenerate}
        title={REGENERATE_TITLE}
        message={REGENERATE_MESSAGE}
        confirmLabel="Regenerate code"
        busyLabel="Regenerating…"
        confirmKind="primary"
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={async () => {
          await regenerate.mutateAsync();
          setConfirmRegenerate(false);
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  description: { marginTop: -6 },
  skeletonCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space[4],
    gap: space[3],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space[2],
    paddingTop: space[2],
    paddingHorizontal: space[1],
    minHeight: 36,
  },
  emptyCard: { alignItems: 'center', gap: space[2], padding: space[5] },
  menuHeader: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  grow: { flex: 1, minWidth: 0 },
});
