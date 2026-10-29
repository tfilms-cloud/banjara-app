import { Bell, Search } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark } from '@/components/brand/BrandMark';
import { Avatar } from '@/components/ui/Avatar';
import { IconButton } from '@/components/ui/IconButton';
import { useThemeColors } from '@/constants/colors';
import { Radius, Size, Spacing } from '@/constants/spacing';
import { Brand, CustomerType } from '@/constants/typography';

type Props = {
  userName?: string; userAvatar?: string; hasUnread?: boolean;
  onOpenSearch: () => void; onNotifications: () => void; onProfile: () => void;
};

/** Shared Home/Explore header; the supplied app logo stays the brand source. */
export function CustomerHeader(props: Props) {
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.row, { paddingTop: insets.top + Spacing.sm, backgroundColor: colors.background }]}>
      <View style={styles.brand}>
        <BrandMark size={Size.avatarSmall} />
        <Text style={[CustomerType.card, styles.name, { color: colors.dark }]}>{Brand.name}</Text>
      </View>
      <View style={styles.actions}>
        <IconButton onPress={props.onOpenSearch} accessibilityLabel="Search">
          <Search size={Size.icon} color={colors.dark} />
        </IconButton>
        <IconButton onPress={props.onNotifications} accessibilityLabel="Notifications" badge={props.hasUnread}>
          <Bell size={Size.icon} color={colors.dark} />
        </IconButton>
        <Pressable onPress={props.onProfile} style={styles.avatar} accessibilityRole="button" accessibilityLabel="Profile">
          <Avatar uri={props.userAvatar} name={props.userName ?? 'Traveler'} size={Size.avatarSmall} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: Spacing.screen, paddingBottom: Spacing.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.xs },
  brand: { flex: 1, minWidth: 0, flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  name: { flexShrink: 1 },
  actions: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: Size.touch, height: Size.touch, borderRadius: Radius.full, alignItems: 'center', justifyContent: 'center' },
});
