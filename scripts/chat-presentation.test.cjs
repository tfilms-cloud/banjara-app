const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = 'utils/chatPresentation.ts';
const source = ts.transpileModule(fs.readFileSync(path.join(__dirname, '..', file), 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const loaded = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
  require,
  loaded,
  loaded.exports,
);
const { conversationRole, filterConversations, chatBookingContext } = loaded.exports;
const conversations = [
  {
    otherUserName: 'Mountain Transfers',
    otherUserRole: 'provider',
    lastMessage: 'Pickup confirmed',
    unreadCount: 2,
    bookingId: 'booking-123',
  },
  {
    otherUserName: 'Local Guide',
    otherUserRole: 'travelGuide',
    lastMessage: 'Weather update',
    unreadCount: 0,
  },
  {
    otherUserName: 'Valley Inn',
    otherUserRole: 'host',
    lastMessage: 'Your room is ready',
    unreadCount: 1,
  },
  {
    otherUserName: 'Travel Friend',
    otherUserRole: 'customer',
    lastMessage: 'Meet at the terminal',
    unreadCount: 0,
  },
  {
    otherUserName: 'Support',
    otherUserRole: 'admin',
    lastMessage: 'How can we help?',
    unreadCount: 0,
  },
];

test('role badges use account roles without guessing from names', () => {
  assert.equal(conversationRole('travelGuide'), 'Guide');
  assert.equal(conversationRole('hotelHost'), 'Host');
  assert.equal(conversationRole('agency'), 'Provider');
  assert.equal(conversationRole('admin'), 'Admin');
  assert.equal(conversationRole(undefined), 'Traveler');
  assert.equal(
    filterConversations([{ ...conversations[1], otherUserRole: 'customer' }], '', 'guides').length,
    0,
  );
});

test('unread and provider filters preserve order and exclude unrelated roles', () => {
  assert.deepEqual(filterConversations(conversations, '', 'unread'), [
    conversations[0],
    conversations[2],
  ]);
  assert.deepEqual(filterConversations(conversations, '', 'providers'), conversations.slice(0, 3));
  assert.deepEqual(filterConversations(conversations, '', 'guides'), [conversations[1]]);
});

test('search combines with filters and matches name, preview, role or linked booking', () => {
  assert.deepEqual(filterConversations(conversations, ' PICKUP ', 'unread'), [conversations[0]]);
  assert.deepEqual(filterConversations(conversations, 'booking-123', 'all'), [conversations[0]]);
  assert.deepEqual(filterConversations(conversations, 'Guide', 'providers'), [conversations[1]]);
  assert.deepEqual(filterConversations(conversations, 'terminal', 'unread'), []);
  assert.deepEqual(filterConversations(conversations, '', 'all'), conversations);
});

const booking = {
  id: 'booking-123',
  providerUserId: 'provider-1',
  bookingType: 'transport',
  bookingNumber: 'BJ-234',
  tripOrigin: 'Islamabad',
  tripDestination: 'Hunza',
  seats: ['4', '5'],
  bookingStatus: 'confirmed',
  paymentStatus: 'paid',
  tripDate: '2026-11-01',
  tripDepartureTime: '05:00',
};

test('linked transport context retains the real route, seats and ticket eligibility', () => {
  const context = chatBookingContext(booking, 'provider-1');
  assert.equal(context.title, 'Islamabad → Hunza');
  assert.deepEqual(context.seats, ['4', '5']);
  assert.equal(context.code, 'BJ-234');
  assert.equal(context.ticketHref, '/(customer)/ticket/booking-123');
  assert.equal(context.detailHref, '/(customer)/booking-details/booking-123');
});

test('pending, cancelled and unpaid records show details without a ready ticket action', () => {
  for (const overrides of [
    { bookingStatus: 'pending' },
    { bookingStatus: 'cancelled' },
    { paymentStatus: 'unpaid' },
  ]) {
    assert.equal(
      chatBookingContext({ ...booking, ...overrides }, 'provider-1').ticketHref,
      undefined,
    );
  }
});

test('unrelated or unknown records cannot become a chat booking banner', () => {
  assert.equal(chatBookingContext(booking, 'another-provider'), null);
  assert.equal(chatBookingContext({ ...booking, bookingType: 'unknown' }, 'provider-1'), null);
  assert.equal(chatBookingContext({ bookingType: 'transport' }, 'provider-1'), null);
});

test('stay and guide contexts use their existing booking destinations', () => {
  const hotel = chatBookingContext(
    { id: 'stay-1', bookingType: 'hotel', hotelName: 'Valley Inn', checkIn: '2026-11-01' },
    'host-1',
  );
  assert.equal(hotel.title, 'Valley Inn');
  assert.equal(hotel.detailHref, '/(customer)/hotels/booking-details/stay-1');
  assert.equal(hotel.ticketHref, undefined);
  const guide = chatBookingContext({ id: 'guide-1', bookingType: 'guide' }, 'guide-user');
  assert.equal(guide.title, 'Guide booking');
  assert.equal(guide.detailHref, '/(customer)/(tabs)/bookings');
});
