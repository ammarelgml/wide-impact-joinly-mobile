import { StyleSheet, View } from 'react-native';

import type { RosterStudent } from '@/api/client';
import { formatSince } from '@/lib/format';
import { Avatar, IconButton, Text, colors, spacing } from '@/ui';

export function RosterRow({ student, onMenu }: { student: RosterStudent; onMenu: () => void }) {
  const joined = `Joined ${formatSince(student.joinedAt)} with ${student.joinedVia === 'qr' ? 'QR' : 'code'}`;
  return (
    <View style={styles.row} accessible={false}>
      <Avatar name={student.name} uri={student.avatarUrl} size={44} />
      <View
        style={styles.text}
        accessible
        accessibilityLabel={`${student.name}, ${student.email}. ${joined}`}
      >
        <Text variant="bodyStrong" numberOfLines={1}>
          {student.name}
        </Text>
        <Text variant="caption" tone="muted" numberOfLines={1}>
          {student.email}
        </Text>
        <Text variant="caption" tone="muted">
          {joined}
        </Text>
      </View>
      <IconButton icon="ellipsis-vertical" label={`Options for ${student.name}`} onPress={onMenu} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    backgroundColor: colors.surface,
  },
  text: { flex: 1, gap: spacing.xxs },
});
