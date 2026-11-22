import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import type { Classroom } from '@/api/client';
import { formatJoinCode, formatTimeLeft } from '@/lib/format';
import { Button, Card, Icon, IconButton, Text, colors, spacing } from '@/ui';

import { inviteState } from './join-code-status';

/** The invite card on the classroom screen (T3): code, copy, expiry and Show QR, or why joining is unavailable. */
export function InviteCard({
  classroom,
  now,
  onShowQr,
  onRegenerate,
  regenerating,
}: {
  classroom: Classroom;
  now: number;
  onShowQr: () => void;
  onRegenerate: () => void;
  regenerating: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const state = inviteState(classroom, now);

  if (state.kind === 'closed') {
    return (
      <Card style={[styles.card, styles.dimmed]}>
        <View style={styles.row}>
          <Icon name="lock-closed" color={colors.textMuted} />
          <Text variant="bodyStrong">Joining is off</Text>
        </View>
        <Text tone="muted">
          Students can&apos;t join with the code or QR. Turn on joining below to let them in.
        </Text>
      </Card>
    );
  }

  if (state.kind === 'expired') {
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <Icon name="time" color={colors.warning} />
          <Text variant="bodyStrong">The join code has expired</Text>
        </View>
        <Text tone="muted">Codes last 24 hours. Make a new one to invite more students.</Text>
        <Button
          testID="regenerate-code"
          label="Make a new code"
          icon="refresh"
          loading={regenerating}
          onPress={onRegenerate}
        />
      </Card>
    );
  }

  const { joinCode } = state;
  const timeLeft = formatTimeLeft(joinCode.expiresAt, now);
  const copy = async () => {
    await Clipboard.setStringAsync(joinCode.code);
    void Haptics.selectionAsync();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card style={styles.card}>
      <Text variant="label" tone="muted">
        Join code
      </Text>
      <View style={styles.codeRow}>
        <Text
          testID="join-code"
          variant="title"
          style={styles.code}
          accessibilityLabel={`Join code ${joinCode.code.split('').join(' ')}`}
        >
          {formatJoinCode(joinCode.code)}
        </Text>
        <IconButton
          icon={copied ? 'checkmark' : 'copy-outline'}
          label={copied ? 'Code copied' : 'Copy code'}
          color={copied ? colors.success : colors.primary}
          onPress={() => void copy()}
        />
      </View>
      {timeLeft ? (
        <Text variant="caption" tone="muted">
          Expires in {timeLeft}
        </Text>
      ) : null}
      <Button testID="show-qr" label="Show QR" icon="qr-code" onPress={onShowQr} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm },
  dimmed: { backgroundColor: colors.surfaceMuted },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  codeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  code: { fontSize: 36, lineHeight: 44, letterSpacing: 3 },
});
