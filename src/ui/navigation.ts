import { colors } from './theme';

/** Shared native-stack header styling. */
export const stackScreenOptions = {
  headerShadowVisible: false,
  headerStyle: { backgroundColor: colors.background },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: '600' as const },
  contentStyle: { backgroundColor: colors.background },
};
