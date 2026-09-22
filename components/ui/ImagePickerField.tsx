import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type Props = {
  urls: string[];
  localPreviews?: string[];
  uploading?: boolean;
  max?: number;
  label?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function ImagePickerField({
  urls,
  localPreviews = [],
  uploading,
  max = 5,
  label = 'Photos',
  onAdd,
  onRemove,
}: Props) {
  const previews = [...urls, ...localPreviews.filter((uri) => !urls.includes(uri))];
  const canAdd = previews.length < max && !uploading;

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {previews.map((uri, index) => (
          <View key={`${uri}-${index}`} style={styles.thumbWrap}>
            <Image
              source={{ uri: normalizeMediaUrl(uri) ?? uri }}
              style={styles.thumb}
              contentFit="cover"
            />
            <Pressable
              style={styles.remove}
              onPress={() => onRemove(index)}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
            >
              <Ionicons name="close" size={14} color={Colors.white} />
            </Pressable>
          </View>
        ))}

        {canAdd ? (
          <Pressable
            style={styles.add}
            onPress={onAdd}
            accessibilityRole="button"
            accessibilityLabel="Add photos"
          >
            {uploading ? (
              <ActivityIndicator color={Colors.secondary} />
            ) : (
              <>
                <Ionicons name="camera-outline" size={22} color={Colors.secondary} />
                <Text style={styles.addText}>Add</Text>
              </>
            )}
          </Pressable>
        ) : uploading ? (
          <View style={styles.add}>
            <ActivityIndicator color={Colors.secondary} />
          </View>
        ) : null}
      </ScrollView>
      <Text style={styles.hint}>
        {previews.length}/{max} photos · stored securely and linked automatically
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: Spacing.sm },
  label: { ...Typography.caption, color: Colors.muted, fontWeight: '600' },
  row: { gap: Spacing.sm, alignItems: 'center' },
  thumbWrap: { position: 'relative' },
  thumb: {
    width: 88,
    height: 88,
    borderRadius: Radius.lg,
    backgroundColor: Colors.border,
  },
  remove: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  add: {
    width: 88,
    height: 88,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  addText: { ...Typography.caption, color: Colors.secondary, fontWeight: '600' },
  hint: { ...Typography.small, color: Colors.muted },
});
