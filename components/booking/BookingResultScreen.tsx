import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';
import { BookingFlowHeader, BookingFlowNotice, BookingFlowSection, BookingJourneyCard, useBookingColors, withBookingFlow } from './BookingFlowPresentation';
import { Button } from '@/components/ui/Button';
import { Fonts } from '@/constants/typography';
import { PAYMENT_STATUS_LABELS } from '@/constants/payments';
import { useBackendStatus } from '@/hooks/useBackendData';
import { useBookingStore } from '@/store/bookingStore';
import { useHotelStore } from '@/store/hotelStore';
import { formatCurrency } from '@/utils/formatCurrency';
import { toISODate } from '@/utils/formatDate';
function BookingResultScreen() {
    const colors = useBookingColors();
    const status = useBackendStatus();
    const booking = useBookingStore(state => state.lastBooking);
    const selectedTrip = useBookingStore(state => state.selectedTrip);
    const pickup = useBookingStore(state => state.selectedPickup);
    const trip = booking && selectedTrip?.id === booking.tripId ? selectedTrip : null;
    const visible = status === 'online' ? booking : null;
    const confirmed = visible && ['confirmed', 'upcoming', 'completed'].includes(visible.status);
    const cancelled = visible?.status === 'cancelled';
    const title = !visible ? 'Booking details unavailable' : cancelled ? 'Booking cancelled' : confirmed ? 'Your booking is confirmed' : 'Request submitted';
    const label = cancelled ? 'Cancelled' : confirmed ? visible?.status === 'completed' ? 'Completed' : 'Confirmed' : 'Awaiting provider approval';
    return <View style={{ flex: 1, backgroundColor: colors.background }}>
    <BookingFlowHeader title="Your booking" onBack={() => router.replace('/(customer)/(tabs)/bookings')}/>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 32, gap: 20 }}>
      <View style={{ alignItems: 'center', gap: 14, paddingVertical: 16 }}>
        <View style={{ width: 80, height: 80, borderRadius: 28, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primarySoft }}><Ionicons name={!visible ? 'cloud-offline-outline' : cancelled ? 'close-outline' : confirmed ? 'checkmark' : 'time-outline'} size={36} color={colors.primary}/></View>
        <Text accessibilityRole="header" style={{ fontFamily: Fonts.display, fontSize: 28, lineHeight: 34, textAlign: 'center', color: colors.dark }}>{title}</Text>
        <Text style={{ fontFamily: Fonts.body, fontSize: 13, lineHeight: 21, textAlign: 'center', color: colors.muted }}>{!visible ? 'Your journey details will be available when the connection returns. Open My Bookings to check the latest status.' : cancelled ? 'You can check this booking’s details and payment status in My Bookings.' : confirmed ? 'Keep your journey details handy and check your pickup time before you travel.' : 'Your provider will review the request. We’ll notify you when they respond.'}</Text>
      </View>
      {visible ? <>
        {trip ? <BookingJourneyCard trip={trip} pickup={pickup} seats={visible.seats}/> : null}
        <BookingFlowSection title="Booking summary" icon="receipt-outline">
          {[['Status', label], ['Booking ID', visible.bookingCode || visible.id], ['Payment', PAYMENT_STATUS_LABELS[visible.paymentStatus] || visible.paymentStatus], ['Amount', formatCurrency(visible.priceBreakdown.total, visible.priceBreakdown.currency)]].map(([key, value]) => <View key={key} style={{ flexDirection: 'row', gap: 18, alignItems: 'flex-start' }}><Text style={{ fontFamily: Fonts.body, fontSize: 12, lineHeight: 20, color: colors.muted }}>{key}</Text><Text selectable={key === 'Booking ID'} style={{ flex: 1, fontFamily: Fonts.bodySemiBold, fontSize: 13, lineHeight: 20, textAlign: 'right', color: key === 'Status' ? colors.primary : colors.dark }}>{value}</Text></View>)}
        </BookingFlowSection>
        {!confirmed && !cancelled ? <BookingFlowNotice title="What happens next?" message="Track provider approval and payment verification from My Bookings. A submitted request is not a confirmed seat." icon="notifications-outline"/> : null}
      </> : null}
      <View style={{ gap: 12 }}><Button title="View my bookings" onPress={() => router.replace('/(customer)/(tabs)/bookings')}/><Button title="Back home" variant="outline" onPress={() => router.replace('/(customer)/(tabs)')}/></View>
      {visible && trip ? <BookingFlowSection title={`Stay in ${trip.to}`} description="Explore places to stay near your destination." icon="bed-outline"><Button title="Browse hotels" variant="secondary" onPress={() => {
                const checkIn = trip.date;
                const out = new Date(checkIn);
                out.setDate(out.getDate() + 2);
                const hotels = useHotelStore.getState();
                hotels.setDestination(trip.to);
                hotels.setCheckIn(checkIn);
                hotels.setCheckOut(toISODate(out));
                router.push('/(customer)/hotels/results');
            }}/></BookingFlowSection> : null}
    </ScrollView>
  </View>;
}
export default withBookingFlow(BookingResultScreen);
