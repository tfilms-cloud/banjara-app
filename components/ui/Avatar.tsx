import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import { AuthFonts } from '@/constants/authFonts';
import { useThemeColors } from '@/constants/colors';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

interface AvatarProps {
  uri?: string | null;
  name?: string;
  size?: number;
}

/** Stock / demo face URLs — never use these as a real profile photo. */
function isDummyPhotoUrl(url?: string | null) {
  if (!url) return true;
  const u = url.toLowerCase();
  return (
    u.includes('pravatar.cc') ||
    u.includes('ui-avatars.com') ||
    u.includes('placeholder.com') ||
    u.includes('via.placeholder') ||
    u.includes('dummyimage.com') ||
    u.includes('picsum.photos')
  );
}

export function Avatar({ uri, name = 'U', size = 56 }: AvatarProps) {
  const colors = useThemeColors();
  const safeUri = normalizeMediaUrl(uri ?? undefined);
  const showPhoto = Boolean(safeUri) && !isDummyPhotoUrl(safeUri);

  const initials = (name || 'U')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'U';

  if (showPhoto && safeUri) {
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
          backgroundColor: colors.primarySoft,
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: colors.border,
        },
      ]}
      accessibilityLabel={`${name || 'User'} profile placeholder`}
    >
      {name?.trim() ? (
        <Text style={[styles.initials, { fontSize: size * 0.32, color: colors.primary }]}>
          {initials}
        </Text>
      ) : (
        <Ionicons name="person" size={size * 0.45} color={colors.primary} />
      )}
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
