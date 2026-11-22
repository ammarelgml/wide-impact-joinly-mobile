import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/messages';

import { Banner } from './banner';
import { Button } from './button';
import { Sheet } from './sheet';
import { Text } from './text';
import { spacing } from './theme';

export type ConfirmDialogProps = {
  visible: boolean;
  title: string;
  /** The consequence, stated plainly. */
  message: string;
  confirmLabel: string;
  cancelLabel?: string;
  destructive?: boolean;
  /** May throw; the error is shown in the dialog and the user can retry or cancel. */
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
};

/** Confirmation for destructive actions (design brief T5): shows progress and errors in place. */
export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel,
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const close = () => {
    if (busy) return;
    setError(null);
    onCancel();
  };

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet visible={visible} onClose={close} dismissible={!busy}>
      <View style={styles.body}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        <Text tone="muted">{message}</Text>
      </View>
      {error ? <Banner tone="error" message={errorMessage(error)} /> : null}
      <View style={styles.actions}>
        <Button
          label={confirmLabel}
          variant={destructive ? 'danger' : 'primary'}
          loading={busy}
          onPress={confirm}
        />
        <Button label={cancelLabel} variant="secondary" disabled={busy} onPress={close} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  body: { gap: spacing.sm },
  actions: { gap: spacing.md },
});
