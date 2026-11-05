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
const {
  guideServices,
  guidePhotos,
  guideFareSummary,
  guideServiceBookable,
  guideServiceKey,
  guideServiceForBooking,
} = load('utils/guidePresentation.ts');
const service = (change = {}) => ({
  id: 'daily',
  name: 'Walking tour',
  active: true,
  price: 6500,
  currency: 'PKR',
  pricingType: 'per_day',
  minGuests: 1,
  maxGuests: 8,
  ...change,
});

test('minimum guide fares keep currency and hourly/day/group/person units separate', () => {
  const records = [service(), service({ id: 'cheaper', price: 5000 })];
  assert.deepEqual(guideFareSummary(records), {
    kind: 'price',
    amount: 5000,
    currency: 'PKR',
    unit: 'per day',
  });
  assert.equal(guideFareSummary([...records, service({ pricingType: 'per_group' })]).kind, 'mixed');
  assert.equal(guideFareSummary([...records, service({ currency: 'USD' })]).kind, 'mixed');
  assert.equal(guideFareSummary([service({ price: 0 })]).kind, 'unavailable');
  assert.equal(records[0].price, 6500);
});

test('only active valid positive-price guide services can be selected for the existing checkout', () => {
  assert.equal(guideServiceBookable(service()), true);
  for (const change of [
    { active: false },
    { price: 0 },
    { price: -1 },
    { price: NaN },
    { maxGuests: 0 },
    { minGuests: 9 },
    { maxGuests: Infinity },
  ]) {
    assert.equal(guideServiceBookable(service(change)), false);
  }
});

test('selected service survives profile-to-booking navigation and unavailable selections fall back safely', () => {
  const first = service();
  const second = service({
    id: 'second',
    name: 'Trekking',
    price: 9000,
    pricingType: 'per_group',
    minGuests: 3,
  });
  assert.equal(guideServiceForBooking([first, second], guideServiceKey(second)), second);
  assert.equal(
    guideServiceForBooking([first, { ...second, active: false }], guideServiceKey(second)),
    first,
  );
  assert.equal(guideServiceForBooking([first], 'unknown'), first);
  assert.equal(guideServiceForBooking([service({ price: NaN })]), undefined);
  assert.notEqual(
    guideServiceKey(service({ id: '', pricingType: 'per_day' })),
    guideServiceKey(service({ id: '', pricingType: 'per_hour' })),
  );
});

test('legacy daily rates remain bookable without inventing new service prices or private fields', () => {
  const legacy = guideServices({
    description: '',
    guideDetails: { dailyHireRate: 7000, areasCovered: ['Hunza'] },
  });
  assert.equal(legacy.length, 1);
  assert.equal(legacy[0].price, 7000);
  assert.equal(legacy[0].pricingType, 'per_day');
  assert.deepEqual(legacy[0].availableLocations, ['Hunza']);
  assert.equal(guideServices({ guideDetails: { dailyHireRate: NaN } }).length, 0);
  assert.equal(
    guideServices({ guideDetails: { services: [service()] }, tour: { price: 99999 } })[0].price,
    6500,
  );
});

test('guide scenes lead the hero, portraits stay distinct, and document media is never collected', () => {
  const photo = 'https://example.test/guide.jpg';
  const scene = 'https://example.test/mountain%20walk.jpg';
  const photos = guidePhotos({
    logo: photo,
    guideDetails: {
      profilePhoto: photo,
      photos: [
        { url: ' https://example.test/mountain walk.jpg ', category: 'action' },
        { url: photo, category: 'profile' },
      ],
      cnicFrontUrl: 'https://example.test/private-cnic.jpg',
      documents: [{ fileUrl: 'https://example.test/private-license.jpg' }],
    },
    galleryImages: ['https://example.test/unrelated-fleet.jpg'],
  });
  assert.deepEqual(photos.hero, [scene, photo]);
  assert.deepEqual(photos.field, [scene]);
  assert.equal(photos.portrait, photo);
  assert.deepEqual(guidePhotos({}).hero, []);
});
