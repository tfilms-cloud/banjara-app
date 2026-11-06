import type { ScrollViewInstance } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useMemo, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DriverCard } from './DriverCard';
import { ContactCard } from './ContactCard';
import { ExpandableText } from './ExpandableText';
import { FleetPricingCard } from './FleetPricingCard';
import { ProviderGallery } from './ProviderGallery';
import { ServiceArea } from './ServiceArea';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { TravelDesignProvider } from '@/components/ui/TravelDesignProvider';
import { TravelIconAction, TravelSurface, type TravelIcon } from '@/components/ui/TravelPrimitives';
import {
  TripAmenities,
  TripDetailsHeader,
  TripReviewCard,
} from '@/components/trip/TripDetailsPresentation';
import { useHomeDesign } from '@/constants/homeDesign';
import { Fonts } from '@/constants/typography';
import type { Provider } from '@/types/provider';
import type { Agency, Review, TripWithDetails } from '@/types/trip';
import { agencyDepartures, agencyNetwork, agencyVehicle } from '@/utils/agencyPresentation';
import { groupServiceArea } from '@/utils/serviceArea';
import { tripFareGroups } from '@/utils/providerDetails';
import { formatCurrency } from '@/utils/formatCurrency';
import { formatDate } from '@/utils/formatDate';
import { formatTime } from '@/utils/formatTime';

type Props = {
  agency: Agency;
  provider: Provider | null;
  trips: TripWithDetails[];
  reviews: Review[];
  galleryImages: string[];
  loading: boolean;
  onRefresh: () => void;
  onBack: () => void;
  onProfile: () => void;
  onShare: () => void;
  onCall?: () => void;
  onMessage?: () => void;
  onTrip: (trip: TripWithDetails) => void;
};
export function TransportAgencyProfile(props: Props) {
  return (
    <TravelDesignProvider>
      <TransportAgencyContent {...props} />
    </TravelDesignProvider>
  );
}

export function AgencyProfileFrame(props: {
  children: ReactNode;
  onBack: () => void;
  onProfile: () => void;
}) {
  return (
    <TravelDesignProvider>
      <AgencyStateContent {...props} />
    </TravelDesignProvider>
  );
}
function AgencyStateContent({
  children,
  onBack,
  onProfile,
}: {
  children: ReactNode;
  onBack: () => void;
  onProfile: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <TripDetailsHeader title="Driver profile" onBack={onBack} onProfile={onProfile} />
      {children}
    </View>
  );
}
function TransportAgencyContent({
  agency,
  provider,
  trips,
  reviews,
  galleryImages,
  loading,
  onRefresh,
  onBack,
  onProfile,
  onShare,
  onCall,
  onMessage,
  onTrip,
}: Props) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const departuresY = useRef(0);
  const [details, setDetails] = useState(false);
  const [photos, setPhotos] = useState(false);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [failed, setFailed] = useState<Record<string, boolean>>({});
  const transport = provider?.transport;
  const drivingYears = Number(transport?.driverExperienceYears) || agency.yearsExperience || 0;
  const departures = useMemo(() => agencyDepartures(trips), [trips]);
  const network = useMemo(
    () => agencyNetwork(departures, transport?.operatingRoutes),
    [departures, transport?.operatingRoutes],
  );
  const vehicle = useMemo(() => agencyVehicle(transport, trips), [transport, trips]);
  const vehiclePhotos = vehicle.photos.filter((uri) => !failed[uri]);
  const activePhoto = vehiclePhotos[Math.min(photoIndex, Math.max(vehiclePhotos.length - 1, 0))];
  const fareGroups = tripFareGroups(departures);
  const hubs = groupServiceArea(
    network,
    transport?.pickupLocations ?? [],
    transport?.dropoffLocations ?? [],
  );
  const model =
    vehicle.facts.find((fact) => fact.label === 'Vehicle model')?.value ||
    vehicle.kind ||
    'Vehicle information';
  const plate = vehicle.facts.find((fact) => fact.label === 'Registration plate')?.value;
  const extraFacts = vehicle.facts.filter(
    (fact) => !['Vehicle model', 'Registration plate'].includes(fact.label),
  );
  const reviewCount = agency.reviewCount || reviews.length;
  const seeTrips = () =>
    scroll.current?.scrollTo({ y: Math.max(0, departuresY.current - 12), animated: true });
  const about = agency.description?.trim() || transport?.description?.trim();

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <TripDetailsHeader
        title="Driver profile"
        shareLabel="Share driver"
        onBack={onBack}
        onShare={onShare}
        onProfile={onProfile}
        onMore={() => setDetails(true)}
      />
      <ScrollView
        ref={scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={onRefresh}
            tintColor={theme.primary}
            colors={[theme.primary]}
          />
        }
        contentContainerStyle={{ padding: 16, gap: 24, paddingBottom: insets.bottom + 150 }}
      >
        <AgencyPanel>
          <View style={s.identity}>
            {transport?.driverPhoto || agency.logo ? (
              <Avatar uri={transport?.driverPhoto || agency.logo} name={agency.name} size={60} />
            ) : (
              <View style={[s.agencyIcon, { backgroundColor: theme.soft }]}>
                <Ionicons name="person-outline" size={29} color={theme.primary} />
              </View>
            )}
            <View style={s.flex}>
              <View style={s.inline}>
                <Text style={[s.title, { color: theme.text }]}>{agency.name}</Text>
                {agency.verified ? (
                  <Text style={[s.verified, { color: theme.primary, backgroundColor: theme.soft }]}>
                    ● Verified driver
                  </Text>
                ) : null}
              </View>
              <Text style={[s.body, { color: theme.muted }]}>
                Local driver{agency.city ? ` · ${agency.city}` : ''}
              </Text>
              {drivingYears ? (
                <Text style={[s.small, { color: theme.primary }]}>
                  {drivingYears} {drivingYears === 1 ? 'year' : 'years'} of driving experience
                </Text>
              ) : null}
            </View>
          </View>
          <View style={s.stats}>
            <AgencyStat
              icon="star"
              value={agency.rating > 0 ? agency.rating.toFixed(1) : 'New'}
              label={reviewCount ? `${reviewCount} reviews` : 'No reviews yet'}
            />
            <AgencyStat
              icon="people-outline"
              value={String(departures.length)}
              label="Departures"
            />
            <AgencyStat icon="navigate-outline" value={String(network.length)} label="Routes" />
          </View>
          <View style={s.actions}>
            <Button
              title="Call driver"
              variant="secondary"
              disabled={!onCall}
              onPress={onCall}
              fullWidth={false}
              style={s.action}
              icon={<Ionicons name="call-outline" size={17} color={theme.primary} />}
            />
            <Button
              title="Message"
              disabled={!onMessage}
              onPress={onMessage}
              fullWidth={false}
              style={s.action}
              icon={<Ionicons name="chatbox-outline" size={17} color={theme.background} />}
            />
          </View>
        </AgencyPanel>

        <View style={s.section}>
          <AgencySectionTitle
            title="Vehicle"
            accessory={vehicle.fleetCount ? `${vehicle.fleetCount} in fleet` : undefined}
          />
          <AgencyPanel>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="View vehicle photos"
              disabled={!vehiclePhotos.length}
              onPress={() => setPhotos(true)}
              style={[s.vehicleHero, { backgroundColor: theme.soft }]}
            >
              {activePhoto ? (
                <>
                  <Image
                    source={{ uri: activePhoto }}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                    onError={() => setFailed((current) => ({ ...current, [activePhoto]: true }))}
                    accessibilityLabel={model}
                  />
                  <LinearGradient
                    colors={['transparent', 'rgba(8,28,27,0.8)']}
                    style={StyleSheet.absoluteFill}
                  />
                  <View style={s.photoCount}>
                    <Ionicons name="camera-outline" size={13} color="rgb(255,255,255)" />
                    <Text style={s.photoLabel}>
                      {Math.min(photoIndex + 1, vehiclePhotos.length)}/{vehiclePhotos.length}
                    </Text>
                  </View>
                  <Text style={s.heroCaption} numberOfLines={2}>
                    {model}
                  </Text>
                </>
              ) : (
                <View style={s.noPhoto}>
                  <Ionicons name="bus-outline" size={42} color={theme.primary} />
                  <Text style={[s.small, { color: theme.primary }]}>
                    No vehicle photos uploaded yet
                  </Text>
                </View>
              )}
            </Pressable>
            {vehiclePhotos.length > 1 ? (
              <View style={s.thumbnails}>
                {vehiclePhotos.slice(0, 3).map((uri, index) => (
                  <Pressable
                    key={uri}
                    accessibilityRole="button"
                    accessibilityLabel={`Vehicle photo ${index + 1}`}
                    accessibilityState={{ selected: activePhoto === uri }}
                    onPress={() => setPhotoIndex(index)}
                    style={[
                      s.thumb,
                      { borderColor: activePhoto === uri ? theme.primary : theme.border },
                    ]}
                  >
                    <Image
                      source={{ uri }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      onError={() => setFailed((current) => ({ ...current, [uri]: true }))}
                    />
                  </Pressable>
                ))}
                <Pressable
                  onPress={() => setPhotos(true)}
                  accessibilityRole="button"
                  accessibilityLabel="All photos"
                  style={[s.morePhotos, { backgroundColor: theme.field }]}
                >
                  <Ionicons name="images-outline" size={20} color={theme.muted} />
                  <Text style={[s.tiny, { color: theme.muted }]}>
                    {vehiclePhotos.length > 3 ? `+${vehiclePhotos.length - 3} more` : 'All photos'}
                  </Text>
                </Pressable>
              </View>
            ) : null}
            <View style={{ gap: 4 }}>
              <Text style={[s.title, { color: theme.text }]}>{model}</Text>
              {plate ? (
                <Text style={[s.body, { color: theme.muted }]}>Registration: {plate}</Text>
              ) : null}
              {extraFacts.map((fact) => (
                <Text key={fact.label} style={[s.small, { color: theme.muted }]}>
                  {fact.label}: {fact.value}
                </Text>
              ))}
            </View>
            {vehicle.amenities.length ? <TripAmenities amenities={vehicle.amenities} /> : null}
            <Text style={[s.tiny, { color: theme.muted }]}>
              Check your selected trip for its assigned vehicle and amenities.
            </Text>
          </AgencyPanel>
        </View>

        <DriverCard driver={transport} />

        {hubs.some((hub) => hub.pickups.length || hub.dropoffs.length) ? (
          <View style={s.section}>
            <AgencySectionTitle title="Terminal Hubs" />
            <AgencyPanel>
              {hubs.map((hub) => (
                <View key={hub.key} style={{ gap: 14 }}>
                  {hub.pickups.length ? (
                    <AgencyHub
                      icon="location-outline"
                      title={hub.from ? `${hub.from} departure` : 'Pickup locations'}
                      places={hub.pickups}
                    />
                  ) : null}
                  {hub.dropoffs.length ? (
                    <AgencyHub
                      icon="home-outline"
                      title={hub.to ? `${hub.to} arrival` : 'Drop-off locations'}
                      places={hub.dropoffs}
                    />
                  ) : null}
                </View>
              ))}
            </AgencyPanel>
          </View>
        ) : null}

        {network.length ? (
          <View style={s.section}>
            <AgencySectionTitle
              title="Service Network"
              accessory={`${network.length} ${network.length === 1 ? 'route' : 'routes'}`}
            />
            {network.map((route) => (
              <AgencyPanel key={route}>
                <Text style={[s.routeTitle, { color: theme.text }]}>{route}</Text>
                <Text style={[s.small, { color: theme.muted }]}>
                  Contact the driver for route schedules and pickup details.
                </Text>
              </AgencyPanel>
            ))}
          </View>
        ) : null}

        <View
          style={s.section}
          onLayout={(event) => {
            departuresY.current = event.nativeEvent.layout.y;
          }}
        >
          <AgencySectionTitle
            title="Upcoming Departures"
            action="View timetable"
            onAction={seeTrips}
          />
          {departures.length ? (
            departures.map((trip) => (
              <AgencyDepartureCard key={trip.id} trip={trip} onPress={() => onTrip(trip)} />
            ))
          ) : (
            <EmptyState
              title="No upcoming departures"
              message="Check back later or message the driver about their next ride."
              icon="bus-outline"
            />
          )}
        </View>
      </ScrollView>

      {departures.length ? (
        <View
          style={[
            s.footer,
            {
              backgroundColor: theme.surface,
              borderColor: theme.border,
              paddingBottom: insets.bottom + 12,
            },
          ]}
        >
          <View style={s.flex}>
            <Text style={[s.small, { color: theme.muted }]}>
              {departures.length} upcoming {departures.length === 1 ? 'departure' : 'departures'}
            </Text>
            <Text style={[s.footerPrice, { color: theme.text }]}>
              {fareGroups.length === 1
                ? `From ${formatCurrency(fareGroups[0].amount, fareGroups[0].currency)} / ${fareGroups[0].unit}`
                : 'View fares by trip'}
            </Text>
          </View>
          <Button
            title="See trips →"
            fullWidth={false}
            onPress={seeTrips}
            style={{ borderRadius: 28, minWidth: 120 }}
          />
        </View>
      ) : null}

      <AgencyModal visible={photos} title="Photos" onClose={() => setPhotos(false)}>
        <ProviderGallery images={galleryImages.length ? galleryImages : vehiclePhotos} />
      </AgencyModal>
      <AgencyModal visible={details} title="Driver details" onClose={() => setDetails(false)}>
        {about ? (
          <AgencyPanel>
            <Text style={[s.title, { color: theme.text }]}>About {agency.name}</Text>
            <ExpandableText text={about} />
          </AgencyPanel>
        ) : null}
        <FleetPricingCard
          transport={transport}
          trips={trips}
          onSeeTrips={() => {
            setDetails(false);
            seeTrips();
          }}
        />
        <ServiceArea
          cities={(transport?.operatingCities ?? []).filter(
            (city) => !/^[-\d.]+$/.test(city.trim()),
          )}
          routes={network}
          pickups={transport?.pickupLocations ?? []}
          dropoffs={transport?.dropoffLocations ?? []}
          previewTrip={trips.find((trip) => trip.originCoordinates && trip.destinationCoordinates)}
        />
        <ContactCard agency={agency} provider={provider} />
        <AgencySectionTitle title="Reviews" />
        {reviews.length ? (
          reviews.map((review) => <TripReviewCard key={review.id} review={review} />)
        ) : (
          <Text style={[s.body, { color: theme.muted }]}>
            Travelers have not reviewed this driver yet.
          </Text>
        )}
      </AgencyModal>
    </View>
  );
}

export function AgencyDepartureCard({
  trip,
  onPress,
}: {
  trip: TripWithDetails;
  onPress: () => void;
}) {
  const theme = useHomeDesign();
  const privateVehicle = trip.bookingMode === 'vehicle';
  return (
    <AgencyPanel>
      <View style={s.spread}>
        <Text
          style={[
            s.seatBadge,
            {
              color: trip.availableSeats <= 4 ? theme.coral : theme.primary,
              backgroundColor: trip.availableSeats <= 4 ? theme.coralSoft : theme.soft,
            },
          ]}
        >
          {trip.availableSeats} {trip.availableSeats === 1 ? 'seat' : 'seats'} left
        </Text>
        <Text style={[s.tiny, s.shrink, { color: theme.muted }]} numberOfLines={2}>
          {trip.vehicleName}
        </Text>
      </View>
      <View style={s.spread}>
        <View style={s.flex}>
          <Text style={[s.title, { color: theme.text }]}>
            {trip.from} → {trip.to}
          </Text>
          <Text style={[s.body, { color: theme.muted }]}>
            {formatDate(trip.date, false)} · {formatTime(trip.departureTime)} departure
          </Text>
        </View>
        <View style={s.price}>
          <Text style={[s.title, { color: theme.primary }]}>
            {formatCurrency(trip.price, trip.currency)}
          </Text>
          <Text style={[s.tiny, { color: theme.muted }]}>
            per {privateVehicle ? 'vehicle' : 'seat'}
          </Text>
        </View>
      </View>
      <Button
        title={privateVehicle ? 'Reserve this vehicle →' : 'Reserve this seat →'}
        onPress={onPress}
        style={{ borderRadius: 28 }}
      />
    </AgencyPanel>
  );
}
function AgencyStat({ icon, value, label }: { icon: TravelIcon; value: string; label: string }) {
  const theme = useHomeDesign();
  return (
    <View style={[s.stat, { backgroundColor: theme.field }]}>
      <View style={s.inline}>
        <Ionicons name={icon} size={14} color={theme.primary} />
        <Text style={[s.statValue, { color: theme.text }]}>{value}</Text>
      </View>
      <Text style={[s.tiny, { color: theme.muted, textAlign: 'center' }]}>{label}</Text>
    </View>
  );
}
function AgencyHub({ icon, title, places }: { icon: TravelIcon; title: string; places: string[] }) {
  const theme = useHomeDesign();
  return (
    <View style={s.identity}>
      <View style={[s.hubIcon, { backgroundColor: theme.field }]}>
        <Ionicons name={icon} size={18} color={theme.primary} />
      </View>
      <View style={s.flex}>
        <Text style={[s.routeTitle, { color: theme.text }]}>{title}</Text>
        {places.map((place) => (
          <Text key={place} style={[s.body, { color: theme.muted }]}>
            {place}
          </Text>
        ))}
      </View>
    </View>
  );
}
function AgencyPanel({ children }: { children: ReactNode }) {
  const theme = useHomeDesign();
  return <TravelSurface style={[s.panel, { borderColor: theme.border }]}>{children}</TravelSurface>;
}
function AgencySectionTitle({
  title,
  accessory,
  action,
  onAction,
}: {
  title: string;
  accessory?: string;
  action?: string;
  onAction?: () => void;
}) {
  const theme = useHomeDesign();
  return (
    <View style={s.spread}>
      <Text accessibilityRole="header" style={[s.sectionTitle, s.flex, { color: theme.text }]}>
        {title}
      </Text>
      {accessory ? (
        <Text style={[s.tiny, s.shrink, { color: theme.muted }]}>{accessory}</Text>
      ) : null}
      {action && onAction ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={action}
          onPress={onAction}
          style={s.sectionAction}
        >
          <Text style={[s.small, { color: theme.primary }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
function AgencyModal({
  visible,
  title,
  onClose,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const theme = useHomeDesign();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={s.modalRoot}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title.toLowerCase()}`}
        />
        <View
          accessibilityViewIsModal
          style={[
            s.sheet,
            { backgroundColor: theme.background, paddingBottom: insets.bottom + 16 },
          ]}
        >
          <View style={s.spread}>
            <Text accessibilityRole="header" style={[s.sectionTitle, { color: theme.text }]}>
              {title}
            </Text>
            <TravelIconAction
              icon="close"
              label={`Close ${title.toLowerCase()}`}
              onPress={onClose}
            />
          </View>
          <ScrollView
            contentContainerStyle={{ gap: 16, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
const s = StyleSheet.create({
  root: { flex: 1 },
  flex: { flex: 1, minWidth: 0 },
  shrink: { flexShrink: 1 },
  panel: { borderRadius: 32, padding: 16, borderWidth: 1, gap: 12 },
  section: { gap: 12 },
  identity: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  inline: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 5 },
  spread: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 },
  title: { fontFamily: Fonts.displayBold, fontSize: 15, lineHeight: 21 },
  body: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 19 },
  small: { fontFamily: Fonts.bodyMedium, fontSize: 11, lineHeight: 17 },
  tiny: { fontFamily: Fonts.body, fontSize: 10, lineHeight: 16 },
  verified: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 9,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 12,
  },
  agencyIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stats: { flexDirection: 'row', gap: 8 },
  stat: {
    flex: 1,
    borderRadius: 28,
    paddingVertical: 12,
    paddingHorizontal: 5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  statValue: { fontFamily: Fonts.displayBold, fontSize: 16, lineHeight: 21 },
  actions: { flexDirection: 'row', gap: 8 },
  action: { flex: 1, borderRadius: 26 },
  sectionTitle: { fontFamily: Fonts.displayBold, fontSize: 18, lineHeight: 25 },
  sectionAction: { minHeight: 44, justifyContent: 'center' },
  vehicleHero: { height: 200, borderRadius: 28, overflow: 'hidden' },
  noPhoto: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },
  photoCount: {
    position: 'absolute',
    right: 12,
    top: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.4)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 16,
  },
  photoLabel: { fontFamily: Fonts.bodyMedium, fontSize: 10, color: 'rgb(255,255,255)' },
  heroCaption: {
    position: 'absolute',
    left: 14,
    right: 14,
    bottom: 14,
    fontFamily: Fonts.bodyMedium,
    fontSize: 10,
    color: 'rgb(255,255,255)',
  },
  thumbnails: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  thumb: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, overflow: 'hidden' },
  morePhotos: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  hubIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  routeTitle: { fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 20 },
  seatBadge: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 10,
    lineHeight: 16,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 14,
  },
  price: { alignItems: 'flex-end', flexShrink: 1, maxWidth: '42%' },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  footerPrice: { fontFamily: Fonts.bodyBold, fontSize: 12, lineHeight: 19 },
  modalRoot: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    height: '85%',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },
});
