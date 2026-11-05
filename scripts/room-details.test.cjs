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
const { roomTypeLabel, roomSizeLabel, roomCancellationLabel, roomAbout, canSelectRoom } =
  load('utils/roomDetails.ts');
const room = {
  id: 'room',
  hotelId: 'actual-property',
  name: 'Registered room',
  bedType: 'King bed',
  roomType: 'deluxe_suite',
  capacity: 2,
  sizeSqm: 38,
  availableRooms: 3,
  pricePerNight: 8500,
  freeCancellation: true,
  cancellationPolicy: 'Free cancellation up to 24 hours before arrival.',
  description: '',
};

test('room specifications retain registered values and convert area without advertising missing facts', () => {
  assert.equal(roomTypeLabel(room), 'Deluxe Suite');
  assert.equal(roomSizeLabel(room), '38 m² (409 sq ft)');
  assert.equal(roomTypeLabel({ ...room, roomType: undefined }), 'Not provided');
  for (const sizeSqm of [0, -10, NaN, Infinity])
    assert.equal(roomSizeLabel({ ...room, sizeSqm }), 'Not provided');
});
test('24-hour cancellation requires this room’s actual policy and cancellation flag', () => {
  assert.equal(roomCancellationLabel(room), 'Free cancellation (24h)');
  assert.equal(
    roomCancellationLabel({ ...room, cancellationPolicy: 'Free cancellation up to 48 hours.' }),
    'Free cancellation',
  );
  assert.equal(
    roomCancellationLabel({ ...room, cancellationPolicy: undefined }),
    'Free cancellation',
  );
  assert.equal(roomCancellationLabel({ ...room, freeCancellation: false }), undefined);
});
test('About preserves the full provider copy and fallback uses only supplied room facts', () => {
  assert.equal(
    roomAbout({ ...room, description: '  Registered full room description.  ' }),
    'Registered full room description.',
  );
  assert.equal(roomAbout(room), 'A room with King bed for up to 2 guests with 38 m² of space.');
  assert.equal(roomAbout({ ...room, bedType: '', capacity: 0, sizeSqm: 0 }), 'A guest room.');
});
test('selection requires real property identity, positive inventory and a valid nightly price', () => {
  assert.equal(canSelectRoom(room), true);
  for (const update of [
    { hotelId: '' },
    { availableRooms: 0 },
    { availableRooms: NaN },
    { pricePerNight: 0 },
    { pricePerNight: -5 },
    { pricePerNight: Infinity },
  ]) {
    assert.equal(canSelectRoom({ ...room, ...update }), false);
  }
});
test('room Retry bypasses positive and negative caches while normal callers keep cache and in-flight deduplication', async () => {
  let requests = 0;
  let resolve;
  const service = load('services/hotelService.ts', {
    '@/services/backendAvailability': { backendAvailability: { getEpoch: () => 0, registerReset: () => () => {} } },
    '@/services/api': {
      get: () => {
        requests++;
        return new Promise((done) => {
          resolve = done;
        });
      },
    },
    '@/services/mappers': { mapHotelRoom: (value) => value },
    '@/services/apiError': { ApiError: Error },
  });
  const first = service.getRoomById('room');
  const second = service.getRoomById('room');
  assert.equal(requests, 1);
  resolve({ ...room, name: 'Version 1' });
  assert.equal((await first).name, 'Version 1');
  assert.equal((await second).name, 'Version 1');
  assert.equal((await service.getRoomById('room')).name, 'Version 1');
  const refreshed = service.getRoomById('room', { refresh: true });
  assert.equal(requests, 2);
  resolve({ ...room, name: 'Version 2' });
  assert.equal((await refreshed).name, 'Version 2');
  const missing = service.getRoomById('missing');
  resolve(null);
  assert.equal(await missing, null);
  assert.equal(await service.getRoomById('missing'), null);
  assert.equal(requests, 3);
  const retry = service.getRoomById('missing', { refresh: true });
  assert.equal(requests, 4);
  resolve({ ...room, id: 'missing' });
  assert.equal((await retry).id, 'missing');
});
