import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { colors } from './theme';

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Profile photo with an initials fallback. Decorative: the name next to it is what screen readers read. */
export function Avatar({
  name,
  uri,
  size = 40,
}: {
  name: string;
  uri?: string | null;
  size?: number;
}) {
  const shape = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View
      style={[styles.base, shape]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      {uri ? (
        <Image source={{ uri }} style={shape} contentFit="cover" transition={150} />
      ) : (
        <Text
          variant="label"
          style={{ fontSize: size * 0.38, lineHeight: size * 0.5, color: colors.primary }}
        >
          {initials(name)}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
});
