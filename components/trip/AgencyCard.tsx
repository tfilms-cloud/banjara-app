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

interface AgencyCardProps {
  agency: Agency;
  onPress?: () => void;
  linkLabel?: string;
}

function agencyInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return 'A';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

export function AgencyCard({ agency, onPress, linkLabel = 'View all trips' }: AgencyCardProps) {
  const logoUri = useMemo(
    () => normalizeMediaUrl(agency.logo) ?? (agency.logo || undefined),
    [agency.logo]
  );
  const [logoFailed, setLogoFailed] = useState(false);

  useEffect(() => {
    setLogoFailed(false);
  }, [logoUri]);

  const showLogo = Boolean(logoUri) && !logoFailed;

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
