import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { Seat } from '@/components/seat/Seat';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { Seat as SeatType, SeatLayout, SeatStatus } from '@/types/seat';

interface SeatMapProps {
  layout: SeatLayout;
  selectedSeats: string[];
  onToggleSeat: (seat: SeatType) => void;
}

const LEGEND: Array<{ label: string; status: SeatStatus }> = [
  { label: 'Available', status: 'available' },
  { label: 'Selected', status: 'selected' },
  { label: 'Booked', status: 'occupied' },
  { label: 'Unavailable', status: 'reserved' },
];

export function SeatMap({ layout, selectedSeats, onToggleSeat }: SeatMapProps) {
  const rowNumbers = Array.from(new Set(layout.seats.map((seat) => seat.row))).sort(
    (a, b) => a - b
  );

  return (
    <View style={styles.container}>
      <View style={styles.driver} accessibilityLabel="Driver at the front of the vehicle">
        <Text style={styles.driverText}>Driver</Text>
      </View>

      <ScrollView
        horizontal
        nestedScrollEnabled
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.gridScroll}
      >
        <View style={styles.grid}>
          {rowNumbers.map((rowNumber) => {
            const rowSeats = layout.seats
              .filter((seat) => seat.row === rowNumber)
              .sort((a, b) => a.column - b.column);
            return (
              <View key={`row-${rowNumber}`} style={styles.row}>
                {rowSeats.map((seat) => {
                  const displaySeat: SeatType = selectedSeats.includes(seat.label)
                    ? { ...seat, status: 'selected' }
                    : seat;
                  const showAisleGap = seat.column === layout.aisleAfterColumn;
                  return (
                    <View key={seat.id} style={styles.seatWrap}>
                      <Seat seat={displaySeat} onPress={onToggleSeat} />
                      {showAisleGap ? (
                        <View style={styles.aisle} accessibilityLabel="Aisle">
                          <View style={styles.aisleLine} />
                        </View>
                      ) : null}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.legend} accessibilityLabel="Seat status legend">
        {LEGEND.map((item) => (
          <View key={item.label} style={styles.legendItem}>
            <View
              style={[
                styles.legendSwatch,
                item.status === 'available' && styles.legendAvailable,
                item.status === 'selected' && styles.legendSelected,
                item.status === 'occupied' && styles.legendBooked,
                item.status === 'reserved' && styles.legendReserved,
              ]}
            />
            <Text style={styles.legendText}>{item.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.card,
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.lg,
  },
  driver: {
    alignSelf: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing['2xl'],
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    minHeight: 36,
    justifyContent: 'center',
  },
  driverText: {
    fontFamily: Fonts.bodyBold,
    fontSize: 11,
    color: Colors.white,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  gridScroll: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  grid: {
    gap: Spacing.md,
    alignItems: 'center',
    minWidth: '100%',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  seatWrap: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  aisle: {
    width: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  aisleLine: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: Colors.border,
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendSwatch: {
    width: 16,
    height: 16,
    borderRadius: 5,
    borderWidth: 1.5,
  },
  legendAvailable: {
    backgroundColor: Colors.card,
    borderColor: Colors.primary,
  },
  legendSelected: {
    backgroundColor: Colors.action,
    borderColor: Colors.actionDark,
  },
  legendBooked: {
    backgroundColor: Colors.seatOccupied,
    borderColor: Colors.seatOccupied,
  },
  legendReserved: {
    backgroundColor: Colors.softAmber,
    borderColor: Colors.accent,
  },
  legendText: {
    ...Typography.small,
    color: Colors.muted,
  },
});
