import { useQueryClient } from '@tanstack/react-query';
import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { errorMessage, formatWait } from '@/api/messages';
import { prefetchPreview } from '@/features/enrollments/api';
import { useIsOffline } from '@/lib/network';
import { useNow } from '@/lib/use-now';
import { Banner, Button, Icon, Screen, Spinner, Text, colors, font, space } from '@/ui';

import { CodeInput } from './code-input';
import { JOIN_CODE_LENGTH, sanitizeCodeInput } from './join-code';

/**
 * P3: type the 6-digit code. It submits on the sixth digit; there is no submit button. Errors stay
 * here with the digits kept, and a valid code continues to the confirm step (P4).
 */
export function CodeEntryScreen() {
  const queryClient = useQueryClient();
  const offline = useIsOffline();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  // The server enforces the limit (5 wrong codes in 15 minutes) and says how long to wait.
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const now = useNow(1_000);

  const waitSeconds = retryAt ? Math.ceil((retryAt - now) / 1000) : 0;
  const locked = waitSeconds > 0;

  // Announce the lock and its end, not every second of the countdown.
  const wasLocked = useRef(false);
  useEffect(() => {
    if (wasLocked.current && !locked) {
      AccessibilityInfo.announceForAccessibility('You can try a code again.');
      setError(null);
      setCode('');
    }
    wasLocked.current = locked;
  }, [locked]);

  const check = async (value: string) => {
    if (checking || locked) return;
    setChecking(true);
    setError(null);
    setPasteHint(null);
    try {
      await prefetchPreview(queryClient, value);
      router.push({ pathname: '/student/join/confirm', params: { code: value, via: 'code' } });
    } catch (e) {
      setError(e);
      if (isApiError(e, 'RATE_LIMITED')) {
        const seconds = e.retryAfterSeconds ?? 60;
        setRetryAt(Date.now() + seconds * 1000);
        setCode('');
        AccessibilityInfo.announceForAccessibility(
          `Too many tries. You can try again in ${formatWait(seconds)}.`,
        );
      }
    } finally {
      setChecking(false);
    }
  };

  const paste = async () => {
    const digits = sanitizeCodeInput(await Clipboard.getStringAsync());
    if (digits.length === JOIN_CODE_LENGTH) {
      setCode(digits);
      void check(digits);
    } else {
      setPasteHint("There's no 6-digit code to paste.");
    }
  };

  const failed = Boolean(error) && !locked && !isApiError(error, 'RATE_LIMITED');

  let status;
  if (locked) {
    status = (
      <Banner
        tone="warning"
        lead="Too many tries."
        message={`You can try again in ${formatWait(waitSeconds)}.`}
        testID="code-locked"
      />
    );
  } else if (checking) {
    status = (
      <View style={styles.row} accessibilityLiveRegion="polite">
        <Spinner />
        <Text variant="body2">Checking code…</Text>
      </View>
    );
  } else if (failed || pasteHint) {
    status = (
      <View style={styles.row} accessibilityRole="alert" accessibilityLiveRegion="assertive">
        <Icon name="alert-circle-outline" size={18} color={colors.danger} />
        <Text style={styles.error} testID="code-error">
          {pasteHint ?? errorMessage(error)}
        </Text>
      </View>
    );
  } else if (offline) {
    status = <Text variant="body2">Connect to the internet to check a code.</Text>;
  } else if (code.length === 0) {
    status = (
      <Button
        testID="paste-code"
        label="Paste code"
        icon="clipboard-outline"
        variant="text"
        small
        fullWidth={false}
        onPress={() => void paste()}
      />
    );
  }

  return (
    <Screen appBar={{ title: 'Enter class code' }} contentStyle={styles.content}>
      <Text variant="title" accessibilityRole="header">
        Enter the 6-digit code
      </Text>
      <Text variant="body2">Your teacher can see it on their screen.</Text>
      <View style={styles.spacer} />
      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          setPasteHint(null);
        }}
        onComplete={(value) => void check(value)}
        locked={checking || locked || offline}
        error={failed}
      />
      <View style={styles.status}>{status}</View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { gap: space[2] },
  spacer: { height: space[3] },
  status: {
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginTop: space[2],
  },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: space[2] },
  error: { ...font(500, 14, 20), color: colors.danger, flexShrink: 1 },
});
