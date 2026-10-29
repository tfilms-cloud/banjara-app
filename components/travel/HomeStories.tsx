import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Size, Spacing } from '@/constants/spacing';
import { CustomerType } from '@/constants/typography';

/** Optional static design preview. TODO: connect approved story content/actions. */
export function HomeStories() {
  const colors = useThemeColors();
  return <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
    {['Story preview', 'Travel preview'].map(label => <View key={label} style={styles.item}>
      <View style={[styles.circle, { borderColor: colors.primary, backgroundColor: colors.primarySoft }]} />
      <Text style={[CustomerType.micro, { color: colors.muted }]}>{label}</Text>
    </View>)}
  </ScrollView>;
}
const styles = StyleSheet.create({
  row: { paddingHorizontal: Spacing.screen, gap: Spacing.lg, paddingBottom: Spacing.md },
  item: { alignItems: 'center', gap: Spacing.xs },
  circle: { width: Size.avatar, height: Size.avatar, borderRadius: Radius.full, borderWidth: Size.borderStrong },
});
