import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { createURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, Share } from 'react-native';
import {
  TourDetailsFrame,
  TourDetailsPresentation,
} from '@/components/tours/TourDetailsPresentation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useTourItinerary } from '@/hooks/useTourItineraries';
import { getApiErrorMessage } from '@/services/apiError';
import { getPublicProviderById } from '@/services/providerService';
import type { Provider } from '@/types/provider';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

export default function TourItineraryDetailScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { item, loading, error, refresh } = useTourItinerary(id);
  const [messaging, setMessaging] = useState(false);
  const [operator, setOperator] = useBackendState<Provider | null>(null);
  const onBack = () => safeBack('/(customer)/(tabs)/search');

  useEffect(() => {
    let active = true;
    setOperator(null);
    if (item?.providerId && !item.provider) {
      void getPublicProviderById(item.providerId)
        .then((profile) => {
          if (active) setOperator(profile);
        })
        .catch(() => {
          /* The itinerary remains usable if operator details are unavailable. */
        });
    }
    return () => {
      active = false;
    };
  }, [item]);

  if (!item) {
    return (
      <TourDetailsFrame onBack={onBack}>
        {loading ? (
          <LoadingState title="Loading package…" />
        ) : (
          <ErrorState
            title="Package unavailable"
            message={error || 'This itinerary may be unpublished or no longer available.'}
            onRetry={() => void refresh()}
          />
        )}
      </TourDetailsFrame>
    );
  }

  const onMessage = async () => {
    if (messaging || !item.providerId) return;
    setMessaging(true);
    try {
      const provider =
        operator?.id === item.providerId ? operator : await getPublicProviderById(item.providerId);
      if (!provider?.userId) {
        Alert.alert('Messaging unavailable', 'This operator has not provided a messaging contact.');
        return;
      }
      pushPath(`/(customer)/messages/${provider.userId}`);
    } catch (failure) {
      Alert.alert('Could not open conversation', getApiErrorMessage(failure));
    } finally {
      setMessaging(false);
    }
  };

  return (
    <TourDetailsPresentation
      key={item.id}
      item={
        item.provider || operator?.id !== item.providerId
          ? item
          : {
              ...item,
              provider: {
                id: operator.id,
                businessName: operator.businessName,
                logo: operator.logo,
                rating: operator.rating,
                reviewCount: operator.reviewCount,
                yearsExperience: operator.yearsExperience,
                city: operator.city,
                verified: operator.verificationStatus === 'approved',
              },
            }
      }
      refreshing={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onShare={() => {
        void Share.share({ message: `${item.title}\n${createURL(`/tours/${item.id}`)}` }).catch(
          (failure) => Alert.alert('Could not share tour', getApiErrorMessage(failure)),
        );
      }}
      onOperator={() => pushPath(`/(customer)/agency/${item.providerId}`)}
      onMessage={() => void onMessage()}
      messaging={messaging}
      onReserve={() => pushPath(`/(customer)/tours/book/${item.id}`)}
    />
  );
}
