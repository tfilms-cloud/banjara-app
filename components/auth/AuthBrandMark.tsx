import { StyleSheet, Text, View } from 'react-native';
import { BrandMark } from '@/components/brand/BrandMark';
import { Colors } from '@/constants/colors';
import { Spacing } from '@/constants/spacing';
import { AuthFonts } from '@/constants/authFonts';
import { Brand } from '@/constants/typography';

type AuthBrandMarkProps = {
  compact?: boolean;
  light?: boolean;
};

export function AuthBrandMark({ compact = false, light = false }: AuthBrandMarkProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <BrandMark size={compact ? 30 : 36} />
      <Text style={[styles.name, compact && styles.nameCompact, light && styles.nameLight]}>
        {Brand.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  wrapCompact: {
    gap: 8,
  },
  name: {
    fontFamily: AuthFonts.bodyBold,
    fontSize: 20,
    color: Colors.primary,
    letterSpacing: 1,
  },
  nameCompact: {
    fontSize: 15,
    letterSpacing: 0.8,
  },
  nameLight: {
    color: Colors.white,
  },
});
