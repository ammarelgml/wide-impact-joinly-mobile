import { StyleSheet, View } from 'react-native';

import type { RosterStudent } from '@/api/client';
import { formatSince } from '@/lib/format';
import { Avatar, IconButton, Loading, SkeletonBlock, Text, colors, font, space } from '@/ui';

/** A student on T3's roster: photo, name, email, when they joined, and a ⋮ menu. */
export function RosterRow({ student, onMenu }: { student: RosterStudent; onMenu: () => void }) {
  const joined = `Joined ${formatSince(student.joinedAt)}`;
  return (
    <View style={styles.row}>
      <Avatar name={student.name} uri={student.avatarUrl} />
      <View
        style={styles.text}
        accessible
        accessibilityLabel={`${student.name}, ${student.email}. ${joined}`}
      >
        <Text style={styles.name} numberOfLines={1}>
          {student.name}
        </Text>
        <Text style={styles.email} numberOfLines={1}>
          {student.email}
        </Text>
        <Text variant="caption">{joined}</Text>
      </View>
      <IconButton
        testID={`student-menu-${student.id}`}
        icon="ellipsis-vertical"
        label={`Options for ${student.name}`}
        onPress={onMenu}
      />
    </View>
  );
}

export function RosterRowSkeleton() {
  return (
    <View style={styles.row}>
      <SkeletonBlock width={40} height={40} rounded={20} />
      <View style={[styles.text, { gap: space[2] }]}>
        <SkeletonBlock width="55%" height={16} />
        <SkeletonBlock width="75%" height={12} />
      </View>
    </View>
  );
}

export function RosterSkeleton({ rows = 3 }: { rows?: number }) {
  return (
    <Loading gap={0}>
      {Array.from({ length: rows }, (_, i) => (
        <RosterRowSkeleton key={i} />
      ))}
    </Loading>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space[3],
    minHeight: 72,
    paddingVertical: 10,
    paddingStart: space[4],
    paddingEnd: space[1],
    backgroundColor: colors.surface,
  },
  text: { flex: 1, minWidth: 0 },
  name: { ...font(600, 16, 22), color: colors.ink },
  email: { ...font(400, 14, 20), color: colors.ink2 },
});
