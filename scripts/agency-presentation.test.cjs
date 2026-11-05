const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file) {
  const code = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`, { filename: file })(
    (name) => (name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const { agencyDepartures, agencyVehicle, agencyNetwork } = load('utils/agencyPresentation.ts');
const now = new Date('2026-10-30T09:00:00');
const trip = (overrides = {}) => ({
  id: 'trip',
  date: '2026-10-31',
  departureTime: '05:00',
  availableSeats: 4,
  price: 6500,
  status: 'scheduled',
  vehiclePlate: 'ABC-123',
  amenities: ['AC'],
  vehicleImages: ['https://example.invalid/vehicle.jpg'],
  image: '',
  ...overrides,
});

test('only future bookable departures are advertised, sorted without mutating input', () => {
  const trips = [
    trip({ id: 'later', date: '2026-11-02' }),
    trip({ id: 'sold-out', availableSeats: 0 }),
    trip({ id: 'cancelled', status: 'cancelled' }),
    trip({ id: 'completed', status: 'completed' }),
    trip({ id: 'past', date: '2026-10-29' }),
    trip({ id: 'earlier-today', date: '2026-10-30', departureTime: '08:00' }),
    trip({ id: 'invalid', date: 'invalid' }),
    trip({ id: 'next' }),
  ];
  assert.deepEqual(
    agencyDepartures(trips, now).map((row) => row.id),
    ['next', 'later'],
  );
  assert.equal(trips[0].id, 'later');
});
test('unrelated trip amenities and photos never describe the registered primary vehicle', () => {
  const vehicle = agencyVehicle(
    {
      vehicleClass: 'car',
      vehicleModel: 'Corolla',
      registrationNumber: 'OTHER-7',
      vehicleImageFront: 'https://example.invalid/primary.jpg',
    },
    [trip()],
  );
  assert.deepEqual(vehicle.photos, ['https://example.invalid/primary.jpg']);
  assert.deepEqual(vehicle.amenities, []);
  assert.equal(vehicle.linkedTrip, undefined);
});
test('invalid inventory/fares cannot become a reservation offer and ISO departures keep their timestamp', () => {
  const records = [
    trip({ id: 'invalid-seats', availableSeats: NaN }),
    trip({ id: 'invalid-fare', price: NaN }),
    trip({ id: 'negative', price: -1 }),
    trip({ id: 'iso', departureTime: '2026-10-31T06:00:00' }),
    trip({ id: 'free', price: 0 }),
  ];
  assert.deepEqual(
    agencyDepartures(records, now).map((row) => row.id),
    ['free', 'iso'],
  );
});
test('matching registration links actual amenities and filters the driver portrait from photos', () => {
  const photo = 'https://example.invalid/driver.jpg';
  const vehicle = agencyVehicle(
    {
      vehicleClass: 'van',
      registrationNumber: ' abc 123 ',
      driverPhoto: photo,
      vehicleImageFront: 'https://example.invalid/front.jpg',
    },
    [
      trip({
        amenities: ['AC', 'AC', 'WiFi'],
        vehicleImages: [photo + '?token=photo', 'https://example.invalid/interior.jpg'],
      }),
    ],
  );
  assert.deepEqual(vehicle.amenities, ['AC', 'WiFi']);
  assert.deepEqual(vehicle.photos, [
    'https://example.invalid/front.jpg',
    'https://example.invalid/interior.jpg',
  ]);
});
test('without a registered primary vehicle the listed trip supplies its own facts', () => {
  const row = trip({ vehicleName: 'Trip vehicle', vehicleCapacity: 14 });
  const vehicle = agencyVehicle(undefined, [row]);
  assert.equal(vehicle.linkedTrip, row);
  assert.deepEqual(vehicle.amenities, ['AC']);
  assert.ok(
    vehicle.facts.some((fact) => fact.label === 'Passenger capacity' && fact.value === '14 seats'),
  );
});
test('service network deduplicates registered and live route labels without inventing frequency', () => {
  assert.deepEqual(
    agencyNetwork(
      [{ from: 'Islamabad', to: 'Hunza' }],
      ['Islamabad → Hunza', '  Skardu → Gilgit  ', ''],
    ),
    ['Islamabad → Hunza', 'Skardu → Gilgit'],
  );
  assert.deepEqual(agencyNetwork([], []), []);
});
