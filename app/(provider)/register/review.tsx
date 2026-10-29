import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useMemo, type ComponentProps, type ReactNode } from 'react';
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/ui/Header';
import { useThemeColors } from '@/constants/colors';
import { SERVICE_OPTIONS, stayTypeLabel } from '@/constants/providerOptions';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { getApiErrorMessage } from '@/services/apiError';
import { useAuthStore } from '@/store/authStore';
import { useProviderStore } from '@/store/providerStore';

type IoniconName = ComponentProps<typeof Ionicons>['name'];

function Row({
  label,
  value,
  last,
}: {
  label: string;
  value?: string;
  last?: boolean;
}) {
  const colors = useThemeColors();
  if (!value) return null;
  return (
    <View
      style={[
        styles.row,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
      ]}
    >
      <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
      <Text style={[styles.value, { color: colors.dark }]}>{value}</Text>
    </View>
  );
}

function ReviewSection({
  icon,
  title,
  onEdit,
  editHref,
  children,
  index,
}: {
  icon: IoniconName;
  title: string;
  onEdit?: () => void;
  editHref?: string;
  children: ReactNode;
  index: number;
}) {
  const colors = useThemeColors();
  const handleEdit = () => {
    if (onEdit) onEdit();
    else if (editHref) router.push(editHref as never);
  };

  return (
    <Animated.View
      entering={FadeInDown.delay(80 + index * 60).springify().damping(18)}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.cardHead}>
        <View style={styles.cardHeadLeft}>
          <View style={[styles.iconBubble, { backgroundColor: colors.primarySoft }]}>
            <Ionicons name={icon} size={18} color={colors.primary} />
          </View>
          <Text style={[styles.sectionTitle, { color: colors.dark }]}>{title}</Text>
        </View>
        {onEdit || editHref ? (
          <Pressable
            onPress={handleEdit}
            hitSlop={8}
            style={[styles.editChip, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
            accessibilityRole="button"
            accessibilityLabel={`Edit ${title}`}
          >
            <Ionicons name="pencil-outline" size={14} color={colors.primary} />
            <Text style={[styles.editText, { color: colors.primary }]}>Edit</Text>
          </Pressable>
        ) : null}
      </View>
      <View style={styles.cardBody}>{children}</View>
    </Animated.View>
  );
}

function visibleRows(
  pairs: Array<{ label: string; value?: string }>
): Array<{ label: string; value: string }> {
  return pairs.filter((p): p is { label: string; value: string } => Boolean(p.value));
}

export default function ProviderReviewScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const colors = useThemeColors();
  const draft = useProviderStore((s) => s.draft);
  const provider = useProviderStore((s) => s.provider);
  const vehicles = useProviderStore((s) => s.vehicles);
  const primaryVehicle = vehicles.find((item) => item.id === provider?.onboardingProgress?.vehicleId);
  const submitApplication = useProviderStore((s) => s.submitApplication);
  const loading = useProviderStore((s) => s.loading);
  const user = useAuthStore((s) => s.user);
  const updateProviderLink = useAuthStore((s) => s.updateProviderLink);

  const contentMax = Math.min(width - Spacing.lg * 2, 560);
  const horizontalPad = Math.max(Spacing.lg, (width - contentMax) / 2);

  const serviceMeta = useMemo(() => {
    const type = draft.selectedServices[0];
    const label = type
      ? SERVICE_OPTIONS.find((item) => item.type === type)?.label ?? type
      : 'None selected';
    const icon: IoniconName =
      type === 'hotel'
        ? 'bed-outline'
        : type === 'tour'
          ? 'map-outline'
          : type === 'travelGuide'
            ? 'compass-outline'
            : type === 'restaurant'
              ? 'restaurant-outline'
              : 'bus-outline';
    return { label, icon };
  }, [draft.selectedServices]);

  const personalRows = visibleRows([
    { label: 'Name', value: user?.name || draft.personal.name },
    { label: 'Email', value: user?.email || draft.personal.email },
    { label: 'Phone', value: user?.phone || draft.personal.phone },
  ]);

  const businessRows = visibleRows([
    { label: 'Business', value: draft.business.businessName },
    { label: 'Owner', value: draft.business.ownerName },
    { label: 'City', value: draft.business.city },
    { label: 'Address', value: draft.business.address },
  ]);

  const locationRows = draft.location
    ? visibleRows([
        { label: 'Pin', value: draft.location.address.formattedAddress },
        {
          label: 'Coordinates',
          value: `${draft.location.latitude.toFixed(5)}, ${draft.location.longitude.toFixed(5)}`,
        },
      ])
    : [];

  const transportRows = draft.transport
    ? visibleRows([
        {
          label: 'Vehicle class',
          value: draft.transport.vehicleClass ?? draft.transport.vehicleTypes?.join(', '),
        },
        { label: 'Owner name', value: draft.transport.ownerName },
        { label: 'Vehicle model', value: draft.transport.vehicleModel },
        { label: 'Make year', value: draft.transport.vehicleMakeYear },
        { label: 'Engine number', value: draft.transport.engineNumber },
        { label: 'Registration', value: draft.transport.registrationNumber },
        { label: 'Driver', value: draft.transport.driverName },
        { label: 'Driver phone', value: draft.transport.driverPhone },
        { label: 'Driver CNIC', value: draft.transport.driverCnic },
        { label: 'License', value: draft.transport.driverLicenseNumber },
        {
          label: 'Experience',
          value: draft.transport.driverExperienceYears
            ? `${draft.transport.driverExperienceYears} yrs`
            : undefined,
        },
        {
          label: 'Insurance',
          value:
            draft.transport.hasInsurance === 'yes'
              ? 'Yes'
              : draft.transport.hasInsurance,
        },
        { label: 'Insurer', value: draft.transport.insuranceCompany },
        { label: 'Policy #', value: draft.transport.insuranceNumber },
        { label: 'Business', value: draft.transport.businessName },
        { label: 'Routes', value: draft.transport.operatingRoutes?.join(', ') },
      ])
    : [];

  const hotelRows = draft.hotel
    ? visibleRows([
        { label: 'Property', value: draft.hotel.hotelName },
        { label: 'Type', value: stayTypeLabel(draft.hotel.hotelType) },
        { label: 'Manager', value: draft.hotel.managerName },
        { label: 'Mobile', value: draft.hotel.phone },
        { label: 'Landline', value: draft.hotel.landline },
        { label: 'Village', value: draft.hotel.village },
        { label: 'District', value: draft.hotel.district },
        { label: 'City', value: draft.hotel.city },
        {
          label: 'Business registration',
          value:
            draft.hotel.businessRegistered === 'yes'
              ? draft.hotel.businessRegistrationNumber || 'Yes'
              : draft.hotel.businessRegistered,
        },
        {
          label: 'Hospitality experience',
          value:
            draft.hotel.yearsExperience != null
              ? `${draft.hotel.yearsExperience} yrs`
              : undefined,
        },
        {
          label: 'Restaurant',
          value:
            draft.hotel.restaurantAvailable === 'yes'
              ? 'Yes'
              : draft.hotel.restaurantAvailable === 'no'
                ? 'No'
                : undefined,
        },
        {
          label: 'Photos',
          value: `${(draft.hotel.images ?? []).length} uploaded`,
        },
      ])
    : [];

  const tourRows = draft.tour
    ? visibleRows([
        { label: 'Tour', value: draft.tour.tourName },
        { label: 'Destination', value: draft.tour.destination },
        { label: 'Duration', value: draft.tour.duration },
      ])
    : [];

  const restaurantRows = draft.restaurant
    ? visibleRows([
        { label: 'Restaurant', value: draft.restaurant.restaurantName },
        { label: 'City', value: draft.restaurant.city },
        { label: 'Cuisine', value: draft.restaurant.cuisineTypes?.join(', ') },
        { label: 'Menu', value: draft.restaurant.menuVariety?.join(', ') },
        {
          label: 'Offers',
          value: draft.restaurant.offers?.map((o) => o.title).join(', '),
        },
        { label: 'Phone', value: draft.restaurant.phone },
      ])
    : [];

  let sectionIndex = 0;

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
      updateProviderLink(provider.id, provider.verificationStatus);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Header title="Review Application" showBack fallbackHref="/(provider)/register/verification" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: horizontalPad,
          paddingTop: Spacing.md,
          paddingBottom: insets.bottom + 120,
          gap: Spacing.md,
          maxWidth: contentMax + horizontalPad * 2,
          alignSelf: 'center',
          width: '100%',
        }}
      >
        <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.heroWrap}>
          <LinearGradient
            colors={[colors.primarySoft, colors.surfaceSecondary]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.hero}
          >
            <View style={[styles.heroIcon, { backgroundColor: colors.card }]}>
              <Ionicons name="checkmark-circle" size={28} color={colors.primary} />
            </View>
            <Text style={[styles.heroTitle, { color: colors.dark }]}>Confirm your details</Text>
            <Text style={[styles.heroSub, { color: colors.muted }]}>
              Check each section before you submit. You can edit anything that looks off.
            </Text>
          </LinearGradient>
        </Animated.View>

        <ReviewSection
          icon="person-outline"
          title="Personal"
          editHref={user ? undefined : '/(provider)/register'}
          index={sectionIndex++}
        >
          {personalRows.map((row, i) => (
            <Row key={row.label} label={row.label} value={row.value} last={i === personalRows.length - 1} />
          ))}
        </ReviewSection>

        <ReviewSection
          icon="grid-outline"
          title="Services"
          editHref="/(provider)/register/services"
          index={sectionIndex++}
        >
          <View style={[styles.servicePill, { backgroundColor: colors.primarySoft, borderColor: colors.border }]}>
            <Ionicons name={serviceMeta.icon} size={16} color={colors.primary} />
            <Text style={[styles.servicePillText, { color: colors.dark }]}>{serviceMeta.label}</Text>
          </View>
        </ReviewSection>

        <ReviewSection
          icon="briefcase-outline"
          title="Business"
          editHref="/(provider)/register/business"
          index={sectionIndex++}
        >
          {businessRows.map((row, i) => (
            <Row key={row.label} label={row.label} value={row.value} last={i === businessRows.length - 1} />
          ))}
        </ReviewSection>

        {draft.location ? (
          <ReviewSection
            icon="location-outline"
            title="Location"
            onEdit={() =>
              router.push({ pathname: '/(provider)/location', params: { mode: 'onboarding' } } as never)
            }
            index={sectionIndex++}
          >
            {locationRows.map((row, i) => (
              <Row key={row.label} label={row.label} value={row.value} last={i === locationRows.length - 1} />
            ))}
          </ReviewSection>
        ) : null}

        {draft.transport ? (
          <ReviewSection
            icon="car-outline"
            title="Transporter"
            editHref="/(provider)/register/transport"
            index={sectionIndex++}
          >
            {transportRows.map((row, i) => (
              <Row
                key={row.label}
                label={row.label}
                value={row.value}
                last={i === transportRows.length - 1}
              />
            ))}
          </ReviewSection>
        ) : null}

        {primaryVehicle ? (
          <ReviewSection icon="bus-outline" title="Primary vehicle"
            editHref="/(provider)/vehicles/add?mode=onboarding" index={sectionIndex++}>
            <Row label="Vehicle name" value={primaryVehicle.name} />
            <Row label="Registration" value={primaryVehicle.registrationNumber} />
            <Row label="Passenger seats" value={String(primaryVehicle.totalSeats)} />
            <Row label="Amenities" value={primaryVehicle.amenities.join(', ') || 'None selected'} last />
          </ReviewSection>
        ) : null}

        {draft.hotel ? (
          <ReviewSection
            icon="bed-outline"
            title="Lodging"
            editHref="/(provider)/register/hotel"
            index={sectionIndex++}
          >
            {hotelRows.map((row, i) => (
              <Row key={row.label} label={row.label} value={row.value} last={i === hotelRows.length - 1} />
            ))}
          </ReviewSection>
        ) : null}

        {draft.tour ? (
          <ReviewSection
            icon="map-outline"
            title="Tour"
            editHref="/(provider)/register/tours"
            index={sectionIndex++}
          >
            {tourRows.map((row, i) => (
              <Row key={row.label} label={row.label} value={row.value} last={i === tourRows.length - 1} />
            ))}
          </ReviewSection>
        ) : null}

        {draft.restaurant ? (
          <ReviewSection
            icon="restaurant-outline"
            title="Restaurant"
            editHref="/(provider)/register/restaurant"
            index={sectionIndex++}
          >
            {restaurantRows.map((row, i) => (
              <Row
                key={row.label}
                label={row.label}
                value={row.value}
                last={i === restaurantRows.length - 1}
              />
            ))}
          </ReviewSection>
        ) : null}
      </ScrollView>

      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, Spacing.md),
            backgroundColor: colors.card,
            borderTopColor: colors.border,
            paddingHorizontal: horizontalPad,
          },
        ]}
      >
        <Text style={[styles.footerHint, { color: colors.muted }]}>
          Submitting sends your application for BANJARA review.
        </Text>
        <Button
          title="Submit Application"
          loading={loading}
          onPress={onSubmit}
          icon={<Ionicons name="send-outline" size={18} color={colors.white} />}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  heroWrap: { marginBottom: Spacing.xs },
  hero: {
    borderRadius: Radius['2xl'],
    padding: Spacing.lg,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.soft,
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    letterSpacing: -0.3,
  },
  heroSub: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 20,
    maxWidth: 420,
  },
  card: {
    borderRadius: Radius['2xl'],
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  cardHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  iconBubble: {
    width: 36,
    height: 36,
    borderRadius: Radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
    letterSpacing: -0.2,
  },
  editChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  editText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
  },
  cardBody: {
    gap: 0,
  },
  row: {
    paddingVertical: 10,
    gap: 3,
  },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 12,
    letterSpacing: 0.1,
  },
  value: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    lineHeight: 21,
  },
  servicePill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  servicePillText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
  },
  footer: {
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
    ...Shadows.soft,
  },
  footerHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    textAlign: 'center',
  },
});
