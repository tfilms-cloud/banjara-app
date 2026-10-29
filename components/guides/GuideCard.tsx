import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Rating } from '@/components/ui/Rating';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import type { GuideListItem } from '@/types/guide';
import { formatCurrency } from '@/utils/formatCurrency';

const FALLBACK =
  'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=400&q=80&auto=format&fit=crop';

type Props = {
  guide: GuideListItem;
  onPress: () => void;
};

function displayName(item: GuideListItem) {
  return item.guide?.fullName || item.ownerName || item.businessName || 'Guide';
}

export function GuideCard({ guide, onPress }: Props) {
  const colors = useThemeColors();
  const langs = guide.guide?.languages?.slice(0, 3).map((l) => l.language) ?? [];
  const types = guide.guide?.guideTypes?.slice(0, 2) ?? [];
  const image = guide.logo || guide.guide?.profilePhoto || FALLBACK;

  return (
    <Pressable
      onPress={onPress}
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Image source={{ uri: image }} style={styles.avatar} contentFit="cover" />
      <View style={{ flex: 1, gap: 4 }}>
        <Text style={[styles.name, { color: colors.dark }]} numberOfLines={1}>
          {displayName(guide)}
        </Text>
        <Text style={[styles.meta, { color: colors.muted }]} numberOfLines={1}>
          {[guide.city, types.join(' · '), langs.join(', ')].filter(Boolean).join(' · ')}
        </Text>
        {guide.rating > 0 ? (
          <Rating value={guide.rating} count={guide.reviewCount || undefined} size={14} />
        ) : (
          <Text style={[styles.meta, { color: colors.muted }]}>New guide</Text>
        )}
        {guide.fromPrice ? (
          <Text style={[styles.price, { color: colors.primary }]}>
            From {formatCurrency(guide.fromPrice)}
          </Text>
        ) : null}
      </View>
      <Ionicons name="chevron-forward" size={18} color={colors.muted} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: Radius.lg,
    backgroundColor: '#e8eef4',
  },
  name: { fontFamily: Fonts.bodySemiBold, fontSize: 16 },
  meta: { fontFamily: Fonts.body, fontSize: 12 },
  price: { fontFamily: Fonts.bodySemiBold, fontSize: 13, marginTop: 2 },
});
