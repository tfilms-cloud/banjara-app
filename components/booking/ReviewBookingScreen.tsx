import { router } from 'expo-router';
import { KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { PriceCard } from '@/components/booking/PriceCard';
import { BookingFlowFooter, BookingFlowHeader, BookingFlowNotice, BookingFlowSection, BookingJourneyCard, useBookingColors, withBookingFlow } from '@/components/booking/BookingFlowPresentation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useBookingStore } from '@/store/bookingStore';
import { safeBack } from '@/utils/navigation';
function BookingReviewScreen() {
    const colors = useBookingColors();
    const { selectedTrip: trip, selectedPickup: pickup, selectedSeats: seats, passengerDetails, setPassengerDetails, priceBreakdown } = useBookingStore();
    const back = () => safeBack(trip ? `/(customer)/seat/${trip.id}` : '/(customer)/(tabs)');
    return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <BookingFlowHeader title="Review booking" subtitle="A final look before you choose how to pay." step={3} onBack={back}/>
    <ScrollView keyboardShouldPersistTaps="handled" automaticallyAdjustKeyboardInsets showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingBottom: 24, gap: 20 }}>
      {!trip || !pickup || !priceBreakdown ? <BookingFlowNotice title="Your journey selection is unavailable" message="Choose a trip, pickup point, and seats to continue. If the connection was interrupted, return to the trip and try again."/> : <>
        <BookingJourneyCard trip={trip} pickup={pickup} seats={seats} onEdit={back}/>
        <BookingFlowSection title="Passenger information" description="Details your provider can use to contact you." icon="person-outline">
          <Input label="Full name" leftIcon="person-outline" value={passengerDetails.name} onChangeText={name => setPassengerDetails({ name })} autoComplete="name" textContentType="name" placeholder="Passenger’s full name"/>
          <Input label="Email" leftIcon="mail-outline" value={passengerDetails.email} onChangeText={email => setPassengerDetails({ email })} autoCapitalize="none" keyboardType="email-address" autoComplete="email" placeholder="you@example.com"/>
          <Input label="Phone" leftIcon="call-outline" value={passengerDetails.phone} onChangeText={phone => setPassengerDetails({ phone })} keyboardType="phone-pad" autoComplete="tel" placeholder="Your contact number"/>
        </BookingFlowSection>
        <PriceCard breakdown={priceBreakdown}/>
        <BookingFlowNotice title="Check your details" message="Confirm your route, date, pickup, and passenger information. Your provider will review the booking request after submission." icon="checkmark-circle-outline"/>
      </>}
    </ScrollView>
    <BookingFlowFooter><Button title="Continue to payment" disabled={!trip || !pickup || !priceBreakdown || !seats.length} onPress={() => router.push('/(customer)/booking/payment')}/></BookingFlowFooter>
  </KeyboardAvoidingView>;
}
export default withBookingFlow(BookingReviewScreen);
