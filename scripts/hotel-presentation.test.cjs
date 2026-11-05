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
const {
  hotelPlaceLine,
  hotelAbout,
  hotelMapUrl,
  hotelTimeLabel,
  hotelCancellationLabel,
  hotelStartingPrice,
} = load('utils/hotelPresentation.ts');
const { publicPhone, publicEmail } = load('utils/publicContact.ts');
const property = {
  id: 'property',
  name: 'Registered property',
  village: ' Karimabad ',
  district: 'Hunza',
  location: { city: 'hunza', address: 'Orchard Lane', latitude: 36.3167, longitude: 74.65 },
  description: '',
  managerName: 'Manager',
  yearsExperience: 5,
  priceFrom: 6500,
};

test('property place and About preserve registered facts without duplicating place names or inventing amenities', () => {
  assert.equal(hotelPlaceLine(property), 'Karimabad · Hunza');
  assert.equal(
    hotelAbout({ ...property, description: '  Supplied description.  ' }),
    'Supplied description.',
  );
  assert.equal(
    hotelAbout(property),
    'Registered property located in Karimabad · Hunza managed by Manager with 5+ years in hospitality.',
  );
});

test('maps use a valid registered URL, then real coordinates, then an address query rather than zero or invalid coordinates', () => {
  assert.equal(
    hotelMapUrl({ ...property, googleMapsUrl: 'https://maps.google.com/?q=Registered' }),
    'https://maps.google.com/?q=Registered',
  );
  assert.equal(
    new URL(hotelMapUrl({ ...property, googleMapsUrl: 'javascript:alert(1)' })).searchParams.get(
      'query',
    ),
    '36.3167,74.65',
  );
  for (const coordinates of [
    { latitude: 0, longitude: 0 },
    { latitude: 95, longitude: 74 },
    { latitude: NaN, longitude: 74 },
    { latitude: 36, longitude: 200 },
  ]) {
    const query = new URL(
      hotelMapUrl({ ...property, location: { ...property.location, ...coordinates } }),
    ).searchParams.get('query');
    assert.equal(query, 'Orchard Lane, Karimabad · Hunza, Registered property');
  }
});

test('check-in/out adds a 12-hour label only to valid registered 24-hour times', () => {
  assert.equal(hotelTimeLabel('14:00'), '14:00 (2:00 PM)');
  assert.equal(hotelTimeLabel('00:00'), '00:00 (12:00 AM)');
  assert.equal(hotelTimeLabel('12:30'), '12:30 (12:30 PM)');
  for (const value of ['', 'By arrangement', '24:00', '14:99'])
    assert.equal(hotelTimeLabel(value), value);
});

test('24-hour cancellation badge requires the flag and matching policy, and missing fares do not advertise a free stay', () => {
  assert.equal(
    hotelCancellationLabel({
      ...property,
      freeCancellation: true,
      cancellationPolicy: 'Free cancellation until 24 hours before arrival.',
    }),
    'Free cancellation (24h)',
  );
  assert.equal(
    hotelCancellationLabel({
      ...property,
      freeCancellation: true,
      cancellationPolicy: 'Free cancellation until 48 hours before arrival.',
    }),
    'Free cancellation',
  );
  assert.equal(
    hotelCancellationLabel({ ...property, freeCancellation: false, cancellationPolicy: '24h' }),
    undefined,
  );
  assert.equal(hotelStartingPrice(property), 6500);
  for (const priceFrom of [0, -10, NaN, Infinity])
    assert.equal(hotelStartingPrice({ ...property, priceFrom }), undefined);
});

test('public contact actions normalize a phone and encode an email without accepting header or dialer injection', () => {
  assert.equal(publicPhone('+92 (5813) 457-920'), '+925813457920');
  assert.equal(publicEmail(' stay@orchard.pk '), 'mailto:stay%40orchard.pk');
  for (const value of ['*123#', 'tel:03000001016', '1234'])
    assert.equal(publicPhone(value), undefined);
  for (const value of [
    'stay@orchard.pk?subject=Injected',
    'stay@orchard.pk\r\nBcc:private@example.test',
    'not-an-email',
  ])
    assert.equal(publicEmail(value), undefined);
});

test('explicit property refresh bypasses the detail cache while normal room-flow callers retain cached behavior', async () => {
  let requests = 0;
  const service = load('services/hotelService.ts', {
    '@/services/backendAvailability': { backendAvailability: { getEpoch: () => 0, registerReset: () => () => {} } },
    '@/services/api': { get: async () => ({ id: 'hotel', name: `Version ${++requests}` }) },
    '@/services/mappers': { mapHotel: (value) => value },
    '@/services/apiError': { ApiError: Error },
  });
  assert.equal((await service.getHotelById('hotel')).name, 'Version 1');
  assert.equal((await service.getHotelById('hotel')).name, 'Version 1');
  assert.equal(requests, 1);
  assert.equal((await service.getHotelById('hotel', { refresh: true })).name, 'Version 2');
  assert.equal((await service.getHotelById('hotel')).name, 'Version 2');
  assert.equal(requests, 2);
});
