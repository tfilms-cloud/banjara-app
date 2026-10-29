import { useThemedStyles } from '@/hooks/useThemedStyles';
import { Image } from 'expo-image';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Badge } from '@/components/ui/Badge';
import { Rating } from '@/components/ui/Rating';
import { type ColorTokens } from '@/constants/colors';
import { Radius, Shadows, Spacing, Size } from '@/constants/spacing';
import { CustomerType, Fonts, Typography, TypeSize, Leading } from '@/constants/typography';
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
  const styles = useThemedStyles(createStyles);
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

const createStyles = (colors: ColorTokens) => StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: Spacing.md,
    backgroundColor: colors.card,
    borderRadius: Radius.xl,
    ...Shadows.soft,
    padding: Spacing.lg,
    borderWidth: Size.border,
    borderColor: colors.border,
  },
  logo: {
    width: Size.avatar,
    height: Size.avatar,
    borderRadius: Radius.md,
    backgroundColor: colors.border,
  },
  logoFallback: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primarySoft,
  },
  logoInitials: {
    fontFamily: Fonts.bodyBold,
    fontSize: TypeSize.medium,
    color: colors.primary,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
    ...CustomerType.card,
    color: colors.dark,
    flexShrink: 1,
  },
  desc: {
    ...Typography.caption,
    color: colors.muted,
    marginTop: Spacing.micro,
    lineHeight: Leading.caption,
  },
  link: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: TypeSize.label,
    color: colors.primaryText,
    marginTop: Spacing.sm,
  },
});
