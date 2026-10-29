import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationMap } from '@/components/location/LocationMap';
import { Header } from '@/components/ui/Header';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import { pushPath } from '@/utils/navigation';

/** Northern Pakistan demo anchors when listing coords are unknown */
const FALLBACK = { latitude: 36.3167, longitude: 74.65 };

export default function ExploreServiceMapScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    title?: string;
    subtitle?: string;
    lat?: string;
    lng?: string;
    category?: string;
    href?: string;
  }>();

  const title = String(params.title ?? 'On the map');
  const subtitle = String(params.subtitle ?? params.category ?? 'BANJARA service');
  const latitude = Number(params.lat) || FALLBACK.latitude;
  const longitude = Number(params.lng) || FALLBACK.longitude;
  const href = params.href ? String(params.href) : '';

  return (
    <View style={styles.container}>
      <Header title="On the map" showBack />
      <ScrollView
        contentContainerStyle={{
          paddingBottom: insets.bottom + 24,
          gap: Spacing.md,
        }}
      >
        <View style={styles.copy}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.sub}>{subtitle}</Text>
          <View style={styles.coordRow}>
            <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
            <Text style={styles.coords}>
              {latitude.toFixed(5)}, {longitude.toFixed(5)}
            </Text>
          </View>
        </View>
        <View style={styles.mapWrap}>
          <LocationMap
            latitude={latitude}
            longitude={longitude}
            onRegionSettled={() => undefined}
            height={420}
            interactive={false}
            allowFullscreen
            pinLabel={title}
            pinMode="center"
          />
        </View>
        {href ? (
          <Pressable
            onPress={() => pushPath(href)}
            style={styles.cta}
            accessibilityRole="button"
            accessibilityLabel="View listing details"
          >
            <Text style={styles.ctaText}>View listing & book</Text>
            <Ionicons name="arrow-forward" size={18} color={Colors.white} />
          </Pressable>
        ) : (
          <Text style={styles.hint}>
            Go back and open a listing to see photos, prices, and booking.
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  copy: { paddingHorizontal: Spacing.lg, gap: 6 },
  title: { ...Typography.h2, color: Colors.dark },
  sub: { ...Typography.caption, color: Colors.muted, lineHeight: 18 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  coords: { fontFamily: Fonts.bodySemiBold, fontSize: 13, color: Colors.primary },
  mapWrap: {
    marginHorizontal: Spacing.lg,
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  hint: {
    ...Typography.caption,
    color: Colors.muted,
    paddingHorizontal: Spacing.lg,
    lineHeight: 18,
  },
  cta: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: Radius.full,
  },
  ctaText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
