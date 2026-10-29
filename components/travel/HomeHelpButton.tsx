import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType } from '@/constants/typography';

/** Static preview only. TODO: wire the actual supported help route before enabling. */
export function HomeHelpButton() {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return <View pointerEvents="none" style={[styles.pill, { bottom: insets.bottom + Spacing.lg, backgroundColor: colors.coralSoft, borderColor: colors.coral }]}>
    <Text style={[CustomerType.label, { color: colors.coralText }]}>Help preview</Text>
  </View>;
}
const styles = StyleSheet.create({ pill: { position: 'absolute', right: Spacing.screen, borderWidth: Size.border, borderRadius: Radius.full, paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm, ...Shadows.float } });
