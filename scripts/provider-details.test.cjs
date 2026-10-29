const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.join(__dirname, '..', 'utils/providerDetails.ts');
const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  fileName: file,
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  },
}).outputText;
const mod = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${source}\n})`, {
  filename: file,
})(require, mod, mod.exports);
const { fleetDetails, tripFareGroups, publicWebsite } = mod.exports;

test('does not mix primary vehicle details with seats from a different trip vehicle', () => {
  const result = fleetDetails(
    {
      vehicleClass: 'car',
      vehicleModel: 'Corolla',
      registrationNumber: 'ABC-123',
    },
    [{ vehiclePlate: 'XYZ-999', vehicleCapacity: 18, totalSeats: 10 }],
  );
  assert.deepEqual(result.facts, [
    { label: 'Vehicle model', value: 'Corolla' },
    { label: 'Registration plate', value: 'ABC-123' },
  ]);
});
test('matches normalized registration plates and uses permanent capacity instead of trip inventory', () => {
  const result = fleetDetails(
    { vehicleClass: 'van', registrationNumber: 'ABC-123' },
    [
      {
        vehiclePlate: ' abc 123 ',
        vehicleCapacity: 14,
        totalSeats: 5,
        availableSeats: 2,
      },
    ],
  );
  assert.equal(
    result.facts.find((fact) => fact.label === 'Passenger capacity').value,
    '14 seats',
  );
});
test('does not treat an unknown registration as a match or invent capacity from trip seats', () => {
  assert.equal(
    fleetDetails({ vehicleModel: 'Hiace' }, [
      { vehicleCapacity: 18 },
    ]).facts.some((fact) => fact.label === 'Passenger capacity'),
    false,
  );
  assert.equal(
    fleetDetails(undefined, [{ vehiclePlate: 'A', totalSeats: 5 }]).facts.some(
      (fact) => fact.label === 'Passenger capacity',
    ),
    false,
  );
});
test('keeps seat fares, whole vehicle fares, and currencies separate', () => {
  assert.deepEqual(
    tripFareGroups([
      { price: 4500, currency: 'PKR', bookingMode: 'seat' },
      { price: 4000, currency: 'PKR', bookingMode: 'seat' },
      { price: 15000, currency: 'PKR', bookingMode: 'vehicle' },
      { price: 20, currency: 'USD', bookingMode: 'seat' },
      { price: NaN, currency: 'PKR' },
      { price: -5, currency: 'PKR' },
    ]),
    [
      { amount: 4000, currency: 'PKR', unit: 'seat' },
      { amount: 15000, currency: 'PKR', unit: 'vehicle' },
      { amount: 20, currency: 'USD', unit: 'seat' },
    ],
  );
});
test('normalizes business websites and refuses unsupported schemes or embedded credentials', () => {
  assert.equal(
    publicWebsite('example.com/contact'),
    'https://example.com/contact',
  );
  assert.equal(publicWebsite('https://example.com'), 'https://example.com/');
  for (const value of [
    '',
    'javascript:alert(1)',
    'mailto:a@example.com',
    'https://user:password@example.com',
    'https://',
  ])
    assert.equal(publicWebsite(value), undefined);
});
