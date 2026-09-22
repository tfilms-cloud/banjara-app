import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { AuthFonts } from '@/constants/authFonts';
import { useThemeColors } from '@/constants/colors';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

interface AvatarProps {
  uri?: string;
  name?: string;
  size?: number;
}

export function Avatar({ uri, name = 'U', size = 56 }: AvatarProps) {
  const colors = useThemeColors();
  const safeUri = normalizeMediaUrl(uri);
  const initials = name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  if (safeUri) {
    return (
      <Image
        source={{ uri: safeUri }}
        style={{ width: size, height: size, borderRadius: size / 2 }}
        contentFit="cover"
      />
    );
  }

  return (
    <View
      style={[
        styles.fallback,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: colors.elevated,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.32, color: colors.primary }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  fallback: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    fontFamily: AuthFonts.bodyMedium,
  },
});
