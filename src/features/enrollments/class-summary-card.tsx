import { StyleSheet, View } from 'react-native';

import type { ClassroomSummary } from '@/api/client';
import { formatStudentCount } from '@/lib/format';
import {
  Avatar,
  Card,
  Divider,
  Icon,
  Loading,
  SkeletonBlock,
  Text,
  colors,
  font,
  space,
} from '@/ui';

/** The class a student is joining (P4) or has joined (P5): name, description, teacher, size. */
export function ClassSummaryCard({
  classroom,
  joined,
}: {
  classroom: ClassroomSummary;
  /** "Joined 3 days ago", shown on P5 before the student count. */
  joined?: string;
}) {
  return (
    <Card style={styles.card} testID="class-summary">
      <View>
        <Text variant="title" accessibilityRole="header" testID="preview-name">
          {classroom.name}
        </Text>
        {classroom.description ? (
          <Text variant="body2" style={styles.description}>
            {classroom.description}
          </Text>
        ) : null}
      </View>
      <Divider />
      <View style={styles.row}>
        <Avatar name={classroom.teacher.name} uri={classroom.teacher.avatarUrl} />
        <View style={styles.grow}>
          <Text variant="label">{classroom.teacher.name}</Text>
          <Text variant="caption">Teacher</Text>
        </View>
      </View>
      <View style={styles.meta}>
        {joined ? (
          <>
            <Icon name="calendar-outline" size={18} color={colors.ink2} />
            <Text style={styles.metaText}>{joined}</Text>
            <View style={styles.sep} />
          </>
        ) : null}
        <Icon name="people-outline" size={18} color={colors.ink2} />
        <Text style={styles.metaText}>{formatStudentCount(classroom.studentCount)}</Text>
      </View>
    </Card>
  );
}

export function ClassSummarySkeleton() {
  return (
    <Card style={styles.skeleton}>
      <Loading>
        <SkeletonBlock width="80%" height={26} />
        <SkeletonBlock width="100%" height={14} />
        <SkeletonBlock width="60%" height={14} />
        <View style={[styles.row, { marginTop: space[2] }]}>
          <SkeletonBlock width={40} height={40} rounded={20} />
          <SkeletonBlock width="40%" height={16} />
        </View>
        <SkeletonBlock width="30%" height={14} />
      </Loading>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: space[4], padding: 20 },
  skeleton: { gap: space[3] },
  description: { marginTop: space[2] },
  row: { flexDirection: 'row', alignItems: 'center', gap: space[3] },
  grow: { flex: 1, minWidth: 0 },
  meta: { flexDirection: 'row', alignItems: 'center', gap: 6, flexWrap: 'wrap' },
  metaText: { ...font(500, 14, 20), color: colors.ink2 },
  sep: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: colors.ink2 },
});
