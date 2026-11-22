import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { formatTimeLeft } from '@/lib/format';
import { CodeText, Icon, IconButton, StatusPill, Text, colors, radius, space } from '@/ui';

import type { InviteState } from './join-code-status';

/** Expiry line with a clock icon: "Expires in 18 hours". */
export function ExpiryLine({ expiresAt, now }: { expiresAt: string; now: number }) {
  const left = formatTimeLeft(expiresAt, now);
  if (!left) return null;
  return (
    <View style={styles.expiry}>
      <Icon name="time-outline" size={16} color={colors.ink2} />
      <Text variant="caption">Expires in {left}</Text>
    </View>
  );
}

/** T3's invite card: the code with copy and expiry, dimmed when joining is closed, struck through when expired. */
export function InviteCard({ state, now }: { state: InviteState; now: number }) {
  const [copied, setCopied] = useState(false);
  const code = state.joinCode?.code;

  const copy = async (value: string) => {
    await Clipboard.setStringAsync(value);
    void Haptics.selectionAsync();
    AccessibilityInfo.announceForAccessibility('Code copied');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <View testID="invite-card" style={[styles.card, state.kind === 'closed' && styles.dim]}>
      <View style={styles.row}>
        <Text variant="label" style={styles.grow}>
          Invite code
        </Text>
        {state.kind === 'live' ? (
          <StatusPill kind="open" label="Joining open" />
        ) : state.kind === 'closed' ? (
          <StatusPill kind="closed" label="Joining closed" />
        ) : (
          <StatusPill kind="expired" label="Code expired" />
        )}
      </View>

      {state.kind === 'live' ? (
        <>
          <View style={styles.row}>
            <View style={styles.grow}>
              <CodeText testID="join-code" code={state.joinCode.code} />
            </View>
            <IconButton
              testID="copy-code"
              tonal
              icon={copied ? 'checkmark' : 'copy-outline'}
              label={copied ? 'Code copied' : 'Copy code'}
              color={copied ? colors.success : colors.ink}
              onPress={() => void copy(state.joinCode.code)}
            />
          </View>
          <ExpiryLine expiresAt={state.joinCode.expiresAt} now={now} />
        </>
      ) : (
        <>
          {code ? (
            <CodeText testID="join-code" code={code} muted struck={state.kind === 'expired'} />
          ) : null}
          <Text variant="caption">
            {state.kind === 'closed'
              ? "Joining is closed, so this code doesn't work. Turn joining on to let new students in."
              : 'This code stopped working after 24 hours. Make a new one to keep inviting.'}
          </Text>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.line,
    padding: space[4],
    gap: space[3],
  },
  dim: { backgroundColor: colors.surface2, borderColor: colors.surface2 },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[2] },
  grow: { flex: 1, minWidth: 0 },
  expiry: { flexDirection: 'row', alignItems: 'center', gap: 6 },
});
