import { Image } from 'expo-image';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
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

  const visible = uris.filter((uri) => !failed[uri]);
  if (!visible.length) return null;

  const gap = Spacing.sm;
  const tileWidth = (width - Spacing.screen * 2 - gap) / 2;

  return (
    <>
      <View style={styles.grid}>
        {visible.map((uri) => (
          <Pressable
            key={uri}
            onPress={() => setActive(uri)}
            accessibilityRole="imagebutton"
            accessibilityLabel="View provider photo"
            style={({ pressed }) => [
              styles.tile,
              { width: tileWidth, opacity: pressed ? 0.92 : 1 },
            ]}
          >
            <Image
              source={{ uri }}
              style={styles.image}
              contentFit="cover"
              transition={200}
              onError={() => setFailed((current) => ({ ...current, [uri]: true }))}
            />
          </Pressable>
        ))}
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
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Colors.surfaceSecondary,
  },
  image: {
    width: '100%',
    height: '100%',
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
