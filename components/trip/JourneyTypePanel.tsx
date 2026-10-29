import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { journeyTypeMeta, type JourneyType } from '@/constants/journeyTypes';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
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
  const journey = journeyTypeMeta(journeyType);
  const isRound = journey.value === 'round_trip';

  return (
    <View style={[styles.card, isRound ? styles.cardRound : styles.cardOne, compact && styles.compact]}>
      <View style={styles.header}>
        <View style={[styles.iconWrap, isRound ? styles.iconRound : styles.iconOne]}>
          <Ionicons
            name={isRound ? 'swap-horizontal' : 'arrow-forward'}
            size={18}
            color={isRound ? Colors.actionDark : Colors.primary}
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
  return (
    <View style={styles.pathRow}>
      <Ionicons name={icon} size={16} color={Colors.action} />
      <View style={{ flex: 1 }}>
        <Text style={styles.pathTitle}>{title}</Text>
        <Text style={styles.pathDetail}>{detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.xl,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  compact: {
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  cardOne: {
    backgroundColor: Colors.primarySoft,
    borderColor: Colors.border,
  },
  cardRound: {
    backgroundColor: Colors.actionSoft,
    borderColor: Colors.action,
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
  iconOne: { backgroundColor: Colors.card },
  iconRound: { backgroundColor: Colors.card },
  label: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.dark,
  },
  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 2,
    lineHeight: 17,
  },
  path: { gap: Spacing.sm },
  pathRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.sm,
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: Radius.lg,
    padding: Spacing.sm,
  },
  pathTitle: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    color: Colors.dark,
  },
  pathDetail: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.muted,
    marginTop: 1,
  },
});
