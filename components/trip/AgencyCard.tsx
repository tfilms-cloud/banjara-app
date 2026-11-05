import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts, Typography } from '@/constants/typography';
import type { Agency } from '@/types/trip';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { useHomeDesign } from '@/constants/homeDesign';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { TripPanel } from '@/components/trip/TripDetailsPresentation';
import { Ionicons } from '@expo/vector-icons';
import { Button } from '@/components/ui/Button';

interface AgencyCardProps {
  agency: Agency;
  onPress?: () => void;
  linkLabel?: string;
  onMessage?: () => void;
}

function agencyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function AgencyCard({
  agency,
  onPress,
  onMessage,
  linkLabel = 'View all trips',
}: AgencyCardProps) {
  const travel = useTravelPresentation();
  const theme = useHomeDesign();
  const logoUri = useMemo(
    () => normalizeMediaUrl(agency.logo) ?? (agency.logo || undefined),
    [agency.logo],
  );
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  const showLogo = Boolean(logoUri) && !logoFailed;

  if (travel)
    return (
      <TripPanel>
        <Pressable
          onPress={onPress}
          accessibilityRole="button"
          accessibilityLabel={`View provider ${agency.name}`}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          {showLogo ? (
            <Image
              source={{ uri: logoUri }}
              contentFit="cover"
              onError={() => setLogoFailed(true)}
              style={{ width: 48, height: 48, borderRadius: 24 }}
            />
          ) : (
            <View
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: theme.soft,
              }}
            >
              <Text style={{ fontFamily: Fonts.bodyBold, color: theme.primary }}>
                {agencyInitials(agency.name)}
              </Text>
            </View>
          )}
          <View style={{ flex: 1, minWidth: 0, gap: 3 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <Text
                style={{
                  flexShrink: 1,
                  fontFamily: Fonts.bodySemiBold,
                  fontSize: 13,
                  lineHeight: 19,
                  color: theme.text,
                }}
              >
                {agency.name}
              </Text>
              {agency.verified ? (
                <Ionicons
                  name="checkmark-circle"
                  size={15}
                  color={theme.primary}
                  accessibilityLabel="Verified provider"
                />
              ) : null}
            </View>
            {agency.rating > 0 ? (
              <Rating value={agency.rating} count={agency.reviewCount || undefined} size={12} />
            ) : null}
            {agency.city ? (
              <Text
                style={{ fontFamily: Fonts.body, fontSize: 10, lineHeight: 15, color: theme.muted }}
              >
                {agency.city}
              </Text>
            ) : null}
          </View>
          {onPress ? (
            <Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 10, color: theme.primary }}>
              Profile ›
            </Text>
          ) : null}
        </Pressable>
        {onMessage ? (
          <Button
            title="Message provider"
            variant="secondary"
            onPress={onMessage}
            style={{ borderRadius: 24, minHeight: 44 }}
            icon={<Ionicons name="chatbox-ellipses-outline" size={17} color={theme.primary} />}
          />
        ) : null}
      </TripPanel>
    );

  const content = (
    <>
      {showLogo ? (
        <Image
          source={{ uri: logoUri }}
          style={styles.logo}
          contentFit="cover"
          onError={() => setLogoFailed(true)}
        />
      ) : (
        <View style={[styles.logo, styles.logoFallback]}>
          <Text style={styles.logoInitials}>{agencyInitials(agency.name)}</Text>
        </View>
      )}
      <View style={{ flex: 1 }}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>{agency.name}</Text>
          {agency.verified ? <Badge label="Verified" tone="green" /> : null}
        </View>
        {agency.rating > 0 || agency.reviewCount > 0 ? (
          <Rating value={agency.rating} count={agency.reviewCount || undefined} />
        ) : null}
        {agency.city ? (
          <Text style={styles.desc} numberOfLines={1}>
            {agency.city}
          </Text>
        ) : null}
        {onPress ? <Text style={styles.link}>{linkLabel}</Text> : null}
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.card} onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }

  return <View style={styles.card}>{content}</View>;
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: Colors.card,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: Colors.border,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primarySoft,
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: 15,
    color: Colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  name: {
    ...Typography.bodyBold,
    color: Colors.primary,
    flexShrink: 1,
  },
  desc: {
    ...Typography.caption,
    color: Colors.muted,
    marginTop: 6,
    lineHeight: 18,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
    color: Colors.action,
    marginTop: 8,
  },
});
