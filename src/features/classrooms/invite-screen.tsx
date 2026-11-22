import { useKeepAwake } from 'expo-keep-awake';
import { router, useIsFocused, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Share, StyleSheet, View, useWindowDimensions } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Classroom } from '@/api/client';
import { errorMessage } from '@/api/messages';
import { formatJoinCode, formatTimeLeft } from '@/lib/format';
import { useNow } from '@/lib/use-now';
import {
  Banner,
  Button,
  ConfirmDialog,
  ErrorState,
  Icon,
  IconButton,
  OfflineBanner,
  SkeletonBlock,
  Text,
  colors,
  radius,
  spacing,
} from '@/ui';

import { useClassroom, useRegenerateCode, useUpdateClassroom } from './api';
import { REGENERATE_MESSAGE, inviteState } from './join-code-status';

/** T4: full-screen invite, readable from the back of a classroom. Stays awake; the count updates live. */
export function InviteScreen() {
  useKeepAwake();
  const { id } = useLocalSearchParams<{ id: string }>();
  const focused = useIsFocused();
  const query = useClassroom(id, { poll: focused });

  return (
    <SafeAreaView style={styles.root} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <IconButton icon="close" label="Close invite" onPress={() => router.back()} />
      </View>
      <OfflineBanner />
      {query.data ? (
        <InviteContent classroom={query.data} />
      ) : query.isError ? (
        <ErrorState error={query.error} onRetry={() => void query.refetch()} />
      ) : (
        <View style={styles.center}>
          <SkeletonBlock width={280} height={280} />
        </View>
      )}
    </SafeAreaView>
  );
}

function InviteContent({ classroom }: { classroom: Classroom }) {
  const now = useNow(15_000);
  const { width } = useWindowDimensions();
  const regenerate = useRegenerateCode(classroom.id);
  const update = useUpdateClassroom(classroom.id);
  const [confirmRegenerate, setConfirmRegenerate] = useState(false);
  const state = inviteState(classroom, now);
  const qrSize = Math.min(width - spacing.xxxl * 2, 320);

  const count = (
    <View style={styles.count} accessibilityLiveRegion="polite">
      <Icon name="people" color={colors.success} />
      <Text testID="live-count" variant="heading" style={{ color: colors.success }}>
        {classroom.studentCount} {classroom.studentCount === 1 ? 'student' : 'students'} joined
      </Text>
    </View>
  );

  return (
    <View style={styles.content}>
      <Text variant="title" align="center" numberOfLines={2}>
        {classroom.name}
      </Text>

      {state.kind === 'live' ? (
        <>
          <View
            style={styles.qr}
            accessible
            accessibilityRole="image"
            accessibilityLabel="QR code to join this class"
          >
            <QRCode value={state.joinCode.joinUrl} size={qrSize} ecl="M" quietZone={8} />
          </View>
          <View style={styles.codeBlock}>
            <Text variant="caption" tone="muted" align="center">
              Or enter this code in Joinly
            </Text>
            <Text
              testID="invite-code"
              variant="code"
              align="center"
              accessibilityLabel={`Code ${state.joinCode.code.split('').join(' ')}`}
            >
              {formatJoinCode(state.joinCode.code)}
            </Text>
            <Text variant="caption" tone="muted" align="center">
              Expires in {formatTimeLeft(state.joinCode.expiresAt, now)}
            </Text>
          </View>
          {count}
          {regenerate.isError ? (
            <Banner tone="error" message={errorMessage(regenerate.error)} />
          ) : null}
          <View style={styles.actions}>
            <Button
              label="Share"
              icon="share-outline"
              variant="secondary"
              style={styles.action}
              onPress={() =>
                void Share.share({
                  message: `Join "${classroom.name}" on Joinly with code ${formatJoinCode(state.joinCode.code)}, or open ${state.joinCode.joinUrl}`,
                })
              }
            />
            <Button
              testID="invite-regenerate"
              label="New code"
              icon="refresh"
              variant="secondary"
              style={styles.action}
              onPress={() => setConfirmRegenerate(true)}
            />
          </View>
        </>
      ) : state.kind === 'expired' ? (
        <View style={styles.notice}>
          <Icon name="time" size={48} color={colors.warning} />
          <Text variant="heading" align="center">
            This code has expired
          </Text>
          <Text tone="muted" align="center">
            Make a new code to keep inviting students.
          </Text>
          {count}
          {regenerate.isError ? (
            <Banner tone="error" message={errorMessage(regenerate.error)} />
          ) : null}
          <Button
            label="Make a new code"
            icon="refresh"
            loading={regenerate.isPending}
            onPress={() => regenerate.mutate()}
            style={styles.wide}
          />
        </View>
      ) : (
        <View style={styles.notice}>
          <Icon name="lock-closed" size={48} color={colors.textMuted} />
          <Text variant="heading" align="center">
            Joining is off
          </Text>
          <Text tone="muted" align="center">
            The QR code is hidden while new students can&apos;t join.
          </Text>
          {count}
          {update.isError ? <Banner tone="error" message={errorMessage(update.error)} /> : null}
          <Button
            label="Turn on joining"
            icon="lock-open"
            loading={update.isPending}
            onPress={() => update.mutate({ joiningOpen: true })}
            style={styles.wide}
          />
        </View>
      )}

      <ConfirmDialog
        visible={confirmRegenerate}
        title="Make a new code?"
        message={REGENERATE_MESSAGE}
        confirmLabel="Make new code"
        onCancel={() => setConfirmRegenerate(false)}
        onConfirm={async () => {
          await regenerate.mutateAsync();
          setConfirmRegenerate(false);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.surface, paddingHorizontal: spacing.lg },
  topBar: { flexDirection: 'row', justifyContent: 'flex-start' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  qr: { padding: spacing.md, backgroundColor: '#FFFFFF', borderRadius: radius.lg },
  codeBlock: { gap: spacing.xs },
  count: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.successSoft,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
  },
  actions: { flexDirection: 'row', gap: spacing.md, alignSelf: 'stretch' },
  action: { flex: 1 },
  notice: { alignItems: 'center', gap: spacing.md, alignSelf: 'stretch' },
  wide: { alignSelf: 'stretch' },
});
