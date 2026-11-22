import { useRef } from 'react';
import { Pressable, StyleSheet, TextInput, View, type TextInputInstance } from 'react-native';

import { Text, colors, radius, spacing } from '@/ui';

import { JOIN_CODE_LENGTH, sanitizeCodeInput } from './join-code';

/**
 * Six digit boxes backed by one real TextInput, so the numeric keypad, paste and the OS one-time
 * code suggestions all work. Submits automatically on the sixth digit.
 */
export function CodeInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  invalid = false,
  autoFocus = true,
}: {
  value: string;
  onChange: (code: string) => void;
  onComplete: (code: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  autoFocus?: boolean;
}) {
  const input = useRef<TextInputInstance>(null);

  const handleChange = (text: string) => {
    const code = sanitizeCodeInput(text);
    onChange(code);
    if (code.length === JOIN_CODE_LENGTH && code !== value) onComplete(code);
  };

  return (
    <Pressable onPress={() => input.current?.focus()} disabled={disabled} accessible={false}>
      <View
        style={styles.boxes}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      >
        {Array.from({ length: JOIN_CODE_LENGTH }, (_, i) => {
          const digit = value[i] ?? '';
          const active = !disabled && i === Math.min(value.length, JOIN_CODE_LENGTH - 1);
          return (
            <View
              key={i}
              style={[
                styles.box,
                i === 3 && styles.gap,
                active && styles.active,
                invalid && styles.invalid,
                disabled && styles.disabled,
              ]}
            >
              <Text variant="title">{digit}</Text>
            </View>
          );
        })}
      </View>
      <TextInput
        ref={input}
        testID="code-input"
        value={value}
        onChangeText={handleChange}
        editable={!disabled}
        autoFocus={autoFocus}
        keyboardType="number-pad"
        inputMode="numeric"
        textContentType="oneTimeCode"
        autoComplete="one-time-code"
        maxLength={JOIN_CODE_LENGTH + 2 /* room for a pasted "482 913" */}
        caretHidden
        contextMenuHidden={false}
        accessibilityLabel="Join code, 6 digits"
        accessibilityHint={value ? `Entered ${value.split('').join(' ')}` : undefined}
        style={styles.hiddenInput}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  boxes: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm },
  box: {
    width: 48,
    height: 60,
    borderRadius: radius.md,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gap: { marginStart: spacing.md },
  active: { borderColor: colors.primary },
  invalid: { borderColor: colors.danger },
  disabled: { backgroundColor: colors.surfaceMuted },
  hiddenInput: { ...StyleSheet.absoluteFill, opacity: 0.011, color: 'transparent' },
});
