import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useTourBookingStore } from '@/store/tourBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export default function TourReviewScreen() {
  const insets = useSafeAreaInsets();
  const { itinerary, startDate, travelers, guest, priceBreakdown } = useTourBookingStore();

  if (!itinerary || !priceBreakdown) {
    return (
      <View style={styles.container}>
        <Header title="Review" showBack fallbackHref="/(customer)/(tabs)" />
        <Text style={styles.empty}>Incomplete booking details.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Header title="Review booking" showBack />
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg,
          paddingBottom: insets.bottom + 100,
          gap: Spacing.lg,
        }}
      >
        <View style={styles.card}>
          <Text style={styles.title}>{itinerary.title}</Text>
          <Text style={styles.meta}>
            {[itinerary.tourType, itinerary.destination, `${itinerary.durationDays} days`]
              .filter(Boolean)
              .join(' · ')}
          </Text>
          <Text style={styles.meta}>Starts {formatDate(startDate)}</Text>
          <Text style={styles.meta}>
            {travelers} traveler{travelers === 1 ? '' : 's'}
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Lead traveler</Text>
          <Text style={styles.meta}>{guest.name}</Text>
          <Text style={styles.meta}>{guest.email}</Text>
          <Text style={styles.meta}>{guest.phone}</Text>
          {guest.specialRequests ? (
            <Text style={styles.meta}>Requests: {guest.specialRequests}</Text>
          ) : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Price</Text>
          <Row label="Package" value={formatCurrency(priceBreakdown.subtotal, priceBreakdown.currency)} />
          <Row label="Tax" value={formatCurrency(priceBreakdown.tax, priceBreakdown.currency)} />
          <Row
            label="Service fee"
            value={formatCurrency(priceBreakdown.serviceFee, priceBreakdown.currency)}
          />
          <View style={styles.divider} />
          <Row
            label="Total"
            value={formatCurrency(priceBreakdown.total, priceBreakdown.currency)}
            bold
          />
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Continue to payment" onPress={() => router.push('/(customer)/tours/payment')} />
      </View>
    </View>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, bold && styles.bold]}>{label}</Text>
      <Text style={[styles.rowValue, bold && styles.bold]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  empty: { ...Typography.body, color: Colors.muted, padding: Spacing.lg },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  title: { fontFamily: Fonts.display, fontSize: 20, color: Colors.dark },
  section: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: Colors.primary },
  meta: { ...Typography.body, color: Colors.muted, textTransform: 'capitalize' },
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  rowLabel: { ...Typography.body, color: Colors.muted },
  rowValue: { fontFamily: Fonts.bodySemiBold, color: Colors.dark },
  bold: { fontFamily: Fonts.display, fontSize: 16, color: Colors.dark },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: Colors.border, marginVertical: 4 },
  cta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
  },
});
