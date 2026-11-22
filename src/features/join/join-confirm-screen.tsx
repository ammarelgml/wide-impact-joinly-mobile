import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';

import type { ClassroomSummary, JoinedVia } from '@/api/client';
import { isApiError } from '@/api/errors';
import { errorMessage } from '@/api/messages';
import { setPendingJoinCode, useSession } from '@/features/auth/session';
import { usePreview, useJoin } from '@/features/enrollments/api';
import { formatStudentCount } from '@/lib/format';
import {
  Avatar,
  Banner,
  Button,
  Card,
  EmptyState,
  Icon,
  Screen,
  SkeletonBlock,
  Text,
  colors,
  spacing,
} from '@/ui';

import { isJoinCode } from './join-code';

function openClass(id: string) {
  router.dismissTo('/student');
  router.push({ pathname: '/student/classes/[id]', params: { id } });
}

function ClassSummaryCard({ classroom }: { classroom: ClassroomSummary }) {
  return (
    <Card style={styles.summary}>
      <Text variant="title" testID="preview-name">
        {classroom.name}
      </Text>
      {classroom.description ? <Text tone="muted">{classroom.description}</Text> : null}
      <View style={styles.teacher}>
        <Avatar name={classroom.teacher.name} uri={classroom.teacher.avatarUrl} size={40} />
        <View>
          <Text variant="caption" tone="muted">
            Teacher
          </Text>
          <Text variant="bodyStrong">{classroom.teacher.name}</Text>
        </View>
      </View>
      <Text tone="muted">{formatStudentCount(classroom.studentCount)}</Text>
    </Card>
  );
}

/** P4: preview the class behind a code, then join. P6 (the success moment) is the joined state of this screen. */
export function JoinConfirmScreen() {
  const params = useLocalSearchParams<{ code?: string; via?: string }>();
  const code = isJoinCode(params.code) ? params.code : null;
  const via: JoinedVia = params.via === 'qr' ? 'qr' : 'code';
  const pendingJoinCode = useSession((s) => s.pendingJoinCode);

  // The deep-link intent has been delivered; drop it so it never fires twice.
  useEffect(() => {
    if (pendingJoinCode) setPendingJoinCode(null);
  }, [pendingJoinCode]);

  if (!code) {
    return (
      <Screen>
        <EmptyState icon="alert-circle" title="That link isn't a valid invite">
          <Button label="Enter a code" onPress={() => router.replace('/student/join/code')} />
        </EmptyState>
      </Screen>
    );
  }
  return <Confirm code={code} via={via} />;
}

function Confirm({ code, via }: { code: string; via: JoinedVia }) {
  const preview = usePreview(code);
  const join = useJoin();

  useEffect(() => {
    if (!join.isSuccess) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = setTimeout(() => openClass(join.data.classroom.id), 1200);
    return () => clearTimeout(id);
  }, [join.isSuccess, join.data]);

  const tryAnother = (
    <>
      <Button label="Enter a different code" onPress={() => router.replace('/student/join/code')} />
      <Button
        label="Scan a QR code"
        variant="secondary"
        icon="qr-code-outline"
        onPress={() => router.replace('/student/join/scan')}
      />
    </>
  );

  // P6: joined.
  if (join.isSuccess) {
    return (
      <Screen
        footer={<Button label="Continue" onPress={() => openClass(join.data.classroom.id)} />}
      >
        <View style={styles.success} accessibilityLiveRegion="assertive">
          <View style={styles.successIcon}>
            <Icon name="checkmark" size={48} color={colors.onPrimary} />
          </View>
          <Text variant="title" align="center">
            {join.data.alreadyMember ? "You're already in this class" : "You're in!"}
          </Text>
          <Text tone="muted" align="center">
            {join.data.classroom.name}
          </Text>
        </View>
      </Screen>
    );
  }

  if (preview.isPending) {
    return (
      <Screen>
        <Card style={styles.summary}>
          <SkeletonBlock width="70%" height={28} />
          <SkeletonBlock width="50%" height={16} />
          <SkeletonBlock width="40%" height={16} />
        </Card>
      </Screen>
    );
  }

  if (preview.isError) {
    const expired = isApiError(preview.error, 'JOIN_CODE_EXPIRED');
    const closed = isApiError(preview.error, 'JOINING_CLOSED');
    return (
      <Screen footer={tryAnother}>
        <EmptyState
          icon={expired ? 'time-outline' : closed ? 'lock-closed-outline' : 'alert-circle-outline'}
          title={
            expired
              ? 'This code has expired'
              : closed
                ? 'Joining is closed'
                : "We couldn't open this invite"
          }
          message={errorMessage(preview.error)}
        />
        {isApiError(preview.error, 'NETWORK') ? (
          <Button label="Try again" variant="secondary" onPress={() => void preview.refetch()} />
        ) : null}
      </Screen>
    );
  }

  const { classroom, alreadyMember } = preview.data;

  if (alreadyMember) {
    return (
      <Screen footer={<Button label="Open class" onPress={() => openClass(classroom.id)} />}>
        <Banner tone="success" message="You're already in this class." />
        <ClassSummaryCard classroom={classroom} />
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <>
          <Button
            testID="join-confirm"
            label="Join class"
            loading={join.isPending}
            onPress={() => join.mutate({ code, via })}
          />
          <Button
            label="Cancel"
            variant="secondary"
            disabled={join.isPending}
            onPress={() => router.back()}
          />
        </>
      }
    >
      <Text variant="heading" tone="muted">
        You&apos;re about to join
      </Text>
      <ClassSummaryCard classroom={classroom} />
      {join.isError ? <Banner tone="error" message={errorMessage(join.error)} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  summary: { gap: spacing.md },
  teacher: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  success: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.md },
  successIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
