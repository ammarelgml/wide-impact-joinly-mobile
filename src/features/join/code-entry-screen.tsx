import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { isApiError } from '@/api/errors';
import { errorMessage, formatWait } from '@/api/messages';
import { prefetchPreview } from '@/features/enrollments/api';
import { useNow } from '@/lib/use-now';
import { Banner, Button, Screen, Text, spacing } from '@/ui';

import { CodeInput } from './code-input';
import { JOIN_CODE_LENGTH } from './join-code';

/** P3: type the 6-digit code. Errors stay on this screen; a valid code continues to the confirm step. */
export function CodeEntryScreen() {
  const queryClient = useQueryClient();
  const [code, setCode] = useState('');
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [retryAt, setRetryAt] = useState<number | null>(null);
  const now = useNow(1_000);

  const waitSeconds = retryAt ? Math.ceil((retryAt - now) / 1000) : 0;
  const rateLimited = waitSeconds > 0;

  const check = async (value: string) => {
    if (checking || rateLimited) return;
    setChecking(true);
    setError(null);
    try {
      await prefetchPreview(queryClient, value);
      router.push({ pathname: '/student/join/confirm', params: { code: value, via: 'code' } });
    } catch (e) {
      setError(e);
      if (isApiError(e, 'RATE_LIMITED'))
        setRetryAt(Date.now() + (e.retryAfterSeconds ?? 60) * 1000);
    } finally {
      setChecking(false);
    }
  };

  const message = rateLimited
    ? `Too many attempts. Try again in ${formatWait(waitSeconds)}.`
    : error && !isApiError(error, 'RATE_LIMITED')
      ? errorMessage(error)
      : null;

  return (
    <Screen
      footer={
        <>
          <Button
            testID="code-submit"
            label="Continue"
            loading={checking}
            disabled={code.length !== JOIN_CODE_LENGTH || rateLimited}
            onPress={() => void check(code)}
          />
          <Button
            label="Scan QR instead"
            variant="ghost"
            icon="qr-code-outline"
            onPress={() => router.replace('/student/join/scan')}
          />
        </>
      }
    >
      <View style={styles.intro}>
        <Text variant="title" accessibilityRole="header">
          Enter the class code
        </Text>
        <Text tone="muted">Your teacher has a 6-digit code on their screen.</Text>
      </View>

      <CodeInput
        value={code}
        onChange={(value) => {
          setCode(value);
          if (!rateLimited) setError(null);
        }}
        onComplete={(value) => void check(value)}
        disabled={checking || rateLimited}
        invalid={Boolean(message)}
      />

      {checking ? (
        <Text tone="muted" align="center" accessibilityLiveRegion="polite">
          Checking code…
        </Text>
      ) : null}
      {message ? (
        <Banner tone={rateLimited ? 'warning' : 'error'} message={message} testID="code-error" />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  intro: { gap: spacing.xs, marginTop: spacing.md, marginBottom: spacing.lg },
});
