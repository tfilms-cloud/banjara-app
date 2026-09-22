import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { TRUST_POINTS } from '@/constants/destinations';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

const ICON_TONES = ['#16B364', '#0F9B98', '#7C6CFF', '#F5B83D'] as const;

export function TrustGrid() {
  const colors = useThemeColors();

  return (
    <View style={styles.grid}>
      {TRUST_POINTS.map((point, index) => {
        const tone = ICON_TONES[index % ICON_TONES.length];
        return (
          <Pressable
            key={point.id}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.88 : 1,
              },
            ]}
            accessibilityRole="summary"
            accessibilityLabel={`${point.label}. ${point.caption}`}
          >
            <View style={[styles.icon, { backgroundColor: `${tone}22` }]}>
              <Ionicons name={point.icon} size={18} color={tone} />
            </View>
            <View style={styles.copy}>
              <Text style={[styles.label, { color: colors.dark }]}>{point.label}</Text>
              <Text style={[styles.caption, { color: colors.muted }]}>{point.caption}</Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    marginHorizontal: Spacing.screen,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  card: {
    width: '48%',
    flexGrow: 1,
    minHeight: 92,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  icon: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    minWidth: 0,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    lineHeight: 18,
  },
  caption: {
    fontFamily: Fonts.body,
    fontSize: 11,
    lineHeight: 15,
    marginTop: 2,
  },
});
