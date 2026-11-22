import { useRef } from 'react';
import {
  AccessibilityInfo,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type TextInputInstance,
} from 'react-native';

import { Text, colors, font, radius, size } from '@/ui';

import { JOIN_CODE_LENGTH, sanitizeCodeInput } from './join-code';

/**
 * Six 44 × 60 cells (3 + 3) over one real input, so the numeric keypad, paste and the OS one-time
 * code suggestions all work. Calls onComplete on the sixth digit. The cells are hidden from screen
 * readers; the input says how many digits are in.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  locked = false,
  error = false,
  autoFocus = true,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete: (code: string) => void;
  /** Checking, or rate limited: no typing. */
  locked?: boolean;
  /** Error state: the digits stay so one can be fixed, and the next digit typed starts again. */
  error?: boolean;
  autoFocus?: boolean;
}) {
  const input = useRef<TextInputInstance>(null);

  const handleChange = (text: string) => {
    const typedMore = text.replace(/\D/g, '').length > value.length;
    // After an error, typing a new digit clears the old attempt; deleting edits it.
    const code =
      error && typedMore && value.length === JOIN_CODE_LENGTH
        ? sanitizeCodeInput(text.slice(value.length))
        : sanitizeCodeInput(text);
    onChange(code);
    if (code !== value) {
      AccessibilityInfo.announceForAccessibility(`${code.length} of 6 digits entered`);
    }
    if (code.length === JOIN_CODE_LENGTH && code !== value) onComplete(code);
  };

  return (
    <Pressable onPress={() => input.current?.focus()} disabled={locked} accessible={false}>
      <View
        style={styles.cells}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: JOIN_CODE_LENGTH }, (_, i) => {
          const digit = value[i] ?? '';
          const active = !locked && !error && i === Math.min(value.length, JOIN_CODE_LENGTH - 1);
          return (
            <View
              key={i}
              testID={`code-cell-${i}`}
              style={[
                styles.cell,
                i === 3 && styles.groupGap,
                active && styles.active,
                error && styles.error,
                locked && !value && styles.locked,
              ]}
            >
              {digit ? (
                <Text style={[styles.digit, locked && !value && { color: colors.ink2 }]}>
                  {digit}
                </Text>
              ) : active && value.length < JOIN_CODE_LENGTH ? (
                <View style={styles.caret} />
              ) : null}
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        testID="code-input"
        value={value}
        onChangeText={handleChange}
        editable={!locked}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={
          JOIN_CODE_LENGTH + 2 /* room for a pasted "482 913", or a digit after an error */
        }
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel="Class code, 6 digits"
        accessibilityValue={{ text: `${value.length} of 6 digits entered` }}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const cell = size.codeCell;

const styles = StyleSheet.create({
  cells: { flexDirection: 'row', justifyContent: 'center', gap: cell.gap },
  cell: {
    width: cell.width,
    height: cell.height,
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  groupGap: { marginStart: cell.groupGap - cell.gap },
  active: { borderWidth: 2, borderColor: colors.primary },
  error: { borderWidth: 2, borderColor: colors.danger },
  locked: { backgroundColor: colors.surface2, borderColor: colors.line },
  digit: { ...font(600, 28, 34), color: colors.ink, fontVariant: ['tabular-nums'] },
  caret: { width: 2, height: 28, backgroundColor: colors.primary },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0.011, color: 'transparent' },
});
