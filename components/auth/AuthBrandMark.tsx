import { MapPin } from 'lucide-react-native';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { AuthFonts } from '@/constants/authFonts';
import { Brand } from '@/constants/typography';

type AuthBrandMarkProps = {
  compact?: boolean;
  light?: boolean;
};

export function AuthBrandMark({ compact = false, light = false }: AuthBrandMarkProps) {
  return (
    <View style={[styles.wrap, compact && styles.wrapCompact]}>
      <View style={[styles.mark, compact && styles.markCompact, light && styles.markLight]}>
        <MapPin
          size={compact ? 14 : 18}
          color={light ? Colors.accent : Colors.accent}
          strokeWidth={2.2}
        />
      </View>
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
  mark: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markCompact: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  markLight: {
    backgroundColor: 'rgba(255,255,255,0.16)',
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
