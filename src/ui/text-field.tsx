import { useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';

import { Icon } from './icon';
import { Text } from './text';
import { colors, fonts, radius, space, text } from './theme';

export type TextFieldProps = Omit<TextInputProps, 'style'> & {
  label: string;
  optional?: boolean;
  error?: string;
  helper?: string;
  maxLength?: number;
  /** Shows "12/80" under the field. */
  counter?: boolean;
  /** Read-only while the form saves. */
  busy?: boolean;
};

/** Labelled input. The error sits under the field with an icon and is read as its description. */
export function TextField({
  label,
  optional,
  error,
  helper,
  maxLength,
  counter,
  busy,
  value,
  multiline,
  onFocus,
  onBlur,
  ...rest
}: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const length = value?.length ?? 0;
  const description = [error, helper].filter(Boolean).join('. ');
  return (
    <View style={styles.wrapper}>
      <Text variant="label" importantForAccessibility="no" accessibilityElementsHidden>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        {...rest}
        value={value}
        multiline={multiline}
        maxLength={maxLength}
        editable={!busy}
        accessibilityLabel={optional ? `${label}, optional` : label}
        accessibilityHint={description || undefined}
        accessibilityState={{ disabled: !!busy }}
        placeholderTextColor={colors.ink2}
        cursorColor={colors.primary}
        selectionColor={colors.primarySoft}
        onFocus={(e) => {
          setFocused(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          onBlur?.(e);
        }}
        style={[
          styles.input,
          multiline && styles.multiline,
          focused && styles.focused,
          error ? styles.error : null,
          busy && styles.busy,
        ]}
      />
      {error ? (
        <View style={styles.errorRow} accessibilityLiveRegion="assertive">
          <Icon name="alert-circle-outline" size={16} color={colors.danger} />
          <Text variant="caption" tone="danger" style={styles.flex}>
            {error}
          </Text>
        </View>
      ) : null}
      {helper || (counter && maxLength) ? (
        <View style={styles.meta}>
          <Text variant="caption" style={styles.flex}>
            {helper ?? ''}
          </Text>
          {counter && maxLength ? (
            <Text variant="caption" accessibilityLabel={`${length} of ${maxLength} characters`}>
              {length}/{maxLength}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { gap: 6 },
  optional: { fontFamily: fonts[500], color: colors.ink2 },
  input: {
    ...text('body'),
    minHeight: 56,
    borderWidth: 1.5,
    borderColor: colors.lineStrong,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    paddingHorizontal: space[4],
    paddingVertical: space[3],
    color: colors.ink,
  },
  multiline: { minHeight: 132, paddingVertical: 14, textAlignVertical: 'top' },
  focused: { borderWidth: 2, borderColor: colors.primary },
  error: { borderWidth: 2, borderColor: colors.danger },
  busy: { backgroundColor: colors.surface2 },
  errorRow: { flexDirection: 'row', gap: 6, alignItems: 'flex-start' },
  meta: { flexDirection: 'row', justifyContent: 'space-between', gap: space[3] },
  flex: { flex: 1 },
});
