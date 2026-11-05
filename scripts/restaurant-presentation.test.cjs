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
const { restaurantPhone, restaurantWebsite, restaurantOfferBadge } = load(
  'utils/restaurantPresentation.ts',
);

test('restaurant website accepts ordinary web links and rejects executable or credential-bearing URLs', () => {
  assert.equal(restaurantWebsite(' cafe.example/menu '), 'https://cafe.example/menu');
  assert.equal(
    restaurantWebsite('http://cafe.example/menu?lang=ur'),
    'http://cafe.example/menu?lang=ur',
  );
  for (const value of [
    '',
    'javascript:alert(1)',
    'file:///private',
    'intent://app',
    'tel:12345',
    'https://user:secret@cafe.example',
    'https://',
  ])
    assert.equal(restaurantWebsite(value), undefined);
});

test('dialer allows formatted phone numbers while rejecting USSD, extensions, and arbitrary schemes', () => {
  assert.equal(restaurantPhone('+92 (5813) 457-082'), '+925813457082');
  for (const value of ['', '*123#', 'tel:12345', '123', '+92;12345', 'abc', '1234567890123456'])
    assert.equal(restaurantPhone(value), undefined);
});

test('offer labels preserve valid registered percentages and do not publish malformed discounts', () => {
  const offer = { type: 'offer' };
  assert.equal(restaurantOfferBadge({ ...offer, discountPercent: 15 }), '15% OFF');
  assert.equal(restaurantOfferBadge({ ...offer, discountPercent: 0 }), '0% OFF');
  assert.equal(restaurantOfferBadge({ ...offer, type: 'sale' }), 'SALE');
  for (const discountPercent of [-10, 101, NaN, Infinity])
    assert.equal(restaurantOfferBadge({ ...offer, discountPercent }), 'PERK');
});

test('public listing uses actual restaurant details, approved verification, and no fabricated venue image', async () => {
  let provider = {
    id: 'venue',
    services: ['restaurant'],
    businessName: 'Registered business',
    city: 'Hunza',
    address: 'Karimabad',
    description: 'Provider description',
    verificationStatus: 'approved',
    rating: 4.8,
    reviewCount: 12,
    restaurant: {
      restaurantName: 'Registered cafe',
      images: [],
      menuVariety: ['Tea'],
      offers: [
        { id: 'active', title: 'Active offer', active: true, type: 'offer' },
        { id: 'inactive', title: 'Expired offer', active: false, type: 'sale' },
      ],
    },
  };
  const service = load('services/restaurantService.ts', {
    '@/services/api': { get: async () => provider },
    '@/services/mappers': {
      mapProvider: (value) => value,
      asArray: (value) => value,
      idOf: (value) => value.id,
    },
  });
  let restaurant = await service.getRestaurantById('venue');
  assert.equal(restaurant.name, 'Registered cafe');
  assert.deepEqual(restaurant.images, []);
  assert.equal(restaurant.verified, true);
  assert.deepEqual(
    restaurant.offers.map((offer) => offer.id),
    ['active'],
  );
  provider = {
    ...provider,
    verificationStatus: 'pending',
    restaurant: { ...provider.restaurant, images: ['https://cafe.example/venue.jpg'] },
  };
  restaurant = await service.getRestaurantById('venue');
  assert.equal(restaurant.verified, false);
  assert.deepEqual(restaurant.images, ['https://cafe.example/venue.jpg']);
  provider = { ...provider, services: ['transport'], restaurant: undefined };
  assert.equal(await service.getRestaurantById('venue'), null);
});
