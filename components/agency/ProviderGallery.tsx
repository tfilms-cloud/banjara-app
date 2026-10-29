import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { Fonts } from '@/constants/typography';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

type ProviderGalleryProps = {
  images: string[];
};

export function ProviderGallery({ images }: ProviderGalleryProps) {
  const { width, height } = useWindowDimensions();
  const [active, setActive] = useState<string | null>(null);
  const [failed, setFailed] = useState<Record<string, boolean>>({});

  const uris = useMemo(
    () =>
      images
        .map((uri) => normalizeMediaUrl(uri) ?? uri)
        .filter((uri, index, list) => Boolean(uri) && list.indexOf(uri) === index),
    [images]
  );

  if (!uris.length) {
    return (
      <View style={styles.empty}>
        <Ionicons name="images-outline" size={28} color={Colors.muted} />
        <Text style={styles.emptyText}>No photos uploaded yet</Text>
      </View>
    );
  }

  const gap = Spacing.sm;
  const tileWidth = Math.floor((width - Spacing.screen * 2 - gap) / 2);
  const tileHeight = Math.floor(tileWidth * 0.75);

  return (
    <>
      <View style={styles.grid}>
        {uris.map((uri, index) => {
          const broke = Boolean(failed[uri]);
          return (
            <Pressable
              key={`${uri}-${index}`}
              onPress={() => {
                if (!broke) setActive(uri);
              }}
              accessibilityRole="imagebutton"
              accessibilityLabel={`Provider photo ${index + 1}`}
              style={({ pressed }) => [
                styles.tile,
                { width: tileWidth, height: tileHeight, opacity: pressed ? 0.92 : 1 },
              ]}
            >
              {broke ? (
                <View style={styles.fallback}>
                  <Ionicons name="image-outline" size={28} color={Colors.muted} />
                </View>
              ) : (
                <Image
                  source={{ uri }}
                  style={{ width: tileWidth, height: tileHeight }}
                  contentFit="cover"
                  transition={200}
                  cachePolicy="memory-disk"
                  onError={() => setFailed((current) => ({ ...current, [uri]: true }))}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <Modal
        visible={Boolean(active)}
        transparent
        animationType="fade"
        onRequestClose={() => setActive(null)}
      >
        <Pressable
          style={styles.modal}
          onPress={() => setActive(null)}
          accessibilityRole="button"
          accessibilityLabel="Close photo"
        >
          {active ? (
            <Image
              source={{ uri: active }}
              style={{ width: width - 32, height: height * 0.7, borderRadius: Radius.lg }}
              contentFit="contain"
            />
          ) : null}
          <Text style={styles.close}>Close</Text>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  tile: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  fallback: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing['2xl'],
    backgroundColor: Colors.card,
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.muted,
  },
  modal: {
    flex: 1,
    backgroundColor: 'rgba(11, 31, 51, 0.92)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  close: {
    fontFamily: Fonts.bodySemiBold,
    fontSize: 15,
    color: Colors.white,
  },
});
