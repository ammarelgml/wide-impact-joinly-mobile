import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Text } from './text';
import { colors, radius, spacing, touchTarget, typography } from './theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  error?: string;
  hint?: string;
  /** Shows "12/80" under the field. */
  maxLength?: number;
  showCounter?: boolean;
};

export function TextField({
  label,
  error,
  hint,
  maxLength,
  showCounter,
  value,
  multiline,
  ...rest
}: TextFieldProps) {
  const length = value?.length ?? 0;
  return (
    <View style={styles.wrapper}>
      <Text variant="label">{label}</Text>
      <TextInput
        {...rest}
        value={value}
        multiline={multiline}
        maxLength={maxLength}
        accessibilityLabel={label}
        accessibilityHint={error ?? hint}
        placeholderTextColor={colors.textDisabled}
        style={[
          styles.input,
          multiline && styles.multiline,
          error ? { borderColor: colors.danger } : null,
        ]}
      />
      <View style={styles.footer}>
        <Text variant="caption" tone={error ? 'danger' : 'muted'} style={styles.message}>
          {error ?? hint ?? ''}
        </Text>
        {showCounter && maxLength ? (
          <Text variant="caption" tone={length > maxLength ? 'danger' : 'muted'}>
            {length}/{maxLength}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: spacing.xs },
  input: {
    ...typography.body,
    fontWeight: '400',
    minHeight: touchTarget + 4,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
  },
  multiline: { minHeight: 112, textAlignVertical: 'top' },
  footer: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.sm },
  message: { flex: 1 },
});
