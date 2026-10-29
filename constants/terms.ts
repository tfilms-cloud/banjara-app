export type TermsRole =
  | 'customer'
  | 'transporter'
  | 'hotel'
  | 'tour'
  | 'guide'
  | 'restaurant';

export const TERMS_ROLES: Array<{ id: TermsRole; label: string }> = [
  { id: 'customer', label: 'Customers' },
  { id: 'transporter', label: 'Transportation' },
  { id: 'hotel', label: 'Lodging' },
  { id: 'tour', label: 'Tour operators' },
  { id: 'guide', label: 'Guides' },
  { id: 'restaurant', label: 'Restaurants' },
];

const INTRO =
  'These Terms & Conditions (“Terms”) govern use of the BANJARA mobile application and related services. By creating an account or completing a booking you agree to these Terms.';

export const TERMS_CONTENT: Record<
  TermsRole,
  { title: string; updated: string; sections: Array<{ heading: string; body: string }> }
> = {
  customer: {
    title: 'Customer Terms & Conditions',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Account & verification',
        body: `${INTRO} Customers must verify with a valid mobile phone number. You are responsible for keeping your OTP and device secure.`,
      },
      {
        heading: '2. Bookings',
        body: 'Bookings for transport, lodging, tours, guides, and restaurants are subject to provider confirmation and availability. Prices shown at checkout are final unless a provider quotes a revised rate you accept.',
      },
      {
        heading: '3. Payments',
        body: 'You may pay by card, JazzCash, Easypaisa, or cash/pay later where offered. Wallet and card payments are processed by licensed partners. Cash remits are settled between you and the provider under BANJARA rules.',
      },
      {
        heading: '4. Live location',
        body: 'When a booking is confirmed, you may share live location with the relevant provider (hotel, tour operator, guide, restaurant) to assist pickup or arrival. You can stop sharing at any time from the booking screen.',
      },
      {
        heading: '5. Cancellations',
        body: 'Cancellation and refund rules follow the listing and provider policy shown before payment. BANJARA may mediate disputes in good faith but is not a party to the underlying service.',
      },
    ],
  },
  transporter: {
    title: 'Transportation Provider Terms',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Eligibility',
        body: `${INTRO} Transporters (including car rental) must hold valid vehicle registration, driving credentials, and mandatory insurance. Uninsured vehicles are rejected.`,
      },
      {
        heading: '2. Trips & availability',
        body: 'You must keep seat availability and trip schedules accurate. Cash collected from customers must be remitted to BANJARA within the stated cash limit. Exceeding the limit suspends trip generation and customer visibility.',
      },
      {
        heading: '3. Live vehicle location',
        body: 'For confirmed bookings you agree to share live vehicle location with the customer during the trip window so they can track pickup and journey progress.',
      },
      {
        heading: '4. Conduct & safety',
        body: 'Drivers must follow traffic laws, treat passengers respectfully, and maintain vehicle fitness. BANJARA may suspend accounts after verified safety or fraud complaints.',
      },
    ],
  },
  hotel: {
    title: 'Lodging Provider Terms',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Property registration',
        body: `${INTRO} Lodging providers (hotels, guest houses, lodges, hostels) must hold valid business registration. Unregistered properties are rejected.`,
      },
      {
        heading: '2. Occupancy & check-in',
        body: 'Room inventory, rates, and availability must stay accurate. Check-in data you collect (name, CNIC, phone, rooms, nights, guests) must match the guest present and may be shown to the customer for verification.',
      },
      {
        heading: '3. Guest location',
        body: 'When a stay is confirmed, guests may share live location with you to assist arrival. Use location only for that booking and delete or stop tracking after check-in.',
      },
      {
        heading: '4. Remittance',
        body: 'Cash collected through BANJARA bookings must be topped up to the BANJARA account within the cash remit limit.',
      },
    ],
  },
  tour: {
    title: 'Tour Operator Terms',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Packages',
        body: `${INTRO} Tour operators must describe itineraries, inclusions, difficulty, and safety requirements truthfully.`,
      },
      {
        heading: '2. Location sharing',
        body: 'For confirmed tours you may receive the customer’s live location for rendezvous. You must not retain tracking after the meetup or tour day ends.',
      },
      {
        heading: '3. Safety',
        body: 'Operators are responsible for permits, guides, and emergency readiness for advertised activities.',
      },
    ],
  },
  guide: {
    title: 'Guide Terms',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Hosting',
        body: `${INTRO} Guides must provide accurate languages, gender listing where applicable, and local expertise.`,
      },
      {
        heading: '2. Location',
        body: 'Confirmed bookings may include customer live location for meetup. Use it only to complete the guided service.',
      },
      {
        heading: '3. Conduct',
        body: 'Guides must follow local regulations and BANJARA community standards. Harassment or misrepresentation leads to removal.',
      },
    ],
  },
  restaurant: {
    title: 'Restaurant Terms',
    updated: '28 Sep 2026',
    sections: [
      {
        heading: '1. Listings',
        body: `${INTRO} Restaurants must keep menus, hours, and location accurate.`,
      },
      {
        heading: '2. Arrivals',
        body: 'When a reservation or order is confirmed, customers may share live location for table readiness or delivery coordination.',
      },
      {
        heading: '3. Hygiene & compliance',
        body: 'Food safety and licensing remain the restaurant’s responsibility. BANJARA may remove non-compliant listings.',
      },
    ],
  },
};
