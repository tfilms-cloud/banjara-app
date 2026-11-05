import { useLocalSearchParams } from 'expo-router';
import { Alert, Linking } from 'react-native';
import {
  HotelDetailsFrame,
  HotelDetailsPresentation,
} from '@/components/hotels/HotelDetailsPresentation';
import { ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { useHotelDetails } from '@/hooks/useHotelDetails';
import { useHotelStore } from '@/store/hotelStore';
import { paramId, pushPath, safeBack } from '@/utils/navigation';
import { hotelMapUrl } from '@/utils/hotelPresentation';
import { publicEmail, publicPhone } from '@/utils/publicContact';
import { publicWebsite } from '@/utils/providerDetails';

export default function HotelDetailsScreen() {
  const params = useLocalSearchParams<{ id: string | string[] }>();
  const id = paramId(params.id);
  const { hotel, loading, refresh } = useHotelDetails(id);
  const setHotel = useHotelStore((state) => state.setHotel);
  const onBack = () => safeBack('/(customer)/hotels/results');
  const onProfile = () => pushPath('/(customer)/(tabs)/profile');

  if (!hotel)
    return (
      <HotelDetailsFrame onBack={onBack} onProfile={onProfile}>
        {loading ? (
          <LoadingState title="Loading property..." />
        ) : (
          <ErrorState
            title="Property unavailable"
            message="This property could not be loaded. Please try again."
            onRetry={() => void refresh()}
          />
        )}
      </HotelDetailsFrame>
    );

  const open = (url: string, message: string) => {
    void Linking.openURL(url).catch(() => Alert.alert('Could not open this action', message));
  };
  const phone = publicPhone(hotel.phone);
  const landline = publicPhone(hotel.landline);
  const email = publicEmail(hotel.email);
  const website = publicWebsite(hotel.website);
  const call = (number: string) => () =>
    open(`tel:${number}`, 'Please try the dialer on a supported device.');

  return (
    <HotelDetailsPresentation
      key={hotel.id}
      hotel={hotel}
      loading={loading}
      onRefresh={() => void refresh()}
      onBack={onBack}
      onProfile={onProfile}
      onMap={() => open(hotelMapUrl(hotel), 'Please try opening the property location again.')}
      onCall={phone ? call(phone) : undefined}
      onLandline={landline ? call(landline) : undefined}
      onEmail={
        email ? () => open(email, 'Please use a device with an email app configured.') : undefined
      }
      onWebsite={
        website ? () => open(website, 'Please try opening the property website again.') : undefined
      }
      onSelectRoom={() => {
        setHotel(hotel);
        pushPath(`/(customer)/hotels/rooms/${hotel.id}`);
      }}
    />
  );
}
