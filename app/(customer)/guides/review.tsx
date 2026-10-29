import { router } from 'expo-router';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { useGuideBookingStore } from '@/store/guideBookingStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';

export default function GuideReviewScreen() {
  const insets = useSafeAreaInsets();
  const {
    providerName,
    service,
    date,
    startTime,
    endTime,
    guests,
    meetingPoint,
    availableLocation,
    specialRequest,
    guest,
    priceBreakdown,
  } = useGuideBookingStore();

  if (!service || !priceBreakdown) {
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
          <Text style={styles.title}>{service.name}</Text>
          <Text style={styles.meta}>Guide: {providerName}</Text>
          <Text style={styles.meta}>Date: {formatDate(date)}</Text>
          <Text style={styles.meta}>
            Time: {startTime}
            {endTime ? ` – ${endTime}` : ''}
          </Text>
          <Text style={styles.meta}>
            {guests} guest{guests === 1 ? '' : 's'}
          </Text>
          {meetingPoint ? <Text style={styles.meta}>Meet: {meetingPoint}</Text> : null}
          {availableLocation ? <Text style={styles.meta}>Your location: {availableLocation}</Text> : null}
          {specialRequest ? <Text style={styles.meta}>Request: {specialRequest}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Guest</Text>
          <Text style={styles.meta}>{guest.name}</Text>
          <Text style={styles.meta}>{guest.email}</Text>
          <Text style={styles.meta}>{guest.phone}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Price</Text>
          <Row label="Service" value={formatCurrency(priceBreakdown.subtotal, priceBreakdown.currency)} />
          <Row label="Tax" value={formatCurrency(priceBreakdown.tax, priceBreakdown.currency)} />
          <Row label="Service fee" value={formatCurrency(priceBreakdown.serviceFee, priceBreakdown.currency)} />
          <View style={styles.divider} />
          <Row label="Total" value={formatCurrency(priceBreakdown.total, priceBreakdown.currency)} bold />
        </View>
      </ScrollView>

      <View style={[styles.cta, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button title="Continue to payment" onPress={() => router.push('/(customer)/guides/payment')} />
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
  meta: { ...Typography.body, color: Colors.muted },
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
