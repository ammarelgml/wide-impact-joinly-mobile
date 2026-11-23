import * as Brightness from 'expo-brightness';
import { useKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useEffect, useState, type ReactNode } from 'react';
import { Platform, StyleSheet, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Classroom } from '@/api/client';
import { errorMessage } from '@/api/messages';
import { useIsOffline } from '@/lib/network';
import { useNow } from '@/lib/use-now';
import {
  Banner,
  Button,
  CodeText,
  ConfirmSheet,
  EmptyState,
  Icon,
  IconButton,
  OfflineStrip,
  Screen,
  SkeletonBlock,
  Spinner,
  StatusPill,
  SwitchRow,
  Text,
  colors,
  font,
  qr,
  radius,
  size,
  space,
} from '@/ui';

import { INVITE_POLL_MS, useClassroom, useRegenerateCode, useUpdateClassroom } from './api';
import { ExpiryLine } from './invite-card';
import { REGENERATE_MESSAGE, REGENERATE_TITLE, inviteState } from './join-code-status';
import { LiveCounter } from './live-counter';
import { useShareInvite } from './share-invite';

/**
 * While the invite is on screen: keep it awake, raise brightness to full so the QR reads from the
 * back of a room, and allow landscape. All three are restored on exit.
 */
function usePresentationMode() {
  useKeepAwake();
  useEffect(() => {
    if (Platform.OS === 'web') return;
    let previous: number | null = null;
    void Brightness.getBrightnessAsync()
      .then((value) => {
        previous = value;
        return Brightness.setBrightnessAsync(1);
      })
      .catch(() => {});
    void ScreenOrientation.unlockAsync().catch(() => {});
    return () => {
      // Android: hand the window back to the system setting. iOS changed the screen itself, so put it back.
      if (Platform.OS === 'android') void Brightness.restoreSystemBrightnessAsync().catch(() => {});
      else if (previous !== null) void Brightness.setBrightnessAsync(previous).catch(() => {});
      void ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP).catch(
        () => {},
      );
    };
  }, []);
}

/** T4: full-screen invite, readable from across a classroom. The counter updates within 2 s. */
export function InviteScreen() {
  usePresentationMode();
  const { id } = useLocalSearchParams<{ id: string }>();
  const focused = useIsFocused();
  const query = useClassroom(id, { pollMs: focused && INVITE_POLL_MS });

  if (query.data) return <InviteContent classroom={query.data} />;

  const appBar = { title: 'Invite students', leading: 'close' as const };
  if (query.isError) {
    return (
      <Screen
        appBar={appBar}
        surface
        center
        footer={<Button label="Try again" icon="refresh" onPress={() => void query.refetch()} />}
      >
        <EmptyState
          icon="cloud-offline-outline"
          tone="error"
          title="Couldn't load this invite"
          message="Check your connection and try again."
        />
      </Screen>
    );
  }
  return (
    <Screen appBar={appBar} surface contentStyle={styles.portrait}>
      <SkeletonBlock width="60%" height={28} />
      <SkeletonBlock width={size.qrInvite} height={size.qrInvite} rounded={radius.lg} />
      <SkeletonBlock width={200} height={44} rounded={radius.md} />
    </Screen>
  );
}

function QrPlate({ value, label, plate }: { value: string; label: string; plate: number }) {
  return (
    <View
      style={[styles.qr, { width: plate, height: plate }]}
      accessible
      accessibilityRole="image"
      accessibilityLabel={label}
      testID="invite-qr"
    >
      <QRCode
        value={value}
        size={plate - 2 * qr.quietZone}
        ecl="M"
        color={qr.module}
        backgroundColor={qr.plate}
      />
    </View>
  );
}

function QrOff({ plate, children }: { plate: number; children: ReactNode }) {
  return (
    <View style={[styles.qrOff, { width: plate, height: plate }]} accessibilityRole="text">
      {children}
    </View>
  );
}

function InviteContent({ classroom }: { classroom: Classroom }) {
  const now = useNow(15_000);
  const offline = useIsOffline();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const landscape = width > height;
  const regenerate = useRegenerateCode(classroom.id);
  const update = useUpdateClassroom(classroom.id);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const state = inviteState(classroom, now);
  // The old code is dead the moment a new one is requested, so the QR goes before the reply comes.
  const regenerating = regenerate.isPending;

  const qrLabel = `QR code to join ${classroom.name}`;
  const live = state.kind === 'live' ? state.joinCode : null;
  const share = useShareInvite({
    name: classroom.name,
    code: live?.code ?? '',
    url: live?.joinUrl ?? '',
  });

  const joiningSwitch = (bare: boolean) => (
    <SwitchRow
      testID="invite-joining-switch"
      bare={bare}
      title="Joining open"
      subtitle={bare ? undefined : 'Students can join with the code or QR'}
      value={classroom.joiningOpen}
      disabled={offline || regenerating}
      onValueChange={(joiningOpen) => update.mutate({ joiningOpen })}
    />
  );

  const actions =
    state.kind === 'live' ? (
      <View style={styles.actionRow}>
        <Button
          testID="invite-share"
          label="Share"
          icon="share-social-outline"
          style={styles.grow}
          disabled={regenerating}
          onPress={share.open}
        />
        <Button
          testID="invite-regenerate"
          label="Regenerate"
          icon="refresh"
          variant="secondary"
          fullWidth={false}
          disabled={regenerating || offline}
          onPress={() => setConfirmRegenerate(true)}
        />
      </View>
    ) : state.kind === 'expired' ? (
      <Button
        testID="invite-regenerate"
        label="Regenerate code"
        icon="refresh"
        busy={regenerating}
        busyLabel="Regenerating…"
        disabled={offline}
        onPress={() => setConfirmRegenerate(true)}
      />
    ) : (
      <Button
        testID="invite-turn-on"
        label="Turn on joining"
        busy={update.isPending}
        busyLabel="Turning on…"
        disabled={offline}
        onPress={() => update.mutate({ joiningOpen: true })}
      />
    );

  const errors = (
    <>
      {regenerate.isError && !confirmRegenerate ? (
        <Banner tone="error" message={errorMessage(regenerate.error)} />
      ) : null}
      {update.isError ? <Banner tone="error" message={errorMessage(update.error)} /> : null}
    </>
  );

  const confirm = (
    <ConfirmSheet
      visible={confirmRegenerate}
      title={REGENERATE_TITLE}
      message={REGENERATE_MESSAGE}
      confirmLabel="Regenerate code"
      busyLabel="Regenerating…"
      confirmKind="primary"
      onCancel={() => setConfirmRegenerate(false)}
      onConfirm={async () => {
        // Close first, so the screen itself shows "Making a new code…" while it is made.
        setConfirmRegenerate(false);
        await regenerate.mutateAsync().catch(() => {});
      }}
    />
  );

  if (landscape && state.kind === 'live') {
    const plate = Math.min(296, height - insets.top - insets.bottom - 2 * space[5]);
    return (
      <View
        style={[
          styles.landscape,
          {
            paddingTop: insets.top + space[5],
            paddingBottom: insets.bottom + space[5],
            paddingStart: insets.left + 40,
            paddingEnd: insets.right + space[5],
          },
        ]}
      >
        {regenerating ? (
          <QrOff plate={plate}>
            <Spinner large />
            <Text style={styles.qrOffText}>Making a new code…</Text>
          </QrOff>
        ) : (
          <QrPlate value={state.joinCode.joinUrl} label={qrLabel} plate={plate} />
        )}
        <View style={styles.side}>
          <View style={styles.row}>
            <Text variant="headline" numberOfLines={1} style={styles.grow}>
              {classroom.name}
            </Text>
            <IconButton icon="close" label="Close" onPress={() => router.back()} />
          </View>
          <OfflineStrip message="You're offline. The count may be out of date." />
          {regenerating ? null : (
            <CodeText code={state.joinCode.code} size="XL" testID="invite-code" />
          )}
          <View style={[styles.row, styles.wrap]}>
            <LiveCounter count={classroom.studentCount} live={!regenerating} />
            {regenerating ? null : <ExpiryLine expiresAt={state.joinCode.expiresAt} now={now} />}
          </View>
          {errors}
          <View style={styles.grow} />
          {joiningSwitch(true)}
          {actions}
        </View>
        {confirm}
        {live && !regenerating ? share.ui : null}
        {live && !regenerating ? share.ui : null}
      </View>
    );
  }

  const plate = Math.min(size.qrInvite, width - 2 * space[4]);
  return (
    <Screen
      appBar={{ title: 'Invite students', leading: 'close' }}
      surface
      offline="You're offline. The count may be out of date."
      contentStyle={styles.portrait}
      footer={
        <>
          {state.kind === 'live' ? joiningSwitch(false) : null}
          {actions}
        </>
      }
    >
      <Text variant="headline" numberOfLines={1} style={styles.name}>
        {classroom.name}
      </Text>

      {state.kind === 'live' && regenerating ? (
        <>
          <QrOff plate={plate}>
            <Spinner large />
            <Text style={styles.qrOffText} accessibilityLiveRegion="polite">
              Making a new code…
            </Text>
          </QrOff>
          <View style={styles.codeSlot}>
            <SkeletonBlock width={200} height={44} rounded={radius.md} />
          </View>
          <Text variant="caption">The old code has stopped working.</Text>
          <LiveCounter count={classroom.studentCount} live={false} />
        </>
      ) : state.kind === 'live' ? (
        <>
          <QrPlate value={state.joinCode.joinUrl} label={qrLabel} plate={plate} />
          <CodeText code={state.joinCode.code} size="XL" testID="invite-code" />
          <ExpiryLine expiresAt={state.joinCode.expiresAt} now={now} />
          <LiveCounter count={classroom.studentCount} />
        </>
      ) : state.kind === 'expired' ? (
        <>
          <QrOff plate={plate}>
            {regenerating ? (
              <>
                <Spinner large />
                <Text style={styles.qrOffText}>Making a new code…</Text>
              </>
            ) : (
              <>
                <Icon name="time-outline" size={40} color={colors.ink2} />
                <Text style={styles.qrOffText}>This code expired</Text>
              </>
            )}
          </QrOff>
          {state.joinCode ? (
            <CodeText code={state.joinCode.code} size="XL" struck testID="invite-code" />
          ) : null}
          <StatusPill kind="expired" label="Code expired" style={styles.centered} />
          <Text variant="caption" align="center" style={styles.note}>
            Students can&apos;t join until you make a new code.
          </Text>
        </>
      ) : (
        <>
          <QrOff plate={plate}>
            <Icon name="eye-off-outline" size={40} color={colors.ink2} />
            <Text style={styles.qrOffText}>QR hidden while joining is closed</Text>
          </QrOff>
          <Text variant="codeXL" style={{ color: colors.ink2 }} accessibilityLabel="Code hidden">
            ••• •••
          </Text>
          <StatusPill kind="closed" label="Joining closed" style={styles.centered} />
          <LiveCounter count={classroom.studentCount} live={false} />
        </>
      )}
      {errors}
      {confirm}
      {live && !regenerating ? share.ui : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  portrait: { alignItems: 'center', paddingTop: 0 },
  name: { maxWidth: '100%' },
  centered: { alignSelf: 'center' },
  qr: {
    backgroundColor: qr.plate,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: qr.edge,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrOff: {
    borderRadius: radius.lg,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: space[4],
  },
  qrOffText: { ...font(600, 15, 22), color: colors.ink2, textAlign: 'center' },
  codeSlot: { height: 68, justifyContent: 'center' },
  note: { maxWidth: 260 },
  actionRow: { flexDirection: 'row', gap: space[2] },
  grow: { flex: 1, minWidth: 0 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  wrap: { flexWrap: 'wrap' },
  landscape: { flex: 1, flexDirection: 'row', gap: 28, backgroundColor: colors.surface },
  side: { flex: 1, minWidth: 0, gap: 10 },
});
