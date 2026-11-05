const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
function load(file) {
  const source = ts.transpileModule(fs.readFileSync(path.join(root, file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, { filename: file })(
    (name) => (name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name)),
    module,
    module.exports,
  );
  return module.exports;
}
const { exploreVehicleClass, exploreVehicles, exploreVehicleFilters } = load(
  'utils/exploreTransport.ts',
);
const { mapTrip } = load('services/mappers.ts');

test('trip mapping retains the registered class before legacy type conversion', () => {
  const mapped = mapTrip({
    _id: 'trip-1',
    vehicleId: {
      _id: 'vehicle-1',
      type: 'suv',
      name: 'Provider vehicle',
      verificationDetails: { vehicleClass: 'jeep' },
    },
  });
  assert.equal(mapped.vehicleType, 'van');
  assert.equal(mapped.vehicleCategory, 'jeep');
  assert.equal(exploreVehicleClass(mapped), 'jeep');
  const fallback = mapTrip({
    _id: 'trip-2',
    vehicleId: { _id: 'vehicle-2', type: 'minibus', verificationDetails: {} },
  });
  assert.equal(fallback.vehicleCategory, 'minibus');
  assert.equal(exploreVehicleClass(fallback), 'mini_bus');
});

function trip(overrides = {}) {
  return {
    id: 'trip-1',
    vehicleId: 'vehicle-1',
    agencyId: 'agency-1',
    vehicleType: 'van',
    vehicleName: 'Toyota Hiace',
    availableSeats: 8,
    price: 7000,
    status: 'scheduled',
    ...overrides,
  };
}

test('provider-selected class takes precedence over display name and legacy customer type', () => {
  assert.equal(
    exploreVehicleClass(trip({ vehicleName: 'Coaster', vehicleCategory: 'suv' })),
    'suv',
  );
  assert.equal(
    exploreVehicleClass(
      trip({ vehicleName: 'Prado', vehicleCategory: 'jeep', vehicleType: 'van' }),
    ),
    'jeep',
  );
  assert.equal(
    exploreVehicleClass(trip({ vehicleName: 'Coaster', vehicleCategory: 'minibus' })),
    'mini_bus',
  );
  assert.equal(
    exploreVehicleClass(trip({ vehicleName: '4x4 Jeep', vehicleCategory: 'car' })),
    'car',
  );
});

test('filter choices come from available provider vehicle classes, with no placeholder models', () => {
  const filters = exploreVehicleFilters([
    trip({ vehicleCategory: 'suv' }),
    trip({ vehicleCategory: 'car', vehicleId: 'car-1' }),
    trip({ vehicleCategory: 'bus', availableSeats: 0 }),
    trip({ vehicleCategory: 'jeep', status: 'cancelled' }),
  ]);
  assert.deepEqual(filters, [
    { id: 'all', label: 'All' },
    { id: 'car', label: 'Car' },
    { id: 'suv', label: 'SUV' },
  ]);
});

test('empty inventory keeps All and legacy trip types remain usable', () => {
  assert.deepEqual(exploreVehicleFilters([]), [{ id: 'all', label: 'All' }]);
  assert.equal(exploreVehicleClass(trip()), 'van');
  assert.equal(exploreVehicleClass(trip({ vehicleType: 'private' })), 'car');
  assert.equal(exploreVehicleClass(trip({ vehicleCategory: 'other' })), 'other');
});

test('one vehicle uses the lowest available fare without merging different agencies', () => {
  const result = exploreVehicles(
    [
      trip({ id: 'expensive', price: 9000 }),
      trip({ id: 'lowest', price: 6500 }),
      trip({ id: 'other-provider', agencyId: 'agency-2', price: 4000 }),
    ],
    'all',
  );
  assert.deepEqual(
    result.map((item) => item.id),
    ['lowest', 'other-provider'],
  );
});

test('sold-out, cancelled and completed departures never become advertised vehicles', () => {
  const result = exploreVehicles(
    [
      trip({ id: 'sold-out', availableSeats: 0, price: 1 }),
      trip({ id: 'cancelled', status: 'cancelled', price: 2 }),
      trip({ id: 'completed', status: 'completed', price: 3 }),
      trip({ id: 'available' }),
    ],
    'all',
  );
  assert.deepEqual(
    result.map((item) => item.id),
    ['available'],
  );
});

test('filters retain vehicle identity and omit other vehicle classes', () => {
  const result = exploreVehicles(
    [
      trip(),
      trip({ id: 'jeep', vehicleId: 'jeep-1', vehicleName: 'Prado', vehicleCategory: 'jeep' }),
      trip({ id: 'other-hiace', vehicleId: 'vehicle-2' }),
    ],
    'van',
  );
  assert.deepEqual(
    result.map((item) => item.id),
    ['trip-1', 'other-hiace'],
  );
});
