import { useBackendState, useBackendEffect as useEffect } from '@/hooks/useBackendData';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';
import { PickupMap } from '@/components/map/PickupMap';
import { mapTravelerFromUser, mapVehicleFromTrip } from '@/components/map/mapParties';
import { PickupCard } from '@/components/map/PickupCard';
import { Button } from '@/components/ui/Button';
import { EmptyState, ErrorState, LoadingState } from '@/components/ui/EmptyState';
import { TravelSection } from '@/components/ui/TravelPrimitives';
import { BookingFlowFooter, BookingFlowHeader, BookingFlowNotice, BookingJourneyCard, useBookingColors, withBookingFlow } from '@/components/booking/BookingFlowPresentation';
import { Fonts } from '@/constants/typography';
import { useLocation } from '@/hooks/useLocation';
import { getApiErrorMessage } from '@/services/apiError';
import * as tripService from '@/services/tripService';
import { useAuthStore } from '@/store/authStore';
import { useBookingStore } from '@/store/bookingStore';
import type { PickupPoint } from '@/types/route';
import { paramId, safeBack } from '@/utils/navigation';
function PickupScreen() {
    const id = paramId(useLocalSearchParams<{
        id: string | string[];
    }>().id);
    const colors = useBookingColors();
    const { location, request } = useLocation();
    const user = useAuthStore(s => s.user);
    const trip = useBookingStore(s => s.selectedTrip);
    const selectedPickup = useBookingStore(s => s.selectedPickup);
    const setPickup = useBookingStore(s => s.setPickup);
    const [pickups, setPickups] = useBackendState<PickupPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [reload, setReload] = useState(0);
    const selected = pickups.find(p => p.id === selectedPickup?.id);
    useEffect(() => { void request(); }, [request]);
    useEffect(() => {
        let active = true;
        (async () => {
            setLoading(true);
            setError('');
            try {
                if (!id)
                    throw new Error('Choose a trip before selecting your pickup point.');
                const data = await tripService.getPickupPoints(id);
                if (!active)
                    return;
                setPickups(data);
                const current = useBookingStore.getState().selectedPickup;
                if (data[0] && (!current || !data.some(p => p.id === current.id)))
                    setPickup(data[0]);
            }
            catch (reason) {
                if (active) {
                    setPickups([]);
                    setError(getApiErrorMessage(reason));
                }
            }
            finally {
                if (active)
                    setLoading(false);
            }
        })();
        return () => { active = false; };
    }, [id, setPickup, reload]);
    return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <BookingFlowHeader title="Choose pickup" subtitle="Choose where you’ll join the journey." step={1} onBack={() => safeBack(`/(customer)/trip/${id}`)}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 24, gap: 18 }}>
      {trip ? <BookingJourneyCard trip={trip} compact/> : null}
      {pickups.length ? <View style={{ borderRadius: 24, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }}><PickupMap pickups={pickups} selectedPickupId={selected?.id} onSelectPickup={setPickup} userLocation={location} traveler={mapTravelerFromUser(user)} vehicle={mapVehicleFromTrip(trip)} height={220} allowFullscreen showControls showSelectedCard={false}/></View> : null}
      <TravelSection title="Boarding points" subtitle="Select a point on the map or from the list below." compact contained accessory={<Text style={{ fontFamily: Fonts.bodySemiBold, color: colors.primary, fontSize: 12 }}>{pickups.length} points</Text>}>
        {loading ? <LoadingState title="Loading pickup points…"/> : error ? <ErrorState title="Pickup points unavailable" message={error} onRetry={() => setReload(value => value + 1)}/> : pickups.length ? pickups.map((pickup, index) => <PickupCard key={pickup.id} pickup={pickup} index={index + 1} selected={selected?.id === pickup.id} onPress={() => setPickup(pickup)}/>) : <EmptyState title="No pickup points" message="This provider hasn’t published boarding points for this trip."/>}
      </TravelSection>
      <BookingFlowNotice title="Meet your provider" message="Check the boarding time and address before you travel. Your selected pickup will appear in your booking." icon="location-outline"/>
    </ScrollView>
    <BookingFlowFooter>
      <View style={{ gap: 4 }}><Text style={{ fontFamily: Fonts.body, fontSize: 11, color: colors.muted }}>YOUR PICKUP</Text><Text style={{ fontFamily: Fonts.bodySemiBold, fontSize: 14, color: colors.dark }} numberOfLines={2}>{selected?.name || 'Choose a boarding point'}</Text></View>
      <Button title="Continue to seats" disabled={!selected || loading || !trip} onPress={() => router.push(`/(customer)/seat/${id}`)}/>
    </BookingFlowFooter>
  </View>;
}
export default withBookingFlow(PickupScreen);
