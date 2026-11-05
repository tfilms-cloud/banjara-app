const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const source = ts.transpileModule(
  fs.readFileSync(path.resolve(__dirname, '../utils/profilePresentation.ts'), 'utf8'),
  {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  },
).outputText;
const moduleResult = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(
  require,
  moduleResult,
  moduleResult.exports,
);
const { profileBookingStats, profileSavedCount, profileAccountPerson } = moduleResult.exports;

test('overview counts completed journeys and all active booking states across the four supported services', () => {
  const records = ['transport', 'hotel', 'package', 'guide'].flatMap((bookingType) =>
    ['pending', 'payment_verification', 'confirmed', 'upcoming', 'completed'].map(
      (bookingStatus) => ({ bookingType, bookingStatus }),
    ),
  );
  assert.deepEqual(profileBookingStats(records), { journeys: 4, active: 16 });
});
test('cancelled, refunded, expired and unsupported records do not inflate account totals', () => {
  const records = ['cancelled', 'refunded', 'expired', 'disputed', 'unknown'].map(
    (bookingStatus) => ({ bookingType: 'transport', bookingStatus }),
  );
  records.push(
    { bookingType: 'restaurant', bookingStatus: 'completed' },
    { bookingType: 'other', bookingStatus: 'confirmed' },
    {},
  );
  assert.deepEqual(profileBookingStats(records), { journeys: 0, active: 0 });
  assert.deepEqual(profileBookingStats([]), { journeys: 0, active: 0 });
});
test('saved count ignores blanks and duplicate trip IDs without mutating the input', () => {
  const ids = ['trip-1', 'trip-2', 'trip-1', ' ', ' trip-2 '];
  assert.equal(profileSavedCount(ids), 2);
  assert.deepEqual(ids, ['trip-1', 'trip-2', 'trip-1', ' ', ' trip-2 ']);
});
test('signed-out and guest sessions do not expose a persisted profile', () => {
  const cached = { id: 'previous', name: 'Previous account' };
  assert.equal(profileAccountPerson(null, cached), null);
  assert.equal(profileAccountPerson({ id: 'guest' }, cached), null);
});
test('current account can use only its matching refreshed profile', () => {
  const user = { id: 'current', name: 'Current account' };
  const cached = { id: 'previous', name: 'Previous account' };
  const fresh = { id: 'current', name: 'Updated name' };
  assert.equal(profileAccountPerson(user, cached), user);
  assert.equal(profileAccountPerson(user, null), user);
  assert.equal(profileAccountPerson(user, fresh), fresh);
});
