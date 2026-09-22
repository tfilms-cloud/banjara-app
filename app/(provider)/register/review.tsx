import { router } from 'expo-router';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { SERVICE_OPTIONS } from '@/constants/providerOptions';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

function Row({ label, value }: { label: string; value?: string }) {
  if (!value) return null;
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function ProviderReviewScreen() {
  const insets = useSafeAreaInsets();
  const draft = useProviderStore((s) => s.draft);
  const submitApplication = useProviderStore((s) => s.submitApplication);
  const loading = useProviderStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const updateProviderLink = useAuthStore((s) => s.updateProviderLink);

  const onSubmit = async () => {
    try {
      let currentUser = user;
      const token = useAuthStore.getState().token;
      const needsAccount = !currentUser || !token || token === 'guest-token';

      if (needsAccount) {
        if (!draft.personal.email || !draft.personal.password || !draft.personal.name) {
          throw new Error('Complete personal details before submitting.');
        }
        await useAuthStore.getState().register({
          name: draft.personal.name,
          email: draft.personal.email,
          phone: draft.personal.phone,
          password: draft.personal.password,
          role: 'provider',
          providerStatus: 'pending',
        });
        currentUser = useAuthStore.getState().user;
      }

      if (!currentUser) throw new Error('Please sign in before submitting.');

      const provider = await submitApplication(currentUser.id);
      updateProviderLink(provider.id, 'pending');

      if (draft.location) {
        try {
          const { saveMyBusinessLocation } = await import('@/services/locationService');
          await saveMyBusinessLocation({
            address: draft.location.address,
            latitude: draft.location.latitude,
            longitude: draft.location.longitude,
          });
        } catch {
          // Profile already has GeoJSON from register; structured address can be edited later.
        }
      }

      router.replace('/(provider)/register/success');
    } catch (error) {
      Alert.alert('Submission failed', getApiErrorMessage(error));
    }
  };

  return (
    <View style={styles.container}>
      <Header title="Review Application" showBack fallbackHref="/(provider)/register/verification" />
      <ScrollView contentContainerStyle={{ padding: Spacing.lg, paddingBottom: insets.bottom + 40, gap: Spacing.lg }}>
        <Text style={styles.heading}>Confirm your details</Text>

        <View style={styles.card}>
          <Text style={styles.section}>Personal</Text>
          <Row label="Name" value={draft.personal.name} />
          <Row label="Email" value={draft.personal.email} />
          <Row label="Phone" value={draft.personal.phone} />
          <Button title="Edit" variant="ghost" onPress={() => router.push('/(provider)/register' as never)} />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Services</Text>
          <Text style={styles.value}>
            {draft.selectedServices[0]
              ? SERVICE_OPTIONS.find((item) => item.type === draft.selectedServices[0])?.label ??
                draft.selectedServices[0]
              : 'None selected'}
          </Text>
          <Button title="Edit" variant="ghost" onPress={() => router.push('/(provider)/register/services')} />
        </View>

        <View style={styles.card}>
          <Text style={styles.section}>Business</Text>
          <Row label="Business" value={draft.business.businessName} />
          <Row label="Owner" value={draft.business.ownerName} />
          <Row label="City" value={draft.business.city} />
          <Row label="Address" value={draft.business.address} />
          <Button title="Edit" variant="ghost" onPress={() => router.push('/(provider)/register/business')} />
        </View>

        {draft.location ? (
          <View style={styles.card}>
            <Text style={styles.section}>Location</Text>
            <Row label="Pin" value={draft.location.address.formattedAddress} />
            <Row
              label="Coordinates"
              value={`${draft.location.latitude.toFixed(5)}, ${draft.location.longitude.toFixed(5)}`}
            />
            <Button
              title="Edit"
              variant="ghost"
              onPress={() =>
                router.push({ pathname: '/(provider)/location', params: { mode: 'onboarding' } } as never)
              }
            />
          </View>
        ) : null}

        {draft.transport ? (
          <View style={styles.card}>
            <Text style={styles.section}>Transport</Text>
            <Row label="Name" value={draft.transport.businessName} />
            <Row label="Vehicles" value={String(draft.transport.vehicleCount ?? '')} />
            <Row label="Vehicle type" value={draft.transport.vehicleTypes?.join(', ')} />
            <Row label="Ownership" value={draft.transport.ownershipType} />
            <Row
              label="Pricing"
              value={
                draft.transport.pricingMethod === 'negotiable'
                  ? 'Negotiable'
                  : [
                      draft.transport.pricingMethod === 'per_vehicle' ? 'Per vehicle' : 'Per seat',
                      draft.transport.priceAmount ? `PKR ${draft.transport.priceAmount}` : null,
                      draft.transport.pricePercent != null ? `${draft.transport.pricePercent}% advance` : null,
                    ]
                      .filter(Boolean)
                      .join(' · ')
              }
            />
            <Row label="Routes" value={draft.transport.operatingRoutes?.join(', ')} />
          </View>
        ) : null}

        {draft.hotel ? (
          <View style={styles.card}>
            <Text style={styles.section}>Hotel</Text>
            <Row label="Hotel" value={draft.hotel.hotelName} />
            <Row label="Type" value={draft.hotel.hotelType} />
            <Row label="City" value={draft.hotel.city} />
          </View>
        ) : null}

        {draft.tour ? (
          <View style={styles.card}>
            <Text style={styles.section}>Tour</Text>
            <Row label="Tour" value={draft.tour.tourName} />
            <Row label="Destination" value={draft.tour.destination} />
            <Row label="Duration" value={draft.tour.duration} />
          </View>
        ) : null}

        <Button title="Submit Application" loading={loading} onPress={onSubmit} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  heading: { ...Typography.h2, color: Colors.primary },
  card: {
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  section: { ...Typography.h3, color: Colors.primary, marginBottom: Spacing.xs },
  row: { gap: 2 },
  label: { ...Typography.caption, color: Colors.muted },
  value: { ...Typography.body, color: Colors.dark },
});
