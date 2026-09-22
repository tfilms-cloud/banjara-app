import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { Colors } from '@/constants/colors';
import { Radius, Spacing } from '@/constants/spacing';
import { FavoriteButton } from './FavoriteButton';
import { normalizeMediaUrl } from '@/utils/mediaUrl';

interface HotelImageGalleryProps {
  images: string[];
  hotelId?: string;
  height?: number;
}

export function HotelImageGallery({ images, hotelId, height = 240 }: HotelImageGalleryProps) {
  const { width } = useWindowDimensions();
  const [active, setActive] = useState(0);

  return (
    <View style={[styles.wrap, { height }]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => {
          const index = Math.round(
            event.nativeEvent.contentOffset.x / event.nativeEvent.layoutMeasurement.width
          );
          setActive(index);
        }}
      >
        {images.map((uri) => (
          <Image
            key={uri}
            source={{ uri: normalizeMediaUrl(uri) ?? uri }}
            style={{ width, height }}
            contentFit="cover"
          />
        ))}
      </ScrollView>
      {hotelId ? (
        <View style={styles.fav}>
          <FavoriteButton hotelId={hotelId} />
        </View>
      ) : null}
      <View style={styles.dots}>
        {images.map((uri, index) => (
          <Pressable
            key={uri}
            onPress={() => setActive(index)}
            style={[styles.dot, active === index && styles.dotActive]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    backgroundColor: Colors.softBlue,
    overflow: 'hidden',
  },
  fav: {
    position: 'absolute',
    top: Spacing.lg,
    right: Spacing.lg,
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.md,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.45)',
  },
  dotActive: {
    backgroundColor: Colors.card,
    width: 16,
    borderRadius: Radius.full,
  },
});
