import { Ionicons } from '@expo/vector-icons';
import {
  Alert,
  Linking,
  TouchableOpacity,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Shadows, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { Agency } from '@/types/trip';
import type { Provider } from '@/types/provider';
import { publicWebsite } from '@/utils/providerDetails';

async function openContact(url: string, action: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert(
      'Could not open ' + action,
      'Please try again or use the contact details shown here.',
    );
  }
}

function ContactMethod({
  icon,
  label,
  value,
  action,
  url,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  action: string;
  url: string;
}) {
  const colors = useThemeColors();
  return (
    <TouchableOpacity
      onPress={() => void openContact(url, label.toLowerCase())}
      accessibilityRole="link"
      accessibilityLabel={`${action}: ${value}`}
      activeOpacity={0.7}
      style={[
        styles.method,
        {
          borderColor: colors.border,
          backgroundColor: colors.surfaceSecondary,
        },
      ]}
    >
      <View style={[styles.icon, { backgroundColor: colors.surfaceSecondary }]}>
        <Ionicons name={icon} size={19} color={colors.primary} />
      </View>
      <View style={styles.methodCopy}>
        <Text style={[styles.label, { color: colors.muted }]}>{label}</Text>
        <Text style={[styles.actionText, { color: colors.primary }]}>
          {action} <Ionicons name="arrow-forward" size={12} />
        </Text>
      </View>
    </TouchableOpacity>
  );
}

export function ContactCard({
  agency,
  provider,
}: {
  agency: Agency | null;
  provider: Provider | null;
}) {
  const colors = useThemeColors();
  const address =
    provider?.structuredAddress?.formattedAddress?.trim() ||
    agency?.address?.trim();
  const city = agency?.city?.trim();
  const phone = agency?.phone?.trim();
  const email = agency?.email?.trim();
  const website = publicWebsite(agency?.website);
  const latitude = provider?.latitude;
  const longitude = provider?.longitude;
  const hasCoordinates =
    typeof latitude === 'number' &&
    typeof longitude === 'number' &&
    Number.isFinite(latitude) &&
    Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 &&
    Math.abs(longitude) <= 180;
  const mapQuery = hasCoordinates
    ? `${latitude},${longitude}`
    : address || city;
  if (!address && !city && !phone && !email && !website && !hasCoordinates)
    return null;
  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.dark }]}>Get in touch</Text>
      <Text style={[styles.description, { color: colors.muted }]}>
        Ask about your journey or find the provider’s business location.
      </Text>
      <View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
      >
        {mapQuery ? (
          <View style={styles.location}>
            <View style={styles.locationHeading}>
              <View
                style={[styles.icon, { backgroundColor: colors.primarySoft }]}
              >
                <Ionicons
                  name="business-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.label, { color: colors.muted }]}>
                  BUSINESS LOCATION
                </Text>
                <Text style={[styles.locationTitle, { color: colors.dark }]}>
                  {city || agency?.name || 'Provider location'}
                </Text>
              </View>
            </View>
            {address ? (
              <Text selectable style={[styles.address, { color: colors.dark }]}>
                {address}
              </Text>
            ) : null}
            <TouchableOpacity
              onPress={() =>
                void openContact(
                  'https://www.google.com/maps/search/?api=1&query=' +
                    encodeURIComponent(mapQuery),
                  'maps',
                )
              }
              accessibilityRole="link"
              accessibilityLabel="View business location on map"
              activeOpacity={0.7}
              style={[
                styles.mapButton,
                {
                  backgroundColor: colors.primarySoft,
                },
              ]}
            >
              <Ionicons name="map-outline" size={17} color={colors.primary} />
              <Text style={[styles.mapText, { color: colors.primary }]}>
                View business on map
              </Text>
              <Ionicons name="arrow-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
            <Text style={[styles.hint, { color: colors.muted }]}>
              Your trip’s pickup point may be different from this address.
            </Text>
          </View>
        ) : null}
        <View style={[styles.methods, { borderColor: colors.border }]}>
          {phone ? (
            <ContactMethod
              icon="call-outline"
              label="Phone"
              value={phone}
              action="Call provider"
              url={'tel:' + phone.replace(/[^\d+]/g, '')}
            />
          ) : null}
          {email ? (
            <ContactMethod
              icon="mail-outline"
              label="Email"
              value={email}
              action="Write an email"
              url={'mailto:' + encodeURIComponent(email)}
            />
          ) : null}
          {website ? (
          <ContactMethod
            icon="globe-outline"
            label="Website"
            value={website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
            action="Open website"
            url={website}
          />
        ) : null}
        </View>
        {phone || email || website ? (
          <View style={styles.contactDetails}>
            {phone ? (
              <Text selectable style={[styles.value, { color: colors.dark }]}>
                {phone}
              </Text>
            ) : null}
            {email ? (
              <Text selectable style={[styles.value, { color: colors.muted }]}>
                {email}
              </Text>
            ) : null}
            {website ? (
              <Text selectable style={[styles.value, { color: colors.muted }]}>
                {website.replace(/^https?:\/\//, '').replace(/\/$/, '')}
              </Text>
            ) : null}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: Spacing.xl, gap: Spacing.sm },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 32,
    letterSpacing: -0.4,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 13,
    lineHeight: 22,
    marginBottom: Spacing.xs,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.xl,
    ...Shadows.premium,
  },
  location: { padding: Spacing.xl, gap: Spacing.md },
  locationHeading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  locationTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    lineHeight: 26,
    writingDirection: 'auto',
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  flex: { flex: 1, minWidth: 0 },
  label: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 11,
    lineHeight: 18,
    letterSpacing: 0.3,
  },
  address: {
    fontFamily: Fonts.body,
    fontSize: 14,
    lineHeight: 26,
    writingDirection: 'auto',
  },
  value: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 14,
    lineHeight: 24,
    writingDirection: 'auto',
    flexShrink: 1,
  },
  mapButton: {
    minHeight: 48,
    borderRadius: Radius.md,
    padding: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mapText: { fontFamily: Fonts.bodySemiBold, fontSize: 12, flex: 1 },
  hint: { fontFamily: Fonts.body, fontSize: 11, lineHeight: 18 },
  method: {
    flexGrow: 1,
    flexBasis: '28%',
    minWidth: 80,
    gap: Spacing.sm,
    padding: Spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: Radius.md,
    alignItems: 'center',
    minHeight: 110,
  },
  actionText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 12,
    lineHeight: 20,
    marginTop: Spacing.xs,
    textAlign: 'center',
  },
  methods: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    padding: Spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  contactDetails: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.xl,
    gap: Spacing.xs,
  },
  methodCopy: { alignItems: 'center', width: '100%' },
});
