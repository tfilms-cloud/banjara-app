import { Text } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { CustomerType } from '@/constants/typography';

/** TODO: obtain verified road status before enabling this static preview. */
export function RoadStatusChip() {
  const colors = useThemeColors();
  return <Text style={[CustomerType.micro, { alignSelf: 'flex-start', paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs, borderRadius: Radius.full, color: colors.white, backgroundColor: colors.primaryDark }]}>Road status preview</Text>;
}
