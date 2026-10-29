import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { journeyTypeMeta, type JourneyType } from '@/constants/journeyTypes';
import { useThemeColors, type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { CustomerType, Fonts } from '@/constants/typography';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

type JourneyTypePanelProps = {
  journeyType?: JourneyType | string | null;
  from?: string;
  to?: string;
  returnDate?: string;
  returnTime?: string;
  compact?: boolean;
};

export function JourneyTypePanel({
  journeyType,
  from,
  to,
  returnDate,
  returnTime,
  compact,
}: JourneyTypePanelProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const journey = journeyTypeMeta(journeyType);
  const isRound = journey.value === 'round_trip';

  return (
    <View style={[styles.card, isRound ? styles.cardRound : styles.cardOne, compact && styles.compact]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, isRound ? styles.iconRound : styles.iconOne]}>
          <Ionicons
            name={isRound ? 'swap-horizontal' : 'arrow-forward'}
            size={18}
            color={isRound ? colors.actionDark : colors.primary}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.label}>{journey.label}</Text>
          <Text style={styles.hint}>{journey.customerHint}</Text>
        </View>
      </View>

      {!compact ? (
        <View style={styles.path}>
          <PathRow
            icon="navigate-outline"
            title="Going"
            detail={from && to ? `${from} → ${to}` : 'To destination'}
          />
          {isRound ? (
            <PathRow
              icon="home-outline"
              title="Return home"
              detail={
                returnDate || returnTime
                  ? [returnDate ? formatDate(returnDate, false) : null, returnTime ? formatTime(returnTime) : null]
                      .filter(Boolean)
                      .join(' · ')
                  : from && to
                    ? `${to} → ${from}`
                    : 'Back to origin'
              }
            />
          ) : (
            <PathRow
              icon="flag-outline"
              title="No return included"
              detail="Book a separate trip if you need to come back"
            />
          )}
        </View>
      ) : null}
    </View>
  );
}

function PathRow({
  icon,
  title,
  detail,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  detail: string;
}) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  return (
    <View style={styles.pathRow}>
      <Ionicons name={icon} size={16} color={colors.action} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pathTitle}>{title}</Text>
        <Text style={styles.pathDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.lg,
    ...Shadows.soft,
    gap: Spacing.md,
  },
  compact: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  cardOne: {
    backgroundColor: colors.primarySoft,
    borderColor: colors.border,
  },
  cardRound: {
    backgroundColor: colors.actionSoft,
    borderColor: colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconOne: { backgroundColor: colors.card },
  iconRound: { backgroundColor: colors.card },
  label: {
    ...CustomerType.card,
    color: colors.dark,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
    lineHeight: 20,
  },
  path: { gap: Spacing.sm },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  pathTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: colors.dark,
  },
  pathDetail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: colors.muted,
    marginTop: 1,
  },
});
