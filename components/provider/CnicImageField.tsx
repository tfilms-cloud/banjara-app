import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { useThemeColors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';

type Props = {
  label: string;
  uri?: string | null;
  busy?: boolean;
  onTakePhoto: () => void;
  onChooseGallery: () => void;
  onRemove: () => void;
};

export function CnicImageField({
  label,
  uri,
  busy,
  onTakePhoto,
  onChooseGallery,
  onRemove,
}: Props) {
  const colors = useThemeColors();

  return (
    <View style={[styles.wrap, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <Text style={[styles.label, { color: colors.dark }]}>{label}</Text>

      {uri ? (
        <View style={styles.previewWrap}>
          <Image source={{ uri }} style={styles.preview} contentFit="contain" />
          <Pressable
            style={[styles.remove, { backgroundColor: colors.danger }]}
            onPress={onRemove}
            accessibilityRole="button"
            accessibilityLabel="Remove image"
          >
            <Ionicons name="close" size={14} color={colors.white} />
          </Pressable>
        </View>
      ) : (
        <View style={[styles.placeholder, { backgroundColor: colors.surfaceSecondary }]}>
          <Ionicons name="card-outline" size={28} color={colors.muted} />
          <Text style={[styles.placeholderText, { color: colors.muted }]}>
            Clear photo of your CNIC
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        <Pressable
          style={[styles.btn, { borderColor: colors.border }]}
          onPress={onTakePhoto}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <Ionicons name="camera-outline" size={18} color={colors.primary} />
              <Text style={[styles.btnText, { color: colors.primary }]}>Take Photo</Text>
            </>
          )}
        </Pressable>
        <Pressable
          style={[styles.btn, { borderColor: colors.border }]}
          onPress={onChooseGallery}
          disabled={busy}
        >
          <Ionicons name="images-outline" size={18} color={colors.primary} />
          <Text style={[styles.btnText, { color: colors.primary }]}>Gallery</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderWidth: 1,
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  label: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
  },
  previewWrap: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: 160,
  },
  remove: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholder: {
    height: 120,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  placeholderText: {
    fontFamily: Fonts.body,
    fontSize: 13,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btn: {
    flex: 1,
    minHeight: 44,
    borderWidth: 1,
    borderRadius: Radius.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  btnText: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 13,
  },
});
