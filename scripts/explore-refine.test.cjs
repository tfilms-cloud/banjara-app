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
const {
  DEFAULT_REFINE,
  exploreRefineOptions,
  isRefineActive,
  refineHotels,
  refineRated,
  refineTrips,
  sanitizeRefine,
  toggleRefine,
} = load('utils/exploreRefine.ts');

const hotels = [
  { id: 'a', priceFrom: 9000, rating: 4.8, isVerified: true, freeCancellation: true },
  { id: 'b', priceFrom: 4000, rating: 3.9, isVerified: false, breakfastIncluded: true },
  { id: 'c', priceFrom: 6000, rating: 4.2, isVerified: true },
];
const ids = (list) => list.map((item) => item.id);

test('hotels sort by price and rating without mutating the input', () => {
  const copy = [...hotels];
  assert.deepEqual(ids(refineHotels(hotels, { sort: 'price', toggles: [] })), ['b', 'c', 'a']);
  assert.deepEqual(ids(refineHotels(hotels, { sort: 'rating', toggles: [] })), ['a', 'c', 'b']);
  assert.deepEqual(hotels, copy);
});

test('hotel toggles combine as AND filters', () => {
  assert.deepEqual(
    ids(refineHotels(hotels, { sort: 'recommended', toggles: ['topRated', 'verified'] })),
    ['a', 'c'],
  );
  assert.deepEqual(
    ids(refineHotels(hotels, { sort: 'recommended', toggles: ['freeCancel', 'verified'] })),
    ['a'],
  );
  assert.deepEqual(ids(refineHotels(hotels, { sort: 'recommended', toggles: ['breakfast'] })), ['b']);
});

test('recommended keeps the server order', () => {
  assert.deepEqual(ids(refineHotels(hotels, DEFAULT_REFINE)), ['a', 'b', 'c']);
});

test('trips sort by cheapest and soonest, verified filters agencies', () => {
  const trips = [
    { id: 't1', price: 3000, date: '2026-11-05', departureTime: '09:00', agency: { verified: true } },
    { id: 't2', price: 2000, date: '2026-11-06', departureTime: '07:00', agency: { verified: false } },
    { id: 't3', price: 2500, date: '2026-11-05', departureTime: '06:00', agency: { verified: true } },
  ];
  assert.deepEqual(ids(refineTrips(trips, { sort: 'price', toggles: [] })), ['t2', 't3', 't1']);
  assert.deepEqual(ids(refineTrips(trips, { sort: 'soonest', toggles: [] })), ['t3', 't1', 't2']);
  assert.deepEqual(ids(refineTrips(trips, { sort: 'recommended', toggles: ['verified'] })), ['t1', 't3']);
});

test('rated lists treat missing ratings as 0', () => {
  const list = [{ id: 'x' }, { id: 'y', rating: 4.5 }, { id: 'z', rating: 4 }];
  assert.deepEqual(ids(refineRated(list, { sort: 'rating', toggles: [] })), ['y', 'z', 'x']);
  assert.deepEqual(ids(refineRated(list, { sort: 'recommended', toggles: ['topRated'] })), ['y', 'z']);
});

test('options are per-service and tours have none', () => {
  assert.equal(exploreRefineOptions('tours'), null);
  assert.ok(exploreRefineOptions('hotels').toggles.some((t) => t.id === 'freeCancel'));
  assert.ok(!exploreRefineOptions('guides').toggles.some((t) => t.id === 'freeCancel'));
});

test('sanitize drops settings the service does not offer; toggles flip', () => {
  const dirty = { sort: 'soonest', toggles: ['freeCancel', 'topRated'] };
  assert.deepEqual(sanitizeRefine('guides', dirty), { sort: 'recommended', toggles: ['topRated'] });
  assert.deepEqual(sanitizeRefine('tours', dirty), DEFAULT_REFINE);
  const on = toggleRefine(DEFAULT_REFINE, 'verified');
  assert.ok(isRefineActive(on));
  assert.ok(!isRefineActive(toggleRefine(on, 'verified')));
});
