import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { DistanceSlider } from '@/components/explore/DistanceSlider';
import { InAppWebMap } from '@/components/map/InAppWebMap';
import { useNativeMaps } from '@/components/map/nativeMaps';
import { Header } from '@/components/ui/Header';
import { useExploreDesign } from '@/constants/exploreDesign';
import { Fonts } from '@/constants/typography';
import {
  NEAR_DEFAULT_KM,
  NEAR_MAX_KM,
  distanceLabel,
  fetchNearbyRides,
  type NearbyRide,
} from '@/utils/nearMe';
import { pushPath } from '@/utils/navigation';

const MAP_HEIGHT = 300;

/** Rides whose pickup is within 10 km of the visitor; widen to 20 km when nothing is close. */
export default function NearbyRidesScreen() {
  const theme = useExploreDesign();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ lat?: string; lng?: string; radius?: string }>();
  const latitude = Number(params.lat);
  const longitude = Number(params.lng);
  const hasPosition = Number.isFinite(latitude) && Number.isFinite(longitude);

  const [radiusKm, setRadiusKm] = useState(() => {
    const r = Number(params.radius);
    return Number.isFinite(r) && r > 0 ? Math.min(NEAR_MAX_KM, Math.max(1, Math.round(r))) : NEAR_DEFAULT_KM;
  });
  const [rides, setRides] = useState<NearbyRide[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rangeOpen, setRangeOpen] = useState(false);
  const [draftKm, setDraftKm] = useState(radiusKm);

  const load = useCallback(async () => {
    if (!hasPosition) return;
    setLoading(true);
    setError(null);
    try {
      setRides(await fetchNearbyRides(latitude, longitude, radiusKm));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Rides could not be loaded.');
    } finally {
      setLoading(false);
    }
  }, [hasPosition, latitude, longitude, radiusKm]);

  useEffect(() => {
    void load();
  }, [load]);

  const empty = !loading && !error && rides.length === 0;
  const atMax = radiusKm >= NEAR_MAX_KM;

  // When nothing is close, suggest a wider circle straight away.
  useEffect(() => {
    if (empty) setDraftKm((km) => (km <= radiusKm && radiusKm < NEAR_MAX_KM ? Math.min(NEAR_MAX_KM, radiusKm + 5) : km));
  }, [empty, radiusKm]);

  const applyRadius = (km: number) => {
    setRangeOpen(false);
    setSelectedId(null);
    setRadiusKm(km);
    setDraftKm(km);
  };
  const browseAll = () => pushPath('/(customer)/(tabs)/search?service=transport');
  const openRide = (ride: NearbyRide) =>
    pushPath(
      ride.target.providerId
        ? `/(customer)/agency/${ride.target.providerId}`
        : `/(customer)/trip/${ride.target.id}`,
    );

  const markers = useMemo(
    () =>
      rides
        .filter((ride) => ride.location)
        .map((ride) => ({
          id: ride.id,
          title: ride.title,
          subtitle: [distanceLabel(ride.distanceKm) && `${distanceLabel(ride.distanceKm)} away`, priceText(ride)]
            .filter(Boolean)
            .join(' · '),
          coordinate: { latitude: ride.location!.lat, longitude: ride.location!.lng },
          selected: ride.id === selectedId,
        })),
    [rides, selectedId],
  );

  if (!hasPosition) {
    return (
      <View style={[s.root, { backgroundColor: theme.background }]}>
        <Header title="Rides near you" showBack />
        <View style={s.centerBox}>
          <Text style={[s.cardTitle, { color: theme.text }]}>We don’t have your location</Text>
          <Pressable onPress={browseAll} style={[s.primary, { backgroundColor: theme.action }]}>
            <Text style={s.primaryText}>Browse all rides</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const rangeCard = (
    <View style={[s.rangeCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <LinearGradient colors={['#1FC77A', '#0F9B98']} style={s.rangeIcon}>
        <MaterialCommunityIcons name={empty ? 'radar' : 'map-marker-radius'} size={24} color="#fff" />
      </LinearGradient>
      <Text style={[s.cardTitle, { color: theme.text }]} accessibilityRole="header">
        {empty ? `No rides within ${radiusKm} km of you` : 'How far will you go to a pickup?'}
      </Text>
      <Text style={[s.cardText, { color: theme.muted }]}>
        {empty
          ? atMax
            ? 'There are no pickups within 20 km right now. You can still browse every ride across the north.'
            : 'Widen your search to find pickups a little further away.'
          : 'We show rides whose pickup point is within this distance of you.'}
      </Text>
      {!(empty && atMax) ? (
        <>
          <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
            <DistanceSlider
              value={draftKm}
              min={NEAR_DEFAULT_KM}
              max={NEAR_MAX_KM}
              onChange={setDraftKm}
              color={theme.action}
              track={theme.field}
              mutedColor={theme.muted}
            />
          </View>
          <Pressable
            onPress={() => applyRadius(draftKm)}
            disabled={draftKm === radiusKm}
            style={[s.primary, { backgroundColor: theme.action, opacity: draftKm === radiusKm ? 0.5 : 1 }]}
            accessibilityRole="button"
            accessibilityState={{ disabled: draftKm === radiusKm }}
          >
            <Text style={s.primaryText}>Show rides within {draftKm} km</Text>
          </Pressable>
        </>
      ) : null}
      <Pressable
        onPress={browseAll}
        style={empty && atMax ? [s.primary, { backgroundColor: theme.action }] : s.linkButton}
        accessibilityRole="button"
      >
        <Text style={empty && atMax ? s.primaryText : [s.linkText, { color: theme.primary }]}>
          {empty && atMax ? 'Browse all rides' : 'Browse all rides instead'}
        </Text>
      </Pressable>
      {rangeOpen && !empty ? (
        <Pressable onPress={() => setRangeOpen(false)} style={s.linkButton} accessibilityRole="button">
          <Text style={[s.linkText, { color: theme.muted }]}>Close</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={[s.root, { backgroundColor: theme.background }]}>
      <Header
        title="Rides near you"
        subtitle={`Within ${radiusKm} km · nearest pickup first`}
        showBack
      />
      <FlatList
        data={empty || loading || error || rangeOpen ? [] : rides}
        keyExtractor={(ride) => ride.id}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={
          <>
            <View style={[s.mapWrap, { borderColor: theme.border }]}>
              <NearbyMap
                latitude={latitude}
                longitude={longitude}
                radiusKm={radiusKm}
                rides={rides}
                markers={markers}
                onSelect={(id) => setSelectedId(id)}
              />
            </View>

            {!loading && !error && !empty ? (
              <View style={s.summaryRow}>
                <Text style={[s.summary, { color: theme.text }]}>
                  {rides.length} {rides.length === 1 ? 'ride' : 'rides'} within {radiusKm} km
                </Text>
                <Pressable
                  onPress={() => setRangeOpen((open) => !open)}
                  style={[s.changeChip, { backgroundColor: theme.soft }]}
                  accessibilityRole="button"
                  accessibilityState={{ expanded: rangeOpen }}
                  accessibilityLabel={`Search distance ${radiusKm} kilometres. Change`}
                >
                  <Ionicons name="locate" size={14} color={theme.primary} />
                  <Text style={[s.changeText, { color: theme.primary }]}>{radiusKm} km · Change</Text>
                </Pressable>
              </View>
            ) : null}

            {loading ? (
              <View style={s.centerBox} accessibilityLiveRegion="polite">
                <ActivityIndicator color={theme.primary} />
                <Text style={[s.cardText, { color: theme.muted }]}>Finding rides near you…</Text>
              </View>
            ) : error ? (
              <View style={s.centerBox}>
                <Text style={[s.cardTitle, { color: theme.text }]}>Rides couldn’t load</Text>
                <Text style={[s.cardText, { color: theme.muted }]}>{error}</Text>
                <Pressable onPress={() => void load()} style={[s.primary, { backgroundColor: theme.action }]}>
                  <Text style={s.primaryText}>Try again</Text>
                </Pressable>
              </View>
            ) : empty || rangeOpen ? (
              rangeCard
            ) : null}
          </>
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => openRide(item)}
            onPressIn={() => setSelectedId(item.id)}
            style={({ pressed }) => [
              s.ride,
              {
                backgroundColor: theme.surface,
                borderColor: item.id === selectedId ? theme.primary : theme.border,
                opacity: pressed ? 0.9 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`${item.title}, ${item.subtitle}, ${distanceLabel(item.distanceKm) ?? ''} away, ${priceText(item) ?? ''}`}
          >
            {item.image ? (
              <Image source={{ uri: item.image }} style={s.thumb} contentFit="cover" />
            ) : (
              <View style={[s.thumb, s.thumbEmpty, { backgroundColor: theme.field }]}>
                <MaterialCommunityIcons name="car" size={28} color={theme.muted} />
              </View>
            )}
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={[s.rideTitle, { color: theme.text }]} numberOfLines={1}>
                {item.title}
              </Text>
              <Text style={[s.rideSub, { color: theme.muted }]} numberOfLines={1}>
                {item.subtitle}
                {item.verified ? ' · Verified' : ''}
              </Text>
              <View style={s.distanceRow}>
                <Ionicons name="location" size={13} color={theme.primary} />
                <Text style={[s.distance, { color: theme.primary }]} numberOfLines={1}>
                  {distanceLabel(item.distanceKm)} away
                  <Text style={{ color: theme.muted, fontFamily: Fonts.body }}>
                    {item.location?.address ? ` · ${item.location.address}` : ''}
                  </Text>
                </Text>
              </View>
              <View style={s.rideFoot}>
                <Text style={[s.price, { color: theme.text }]}>{priceText(item) ?? 'Ask for price'}</Text>
                <View style={[s.view, { backgroundColor: theme.action }]}>
                  <Text style={s.viewText}>View</Text>
                  <Ionicons name="arrow-forward" size={14} color="#fff" />
                </View>
              </View>
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function priceText(ride: NearbyRide) {
  if (!ride.price || ride.price <= 0) return null;
  const unit = (ride.priceUnit ?? '').replace(/^per\s+/i, '');
  return `PKR ${ride.price.toLocaleString('en-PK')}${unit ? ` / ${unit === 'vehicle' ? 'whole vehicle' : unit}` : ''}`;
}

/** Native map when the build has it; otherwise the in-app web map (Expo Go, web). */
function NearbyMap({
  latitude,
  longitude,
  radiusKm,
  rides,
  markers,
  onSelect,
}: {
  latitude: number;
  longitude: number;
  radiusKm: number;
  rides: NearbyRide[];
  markers: Parameters<typeof InAppWebMap>[0]['markers'];
  onSelect: (id: string) => void;
}) {
  const { maps, ready } = useNativeMaps();
  if (!ready) return <View style={{ height: MAP_HEIGHT }} />;
  if (!maps || Platform.OS === 'web') {
    return (
      <InAppWebMap
        markers={markers}
        userLocation={{ latitude, longitude }}
        searchRadiusKm={radiusKm}
        height={MAP_HEIGHT}
        onSelectMarker={onSelect}
      />
    );
  }
  const MapView = maps.default;
  const Marker = maps.Marker;
  const Circle = maps.Circle;
  // Frame the whole search circle with a little margin.
  const latitudeDelta = (radiusKm / 111.32) * 2.4;
  const longitudeDelta = latitudeDelta / Math.max(0.2, Math.cos((latitude * Math.PI) / 180));
  return (
    <MapView
      key={radiusKm}
      style={{ height: MAP_HEIGHT }}
      provider={Platform.OS === 'android' ? maps.PROVIDER_GOOGLE : undefined}
      initialRegion={{ latitude, longitude, latitudeDelta, longitudeDelta }}
      showsUserLocation
      showsMyLocationButton={false}
      toolbarEnabled={false}
    >
      {Circle ? (
        <Circle
          center={{ latitude, longitude }}
          radius={radiusKm * 1000}
          strokeColor="#0F9B98"
          strokeWidth={2}
          fillColor="rgba(22,179,100,0.08)"
          lineDashPattern={[6, 8]}
        />
      ) : null}
      {rides
        .filter((ride) => ride.location)
        .map((ride) => (
          <Marker
            key={ride.id}
            coordinate={{ latitude: ride.location!.lat, longitude: ride.location!.lng }}
            title={ride.title}
            description={[distanceLabel(ride.distanceKm) && `${distanceLabel(ride.distanceKm)} away`, priceText(ride)]
              .filter(Boolean)
              .join(' · ')}
            pinColor="#16B364"
            onPress={() => onSelect(ride.id)}
          />
        ))}
    </MapView>
  );
}

const s = StyleSheet.create({
  root: { flex: 1 },
  mapWrap: {
    marginHorizontal: 16,
    marginTop: 8,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  summary: { fontFamily: Fonts.display, fontSize: 17 },
  changeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 40,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  changeText: { fontFamily: Fonts.bodySemiBold, fontSize: 13 },
  centerBox: { alignItems: 'center', gap: 10, padding: 32 },
  rangeCard: {
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 22,
    borderWidth: 1,
  },
  rangeIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardTitle: { fontFamily: Fonts.displayBold, fontSize: 18, textAlign: 'center' },
  cardText: { fontFamily: Fonts.body, fontSize: 14, lineHeight: 20, textAlign: 'center', marginTop: 6 },
  primary: {
    alignSelf: 'stretch',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
    borderRadius: 999,
    marginTop: 14,
    paddingHorizontal: 20,
  },
  primaryText: { fontFamily: Fonts.bodySemiBold, fontSize: 15, color: '#fff' },
  linkButton: { minHeight: 44, justifyContent: 'center', marginTop: 4, paddingHorizontal: 12 },
  linkText: { fontFamily: Fonts.bodySemiBold, fontSize: 14, textDecorationLine: 'underline' },
  ride: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginTop: 10,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  thumb: { width: 92, height: 92, borderRadius: 14 },
  thumbEmpty: { alignItems: 'center', justifyContent: 'center' },
  rideTitle: { fontFamily: Fonts.display, fontSize: 16 },
  rideSub: { fontFamily: Fonts.body, fontSize: 13, marginTop: 1 },
  distanceRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  distance: { flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 12 },
  rideFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  price: { fontFamily: Fonts.bodyBold, fontSize: 14, flexShrink: 1 },
  view: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    minHeight: 36,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  viewText: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: '#fff' },
});
