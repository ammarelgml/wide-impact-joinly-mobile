import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { errorMessage } from '@/api/messages';

import { Banner } from './banner';
import { Button } from './button';
import { Sheet, SheetTitle } from './sheet';
import { Text } from './text';
import { space } from './theme';

export type ConfirmSheetProps = {
  visible: boolean;
  title: string;
  /** The consequence, stated plainly before the action. */
  message: string;
  confirmLabel: string;
  /** Verb-ing label while the action runs ("Deleting…"). */
  busyLabel: string;
  confirmKind?: 'danger' | 'primary';
  cancelLabel?: string;
  /** Overrides the default error text, e.g. "Couldn't delete the classroom." */
  errorText?: (error: unknown) => string;
  /** May throw: the error shows inside the sheet and the confirm becomes "Try again". */
  onConfirm: () => Promise<void> | void;
  onCancel: () => void;
  testID?: string;
};

/** T5: every destructive or irreversible action is confirmed in a bottom sheet. */
export function ConfirmSheet({
  visible,
  title,
  message,
  confirmLabel,
  busyLabel,
  confirmKind = 'danger',
  cancelLabel = 'Cancel',
  errorText = errorMessage,
  onConfirm,
  onCancel,
  testID,
}: ConfirmSheetProps) {
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
    <Sheet visible={visible} onClose={close} dismissible={!busy} testID={testID}>
      <SheetTitle>{title}</SheetTitle>
      <Text variant="body2">{message}</Text>
      {error ? <Banner tone="error" message={errorText(error)} /> : null}
      <View style={styles.actions}>
        <Button
          testID="confirm-action"
          label={error ? 'Try again' : confirmLabel}
          variant={confirmKind}
          busy={busy}
          busyLabel={busyLabel}
          onPress={confirm}
        />
        <Button label={cancelLabel} variant="secondary" disabled={busy} onPress={close} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  actions: { gap: space[2], marginTop: space[2] },
});
