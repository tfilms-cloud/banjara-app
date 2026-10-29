import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

type StarRatingRowProps = {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  hint?: string;
  size?: number;
};

const LABELS = ['', 'Poor', 'Fair', 'Good', 'Great', 'Excellent'];

export function StarRatingRow({
  value,
  onChange,
  label,
  hint,
  size = 36,
}: StarRatingRowProps) {
  return (
    <View style={styles.wrap}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      <View style={styles.stars}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable
            key={n}
            onPress={() => onChange(n)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={`${n} stars`}
            accessibilityState={{ selected: n <= value }}
          >
            <Text style={[styles.star, { fontSize: size }, n <= value && styles.starOn]}>★</Text>
          </Pressable>
        ))}
      </View>
      {value > 0 ? <Text style={styles.valueLabel}>{LABELS[value]}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.xs },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 16,
    color: Colors.dark,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 2,
  },
  stars: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  star: {
    color: Colors.border,
  },
  starOn: {
    color: Colors.accent,
  },
  valueLabel: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.muted,
    marginTop: 2,
  },
});
