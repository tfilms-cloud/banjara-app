import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';

interface StatCardProps {
  label: string;
  value: string;
  tone?: 'blue' | 'amber' | 'green' | 'navy';
  style?: ViewStyle;
}

const tones = {
  blue: Colors.actionSoft,
  amber: Colors.softAmber,
  green: Colors.softGreen,
  navy: Colors.primary,
};

const textTones = {
  blue: Colors.action,
  amber: '#B45309',
  green: Colors.success,
  navy: Colors.white,
};

export function ProviderStatCard({ label, value, tone = 'blue', style }: StatCardProps) {
  return (
    <View style={[styles.card, { backgroundColor: tones[tone] }, style]}>
      <Text style={[styles.value, { color: textTones[tone] }]}>{value}</Text>
      <Text style={[styles.label, { color: textTones[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    minWidth: '45%',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: 4,
  },
  value: { ...Typography.h2, fontWeight: '800' },
  label: { ...Typography.caption, fontWeight: '600', opacity: 0.9 },
});
