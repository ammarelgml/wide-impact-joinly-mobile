import * as Haptics from 'expo-haptics';
import { router, useLocalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import { BackHandler } from 'react-native';

import type { JoinedVia } from '@/api/client';
import { isApiError } from '@/api/errors';
import { errorMessage } from '@/api/messages';
import { setPendingJoinCode, useSession } from '@/features/auth/session';
import { ClassSummaryCard, ClassSummarySkeleton } from '@/features/enrollments/class-summary-card';
import { usePreview, useJoin } from '@/features/enrollments/api';
import { useIsOffline } from '@/lib/network';
import { Banner, Button, EmptyState, Screen, StateIcon, Text, goBackOr, motion } from '@/ui';

import { isJoinCode } from './join-code';

const appBar = { title: 'Join class', leading: 'close' as const, onLeading: goBack };
const OFFLINE = "You're offline. Connect to join this class.";

/** Back where the student came from, or home when the confirm was opened straight from a QR link. */
function goBack() {
  goBackOr('/student');
}

function openClass(id: string) {
  router.dismissTo('/student');
  router.push({ pathname: '/student/classes/[id]', params: { id } });
}

const enterCode = () => router.replace('/student/join/code');
const scanQr = () => router.replace('/student/join/scan');

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

  // Opened cold from a QR link there is nothing behind this screen, so Android's back button would
  // close the app. Send it home instead, like the close button.
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (router.canGoBack()) return false;
      goBack();
      return true;
    });
    return () => sub.remove();
  }, []);

  if (!code) {
    return (
      <Screen
        appBar={appBar}
        center
        footer={
          <>
            <Button label="Enter code" icon="keypad-outline" onPress={enterCode} />
            <Button
              label="Scan QR code"
              variant="secondary"
              icon="qr-code-outline"
              onPress={scanQr}
            />
          </>
        }
      >
        <EmptyState
          icon="alert-circle-outline"
          tone="error"
          title="That link isn't a valid invite"
          message="Scan your teacher's QR code again, or type the 6-digit code."
        />
      </Screen>
    );
  }
  return <Confirm code={code} via={via} />;
}

function Joined({
  name,
  teacher,
  onContinue,
}: {
  name: string;
  teacher: string;
  onContinue: () => void;
}) {
  return (
    <Screen
      surface
      center
      offline={false}
      footer={<Button testID="joined-continue" label="Continue" onPress={onContinue} />}
    >
      <StateIcon icon="checkmark" tone="success" size={96} />
      <Text variant="display" align="center" accessibilityRole="header" testID="joined">
        You&apos;re in
      </Text>
      <Text variant="subhead" align="center" accessibilityLiveRegion="assertive">
        {name}
      </Text>
      <Text variant="body2" align="center">
        {teacher}&apos;s class
      </Text>
    </Screen>
  );
}

function Confirm({ code, via }: { code: string; via: JoinedVia }) {
  const preview = usePreview(code);
  const join = useJoin();
  const offline = useIsOffline();

  useEffect(() => {
    if (!join.isSuccess) return;
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    const id = setTimeout(() => openClass(join.data.classroom.id), motion.joinedAutoContinue);
    return () => clearTimeout(id);
  }, [join.isSuccess, join.data]);

  // P6: joined.
  if (join.isSuccess) {
    const { classroom } = join.data;
    return (
      <Joined
        name={classroom.name}
        teacher={classroom.teacher.name}
        onContinue={() => openClass(classroom.id)}
      />
    );
  }

  if (preview.isPending) {
    return (
      <Screen
        appBar={appBar}
        offline={OFFLINE}
        footer={
          <>
            <Button label="Join class" disabled onPress={() => {}} />
            <Button label="Cancel" variant="text" onPress={goBack} />
          </>
        }
      >
        <ClassSummarySkeleton />
      </Screen>
    );
  }

  if (preview.isError) {
    const expired = isApiError(preview.error, 'JOIN_CODE_EXPIRED');
    const closed = isApiError(preview.error, 'JOINING_CLOSED');
    const invalid = isApiError(preview.error, 'JOIN_CODE_INVALID');
    const retryable = !expired && !invalid;
    return (
      <Screen
        appBar={appBar}
        offline={OFFLINE}
        center
        footer={
          retryable ? (
            <>
              <Button
                label="Try again"
                icon="refresh"
                busy={preview.isFetching}
                busyLabel="Checking…"
                disabled={offline}
                onPress={() => void preview.refetch()}
              />
              <Button label="Back" variant="text" onPress={goBack} />
            </>
          ) : (
            <>
              <Button label="Enter a different code" icon="keypad-outline" onPress={enterCode} />
              <Button
                label="Scan QR code"
                variant="secondary"
                icon="qr-code-outline"
                onPress={scanQr}
              />
            </>
          )
        }
      >
        <EmptyState
          testID="preview-error"
          icon={
            expired
              ? 'time-outline'
              : closed
                ? 'lock-closed-outline'
                : invalid
                  ? 'alert-circle-outline'
                  : 'cloud-offline-outline'
          }
          tone={closed || expired ? 'neutral' : 'error'}
          title={
            expired
              ? 'This code has expired'
              : closed
                ? 'Joining is closed'
                : invalid
                  ? "That code doesn't match a class"
                  : "Couldn't load this class"
          }
          message={
            expired
              ? 'Ask your teacher for a new one.'
              : closed
                ? 'This class isn’t accepting new students. Ask your teacher to turn on joining.'
                : invalid
                  ? 'Check the digits and try again.'
                  : isApiError(preview.error, 'NETWORK')
                    ? 'Check your connection and try again.'
                    : errorMessage(preview.error)
          }
        />
      </Screen>
    );
  }

  const { classroom, alreadyMember } = preview.data;

  if (alreadyMember) {
    return (
      <Screen
        appBar={appBar}
        offline={false}
        footer={
          <>
            <Button
              testID="open-class"
              label="Open class"
              onPress={() => openClass(classroom.id)}
            />
            <Button label="Back" variant="text" onPress={goBack} />
          </>
        }
      >
        <ClassSummaryCard classroom={classroom} />
        <Banner lead="You're already in this class." testID="already-member" />
      </Screen>
    );
  }

  // The teacher closed joining between the preview and the tap.
  const closedOnJoin = isApiError(join.error, 'JOINING_CLOSED');
  return (
    <Screen
      appBar={appBar}
      offline={OFFLINE}
      footer={
        <>
          <Button
            testID="join-confirm"
            label={closedOnJoin ? 'Try again' : 'Join class'}
            icon={closedOnJoin ? 'refresh' : undefined}
            busy={join.isPending}
            busyLabel="Joining…"
            disabled={offline}
            onPress={() => join.mutate({ code, via })}
          />
          <Button
            label={closedOnJoin ? 'Back' : 'Cancel'}
            variant="text"
            disabled={join.isPending}
            onPress={goBack}
          />
        </>
      }
    >
      {closedOnJoin ? null : <Text variant="caption">You&apos;re joining</Text>}
      <ClassSummaryCard classroom={classroom} />
      {closedOnJoin ? (
        <Banner
          tone="warning"
          lead="This class isn't accepting new students."
          message="Ask your teacher to turn on joining."
        />
      ) : join.isError ? (
        <Banner tone="error" message={errorMessage(join.error)} testID="join-error" />
      ) : null}
    </Screen>
  );
}
