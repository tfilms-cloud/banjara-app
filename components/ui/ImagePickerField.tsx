import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRef, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Typography } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';
import { removeImage } from '@/services/uploadService';
import { getApiErrorMessage } from '@/services/apiError';

type Props = {
  urls: string[];
  localPreviews?: string[];
  uploading?: boolean;
  disabled?: boolean;
  storageReferences?: string[];
  onRemovingChange?: (removing: boolean) => void;
  max?: number;
  label?: string;
  onAdd: () => void;
  onRemove: (index: number) => void;
};

export function ImagePickerField({
  urls,
  localPreviews = [],
  uploading,
  disabled = false,
  storageReferences,
  onRemovingChange,
  max = 5,
  label = 'Photos',
  onAdd,
  onRemove,
}: Props) {
  const [removing, setRemoving] = useState<number | null>(null);
  const [removeError, setRemoveError] = useState('');
  const [removeNotice, setRemoveNotice] = useState('');
  const removingRef = useRef(false);
  const previews = [...urls, ...localPreviews.filter((uri) => !urls.includes(uri))];
  const blocked = disabled || Boolean(uploading) || removing !== null;
  const canAdd = previews.length < max && !blocked;

  const remove = async (index: number, uri: string) => {
    if (blocked || removingRef.current) return;
    removingRef.current = true;
    setRemoving(index); setRemoveError(''); setRemoveNotice(''); onRemovingChange?.(true);
    try {
      const result = await removeImage(storageReferences?.[index] || uri);
      onRemove(index);
      if (result.status === 'pending') setRemoveNotice('Removal queued. Save your changes to remove photos from saved records.');
    } catch (error) {
      setRemoveError(`${getApiErrorMessage(error)} Tap × to retry.`);
    } finally {
      removingRef.current = false;
      setRemoving(null); onRemovingChange?.(false);
    }
  };

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
              onPress={() => void remove(index, uri)}
              disabled={blocked}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Remove photo"
              accessibilityState={{ disabled: blocked, busy: removing === index }}
            >
              {removing === index ? <ActivityIndicator size="small" color={Colors.white} /> : <Ionicons name="close" size={14} color={Colors.white} />}
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
      {removeError ? <Text style={styles.error} accessibilityRole="alert">{removeError}</Text> : null}
      {removeNotice ? <Text style={styles.hint} accessibilityLiveRegion="polite">{removeNotice}</Text> : null}
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
  error: { ...Typography.small, color: Colors.danger },
});
