import { createURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { Alert, Linking, Share } from 'react-native';
import {
  RestaurantDetailsFrame,
  RestaurantDetailsPresentation,
} from '@/components/restaurants/RestaurantDetailsPresentation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useProviderFavorite } from '@/hooks/useProviderFavorite';
import { useRestaurant } from '@/hooks/useRestaurants';
import { getApiErrorMessage } from '@/services/apiError';
import { paramId, safeBack } from '@/utils/navigation';
import { restaurantPhone, restaurantWebsite } from '@/utils/restaurantPresentation';

export default function RestaurantProfileScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { restaurant, loading, refresh } = useRestaurant(id);
  const favorite = useProviderFavorite(id);
  const onBack = () => safeBack('/(customer)/(tabs)/search');

  if (!restaurant)
    return (
      <RestaurantDetailsFrame onBack={onBack}>
        {loading ? (
          <LoadingState title="Loading restaurant..." />
        ) : (
          <ErrorState
            title="Restaurant unavailable"
            message="This restaurant could not be loaded. Please try again."
            onRetry={() => void refresh()}
          />
        )}
      </RestaurantDetailsFrame>
    );

  const phone = restaurantPhone(restaurant.phone);
  const website = restaurantWebsite(restaurant.website);
  const open = (url: string, label: string) => {
    void Linking.openURL(url).catch(() =>
      Alert.alert(label, 'Please try again on a device that supports this action.'),
    );
  };
  const onShare = () => {
    void Share.share({
      message: `${restaurant.name}${restaurant.city ? ` · ${restaurant.city}` : ''}\n${createURL(`/restaurants/${id}`)}`,
    }).catch((error) => Alert.alert('Could not share restaurant', getApiErrorMessage(error)));
  };

  return (
    <RestaurantDetailsPresentation
      key={restaurant.id}
      restaurant={restaurant}
      saved={favorite.saved}
      saving={favorite.busy}
      refreshing={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onShare={onShare}
      onSave={() =>
        void favorite
          .toggle()
          .catch((error) => Alert.alert('Could not save restaurant', getApiErrorMessage(error)))
      }
      onCall={phone ? () => open(`tel:${phone}`, 'Could not open the dialer') : undefined}
      onWebsite={website ? () => open(website, 'Could not open the website') : undefined}
    />
  );
}
