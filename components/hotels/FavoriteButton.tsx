import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Colors } from '@/constants/colors';
import { useFavoritesStore } from '@/store/favoritesStore';
import { useTravelPresentation } from '@/components/ui/TravelDesignProvider';
import { useHotelDesign } from '@/constants/hotelDesign';

interface FavoriteButtonProps {
  hotelId: string;
  size?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function FavoriteButton({ hotelId, size = 20 }: FavoriteButtonProps) {
  const travel = useTravelPresentation();
  const theme = useHotelDesign();
  const isFavorite = useFavoritesStore((state) => state.isFavorite(hotelId));
  const toggleHotel = useFavoritesStore((state) => state.toggleHotel);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <AnimatedPressable
      onPress={() => {
        void toggleHotel(hotelId);
      }}
      onPressIn={() => {
        scale.value = withSpring(0.88, { damping: 16, stiffness: 320 });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 16, stiffness: 320 });
      }}
      style={[
        styles.btn,
        travel && { backgroundColor: theme.neutral, borderWidth: 1, borderColor: theme.border },
        animatedStyle,
      ]}
      accessibilityRole="button"
      accessibilityLabel={isFavorite ? 'Remove from saved hotels' : 'Save hotel'}
      accessibilityState={{ selected: isFavorite }}
    >
      <Ionicons
        name={isFavorite ? 'heart' : 'heart-outline'}
        size={size}
        color={travel ? (isFavorite ? theme.coral : theme.muted) : Colors.accent}
      />
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(15, 23, 42, 0.42)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
