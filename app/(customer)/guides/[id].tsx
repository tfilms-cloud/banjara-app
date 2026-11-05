import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { createURL } from 'expo-linking';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Alert, Share } from 'react-native';
import {
  GuideDetailsFrame,
  GuideDetailsPresentation,
} from '@/components/guides/GuideDetailsPresentation';
import { ErrorState } from '@/components/ui/EmptyState';
import { AgencyProfileSkeleton } from '@/components/ui/Skeleton';
import { isGuideService } from '@/constants/providerOptions';
import { getApiErrorMessage } from '@/services/apiError';
import * as guideBookingService from '@/services/guideBookingService';
import * as providerService from '@/services/providerService';
import { getProviderReviews } from '@/services/review.service';
import type { GuideAvailabilityPublic } from '@/types/guide';
import type { Provider } from '@/types/provider';
import type { Review } from '@/types/trip';
import {
  guideDisplayName,
  guideServiceForBooking,
  guideServiceKey,
  guideServices,
} from '@/utils/guidePresentation';
import { paramId, pushPath, safeBack } from '@/utils/navigation';

export default function GuideProfileScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const [provider, setProvider] = useBackendState<Provider | null>(null);
  const [availability, setAvailability] = useBackendState<GuideAvailabilityPublic | null>(null);
  const [reviews, setReviews] = useBackendState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>();
  const request = useRef(0);

  const refresh = useCallback(async () => {
    const currentRequest = ++request.current;
    setLoading(true);
    setError(null);
    try {
      if (!id) throw new Error('Guide not found');
      const [profile, schedule, reviewList] = await Promise.all([
        providerService.getPublicProviderById(id),
        guideBookingService.getGuideAvailability(id).catch(() => null),
        getProviderReviews(id).catch(() => [] as Review[]),
      ]);
      if (currentRequest !== request.current) return;
      if (!profile) {
        setProvider(null);
        setError('Could not load this guide. Please try again.');
        return;
      }
      if (!profile.services.some(isGuideService)) {
        setProvider(null);
        setError('This provider is not listed as a guide.');
        return;
      }
      setProvider(profile);
      setAvailability(schedule);
      setReviews(reviewList);
    } catch (failure) {
      if (currentRequest === request.current) setError(getApiErrorMessage(failure));
    } finally {
      if (currentRequest === request.current) setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    setSelected(undefined);
    void refresh();
    return () => {
      request.current++;
    };
  }, [refresh]);

  const current = provider?.id === id ? provider : null;
  const services = useMemo(() => (current ? guideServices(current) : []), [current]);
  const onBack = () => safeBack('/(customer)/(tabs)/search');
  const onProfile = () => pushPath('/(customer)/(tabs)/profile');

  if (!current)
    return (
      <GuideDetailsFrame onBack={onBack} onProfile={onProfile}>
        {loading ? (
          <AgencyProfileSkeleton />
        ) : (
          <ErrorState
            title="Guide unavailable"
            message={error || 'This guide could not be found.'}
            onRetry={() => void refresh()}
          />
        )}
      </GuideDetailsFrame>
    );

  const onShare = () => {
    void Share.share({
      message: `Hire ${guideDisplayName(current)} on Banjara.\n${createURL(`/guides/${id}`)}`,
    }).catch((failure) => Alert.alert('Could not share guide', getApiErrorMessage(failure)));
  };
  const onBook = () => {
    const service = guideServiceForBooking(services, selected);
    if (service)
      pushPath(
        `/(customer)/guides/book/${id}?service=${encodeURIComponent(guideServiceKey(service))}`,
      );
  };

  return (
    <GuideDetailsPresentation
      key={current.id}
      provider={current}
      availability={availability}
      reviews={reviews}
      services={services}
      selected={selected}
      onSelect={(service) => setSelected(guideServiceKey(service))}
      loading={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onProfile={onProfile}
      onShare={onShare}
      onChat={current.userId ? () => pushPath(`/(customer)/messages/${current.userId}`) : undefined}
      onBook={onBook}
    />
  );
}
