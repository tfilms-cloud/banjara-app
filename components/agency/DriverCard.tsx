import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import {
  usePresentationColors as useThemeColors,
  useTravelPresentation,
} from '@/components/ui/TravelDesignProvider';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { ProviderTransportSetup } from '@/types/provider';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type PublicDriver = Pick<
  ProviderTransportSetup,
  'driverName' | 'driverPhoto' | 'driverExperienceYears'
>;

export function DriverCard({ driver }: { driver?: PublicDriver }) {
  const colors = useThemeColors();
  const travel = useTravelPresentation();
  const [failedPhoto, setFailedPhoto] = useState<string>();
  const name = driver?.driverName?.trim();
  const photo = normalizeMediaUrl(driver?.driverPhoto);
  const yearsText = String(driver?.driverExperienceYears ?? '').trim();
  const years = yearsText ? Number(yearsText) : NaN;
  const hasExperience = Number.isFinite(years) && years >= 0;
  if (!name && !photo && !hasExperience) return null;

  return (
    <View style={[styles.section, travel && { marginTop: 0 }]}>
      <Text
        style={[styles.heading, { color: colors.dark }, travel && { fontSize: 18, lineHeight: 25 }]}
      >
        {travel ? 'Lead highway driver' : 'Your driver'}
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
          travel && { borderRadius: 32, padding: 16, gap: 12 },
        ]}
      >
        <View
          style={[
            styles.portrait,
            { backgroundColor: colors.primarySoft },
            travel && { width: 52, height: 52, borderRadius: 26 },
          ]}
        >
          {photo && failedPhoto !== photo ? (
            <Image
              source={{ uri: photo }}
              style={[styles.photo, travel && { width: 52, height: 52 }]}
              contentFit="cover"
              accessibilityLabel={name ? `Photo of ${name}` : 'Driver photo'}
              onError={() => setFailedPhoto(photo)}
            />
          ) : (
            <Avatar name={name ?? ''} size={travel ? 52 : 88} />
          )}
        </View>
        <View style={styles.details}>
          {!travel ? <Text style={[styles.role, { color: colors.primary }]}>Driver</Text> : null}
          <Text
            style={[
              styles.name,
              { color: colors.dark },
              travel && { fontSize: 15, lineHeight: 21 },
            ]}
          >
            {name || 'Name not provided'}
          </Text>
          {hasExperience ? (
            <View style={[styles.experience, travel && { marginTop: 0 }]}>
              <Ionicons name="ribbon-outline" size={17} color={colors.primary} />
              <Text style={[styles.caption, { color: colors.muted }]}>
                {years} {years === 1 ? 'year' : 'years'} of driving experience
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
    marginBottom: Spacing.md,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    padding: Spacing.xl,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    ...Shadows.premium,
  },
  portrait: {
    width: 88,
    height: 88,
    borderRadius: 44,
    overflow: 'hidden',
    flexShrink: 0,
  },
  photo: { width: 88, height: 88 },
  details: { flex: 1, minWidth: 0, gap: Spacing.xs },
  role: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 23,
    lineHeight: 32,
    writingDirection: 'auto',
  },
  experience: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  caption: { fontFamily: Fonts.body, fontSize: 12, lineHeight: 22, flex: 1 },
});
