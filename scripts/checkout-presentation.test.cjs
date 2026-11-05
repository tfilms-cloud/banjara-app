const { test } = require('node:test');
const assert = require('node:assert/strict');
const { createCheckoutHarness } = require('./helpers/checkout-render.cjs');

const screens = [
  ['app/(customer)/pickup/[id].tsx', 'Choose pickup'],
  ['app/(customer)/seat/[id].tsx', 'Select your seats'],
  ['app/(customer)/booking/review.tsx', 'Review booking'],
  ['app/(customer)/booking/payment.tsx', 'Choose payment method'],
  ['app/(customer)/payments/[paymentId].tsx', 'Complete payment'],
  ['app/(customer)/payments/proof/[paymentId].tsx', 'Upload payment proof'],
  ['app/(customer)/booking/success.tsx', 'Request submitted'],
];

test('all seven booking and payment screens render with real feature components in light and dark appearance', () => {
  for (const dark of [false,true]) {
    const harness = createCheckoutHarness({dark});
    for (const [file,title] of screens) {
      const html=harness.render(file);
      assert.ok(html.includes(title),file+' title');
      assert.ok(html.includes('YOUR JOURNEY, YOUR WAY'),file+' shared header');
      assert.ok(html.includes(dark?'#101C21':'#FFFFFF'),file+' background');
    }
  }
});

test('pickup selection and seat buttons keep the booking handoff while unavailable seats stay disabled', () => {
  const h=createCheckoutHarness();
  h.render(screens[0][0]);
  const pickup=h.events.find(e=>e.label?.startsWith('G-9 Markaz'));
  pickup.onPress();
  assert.equal(h.state.selectedPickup.id,'pickup2');
  h.events.find(e=>e.label==='Continue to seats').onPress();
  assert.equal(h.navigation.at(-1),'/(customer)/seat/trip1');
  h.render(screens[1][0]);
  assert.equal(h.events.find(e=>e.label==='Seat 6, booked').disabled,true);
  assert.equal(h.events.find(e=>e.label==='Seat 9, unavailable').disabled,true);
  h.events.find(e=>e.label==='Seat 1, available').onPress();
  assert.ok(h.state.selectedSeats.includes('1'));
  h.events.find(e=>e.label==='Review booking').onPress();
  assert.equal(h.navigation.at(-1),'/(customer)/booking/review');
  h.render(screens[2][0]);
  h.events.find(e=>e.label==='Continue to payment').onPress();
  assert.equal(h.navigation.at(-1),'/(customer)/booking/payment');
});

test('missing seat data and missing provider methods cannot advance using stale local selections', () => {
  const h=createCheckoutHarness({noLayout:true});
  h.render(screens[1][0]);
  assert.ok(!h.events.some(e=>e.label==='Review booking'&&!e.disabled));
  const payment=createCheckoutHarness({noMethods:true});
  payment.render(screens[3][0]);
  assert.equal(payment.events.find(e=>e.label==='Continue to pay').disabled,true);
});

test('offline screens retain their UI while masking booking, fare and receiving-account records', () => {
  const h=createCheckoutHarness({offline:true});
  const pickup=h.render(screens[0][0]);
  assert.ok(pickup.includes('Choose pickup'));
  assert.ok(!pickup.includes('Faizabad Terminal'));
  assert.equal(h.events.find(e=>e.label==='Continue to seats').disabled,true);
  h.render(screens[2][0]);
  assert.equal(h.events.find(e=>e.label==='Continue to payment').disabled,true);
  const instructions=h.render(screens[4][0]);
  assert.ok(!instructions.includes('TEST-ACCOUNT'));
  assert.ok(!instructions.includes('BNJ-PREVIEW'));
  const result=h.render(screens[6][0]);
  assert.ok(result.includes('Booking details unavailable'));
  assert.ok(!result.includes('Request submitted'));
  assert.ok(!result.includes('BNJ-PREVIEW'));
});

test('the result screen distinguishes a pending request from an approved booking', () => {
  assert.ok(createCheckoutHarness().render(screens[6][0]).includes('Awaiting provider approval'));
  const confirmed=createCheckoutHarness({bookingStatus:'confirmed'}).render(screens[6][0]);
  assert.ok(confirmed.includes('Your booking is confirmed'));
  assert.ok(!confirmed.includes('Awaiting provider approval'));
});
