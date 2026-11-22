import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { Text } from './text';
import { colors, fonts } from './theme';

const TITLES = /^(mr|mrs|ms|miss|dr|prof)\.?$/i;

/** "Ms. Amira Hassan" -> "AH": first and last name, skipping a leading title. */
export function initials(name: string): string {
  const all = name.trim().split(/\s+/).filter(Boolean);
  const parts = all.length > 2 && TITLES.test(all[0] ?? '') ? all.slice(1) : all;
  const first = parts[0]?.[0] ?? '?';
  const last = parts.length > 1 ? (parts[parts.length - 1]?.[0] ?? '') : '';
  return (first + last).toUpperCase();
}

/** Initials tints rotate by name, so a roster of initials is easy to scan. Each pair passes 4.5:1. */
const tints = [
  { bg: colors.primarySoft, fg: colors.onPrimarySoft },
  { bg: colors.successSoft, fg: colors.success },
  { bg: colors.warningSoft, fg: colors.warning },
  { bg: colors.surface2, fg: colors.ink },
] as const;

function tintFor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) | 0;
  return tints[Math.abs(hash) % tints.length] ?? tints[0];
}

/**
 * Google photo with initials underneath, shown while the photo loads or when there is none.
 * Decorative: the name next to it is what screen readers read.
 */
export function Avatar({
  name,
  uri,
  size = 40,
  tinted = true,
}: {
  name: string;
  uri?: string | null;
  size?: 28 | 40 | 72;
  /** Rotate the initials tint by name (lists); off for the signed-in user's own avatar. */
  tinted?: boolean;
}) {
  const [failed, setFailed] = useState(false);
  const tint = tinted ? tintFor(name) : tints[0];
  const shape = { width: size, height: size, borderRadius: size / 2 };
  const fontSize = size === 72 ? 24 : size === 28 ? 12 : 15;
  return (
    <View
      style={[styles.base, shape, { backgroundColor: tint.bg }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <Text
        style={{ fontFamily: fonts[600], fontSize, lineHeight: fontSize * 1.2, color: tint.fg }}
      >
        {initials(name)}
      </Text>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, shape]}
          contentFit="cover"
          transition={150}
          onError={() => setFailed(true)}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
});
