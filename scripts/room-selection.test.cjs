const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file, mocks = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(
    (name) =>
      mocks[name] ?? (name.startsWith('@/') ? load(`${name.slice(2)}.ts`, mocks) : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const { reconcileRoomSelection, roomInventory, roomSummary } = load('utils/hotelRoomSelection.ts');
const hotel = { id: 'hotel', name: 'Registered property' };
const room = {
  id: 'room',
  hotelId: 'hotel',
  name: 'Deluxe room',
  availableRooms: 5,
  pricePerNight: 6500,
  capacity: 2,
  roomType: 'deluxe_suite',
  bedType: 'King bed',
  sizeSqm: 38,
};
const flush = () => new Promise((resolve) => setImmediate(resolve));
function setup() {
  const pending = [];
  const { useHotelStore } = load('store/hotelStore.ts', {
    '@react-native-async-storage/async-storage': { default: {} },
    'zustand/middleware': {
      persist: (initializer) => initializer,
      createJSONStorage: () => undefined,
    },
    '@/services/hotelService': {
      getHotelQuote: (input) =>
        new Promise((resolve, reject) => pending.push({ input, resolve, reject })),
    },
  });
  return { store: useHotelStore, pending };
}

test('fresh inventory retains only this property’s available room and clamps the selected quantity', () => {
  const fresh = { ...room, availableRooms: 2 };
  assert.equal(reconcileRoomSelection('hotel', [fresh], room, 5).room, fresh);
  assert.equal(reconcileRoomSelection('hotel', [fresh], room, 5).quantity, 2);
  for (const rooms of [[], [{ ...fresh, availableRooms: 0 }], [{ ...fresh, hotelId: 'other' }]]) {
    assert.equal(reconcileRoomSelection('hotel', rooms, room, 2).room, null);
  }
  assert.equal(reconcileRoomSelection('hotel', [fresh], null, 2).room, null);
  assert.equal(roomInventory({ ...room, availableRooms: NaN }), 0);
  assert.equal(roomInventory({ ...room, availableRooms: 2.8 }), 2);
  assert.equal(roomSummary(room), 'deluxe suite · King bed · Up to 2 guests · 38 m²');
});

test('returning from room details preserves the selected room and quantity across list initialization', async () => {
  const { store, pending } = setup();
  store.getState().setRoom(room);
  assert.equal(pending.length, 0);
  store.getState().syncHotelRooms(hotel, [room]);
  assert.equal(store.getState().selectedRoom.id, room.id);
  assert.equal(store.getState().selectedHotel.id, hotel.id);
  pending[0].resolve({ subtotal: 19500 });
  await flush();
  store.getState().setRoomQuantity(3);
  pending[1].resolve({ subtotal: 58500 });
  await flush();
  store.getState().setHotel(hotel);
  assert.equal(store.getState().roomQuantity, 3);
  assert.equal(store.getState().selectedRoom.id, room.id);
  store.getState().syncHotelRooms(hotel, [{ ...room, availableRooms: 2 }]);
  assert.equal(store.getState().roomQuantity, 2);
});

test('out-of-order quotes cannot overwrite the latest room quantity or enable a stale total', async () => {
  const { store, pending } = setup();
  store.getState().setHotel(hotel);
  store.getState().setRoom(room);
  store.getState().setRoomQuantity(2);
  assert.equal(store.getState().priceLoading, true);
  assert.equal(store.getState().priceBreakdown, null);
  pending[1].resolve({ subtotal: 39000 });
  await flush();
  assert.equal(store.getState().priceBreakdown.roomSubtotal, 39000);
  assert.equal(store.getState().priceBreakdown.rooms, 2);
  pending[0].resolve({ subtotal: 19500 });
  await flush();
  assert.equal(store.getState().priceBreakdown.roomSubtotal, 39000);
  assert.equal(store.getState().priceLoading, false);
});

test('sold-out selections are disabled and a refresh invalidates both selection and an outstanding quote', async () => {
  const { store, pending } = setup();
  store.getState().setHotel(hotel);
  store.getState().setRoom({ ...room, availableRooms: 0 });
  assert.equal(store.getState().selectedRoom, null);
  store.getState().setRoom(room);
  store.getState().syncHotelRooms(hotel, [{ ...room, availableRooms: 0 }]);
  pending[0].resolve({ subtotal: 19500 });
  await flush();
  assert.equal(store.getState().selectedRoom, null);
  assert.equal(store.getState().priceBreakdown, null);
  assert.equal(store.getState().priceLoading, false);
});

test('property changes and flow resets prevent old quotes from restoring another stay’s total', async () => {
  const { store, pending } = setup();
  store.getState().setHotel(hotel);
  store.getState().setRoom(room);
  store.getState().setHotel({ id: 'other' });
  pending[0].resolve({ subtotal: 19500 });
  await flush();
  assert.equal(store.getState().selectedRoom, null);
  assert.equal(store.getState().priceBreakdown, null);
  store.getState().setHotel(hotel);
  store.getState().setRoom(room);
  store.getState().resetHotelFlow();
  pending[1].resolve({ subtotal: 19500 });
  await flush();
  assert.equal(store.getState().priceBreakdown, null);
});

test('the existing local fallback is marked as an estimate and uses the current room and quantity', async () => {
  const { store, pending } = setup();
  store.getState().setHotel(hotel);
  store.getState().setRoom(room);
  pending[0].reject(new Error('Network unavailable'));
  await flush();
  assert.equal(store.getState().priceEstimated, true);
  assert.equal(store.getState().priceLoading, false);
  assert.equal(store.getState().priceBreakdown.pricePerNight, 6500);
  assert.equal(store.getState().priceBreakdown.rooms, 1);
});

test('payment method selection keeps the existing checkout summary and confirming the same method does not clear its total', async () => {
  const { store, pending } = setup();
  store.getState().setHotel(hotel);
  store.getState().setRoom(room);
  pending[0].resolve({ subtotal: 19500 });
  await flush();
  const original = store.getState().priceBreakdown;
  store.getState().setPaymentMethod('bankTransfer');
  assert.equal(store.getState().priceBreakdown, original);
  assert.equal(store.getState().priceLoading, true);
  pending[1].resolve({ subtotal: 19500 });
  await flush();
  const settled = store.getState().priceBreakdown;
  store.getState().setPaymentMethod('bankTransfer');
  assert.equal(store.getState().priceBreakdown, settled);
  assert.equal(store.getState().priceLoading, false);
  assert.equal(pending.length, 2);
});
