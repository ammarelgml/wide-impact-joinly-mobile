import Svg, { Rect } from 'react-native-svg';
import { View } from 'react-native';

import { colors } from './theme';

/** The Joinly app mark: a rounded primary tile with a framed square. Decorative. */
export function JoinlyMark({ size = 96 }: { size?: 72 | 96 }) {
  const glyph = size === 96 ? 52 : 40;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        width: size,
        height: size,
        borderRadius: size === 96 ? 28 : 22,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Svg width={glyph} height={glyph} viewBox="0 0 40 40" fill="none">
        <Rect x={5} y={5} width={30} height={30} rx={9} stroke={colors.onPrimary} strokeWidth={4} />
        <Rect x={14.5} y={14.5} width={11} height={11} rx={3} fill={colors.onPrimary} />
      </Svg>
    </View>
  );
}
