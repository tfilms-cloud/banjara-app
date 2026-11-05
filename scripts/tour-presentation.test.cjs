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
const { tourCanReserve, tourDuration, tourPhotos } = load('utils/tourPresentation.ts');

test('only published packages with valid pricing and capacity offer reservations', () => {
  const item = { id: 'tour', status: 'published', pricePerPerson: 0, maxParticipants: 1 };
  assert.equal(tourCanReserve(item), true);
  for (const change of [
    { status: 'draft' },
    { status: 'pending' },
    { status: 'rejected' },
    { id: '' },
    { pricePerPerson: -1 },
    { pricePerPerson: NaN },
    { pricePerPerson: Infinity },
    { maxParticipants: 0 },
    { maxParticipants: NaN },
  ])
    assert.equal(tourCanReserve({ ...item, ...change }), false);
});

test('gallery normalizes and deduplicates cover and provider photos without inventing a fallback', () => {
  assert.deepEqual(
    tourPhotos({
      coverImage: ' https://example.test/tour photo.jpg ',
      images: [
        'https://example.test/tour%20photo.jpg',
        '',
        'https://example.test/next.jpg?token=public',
      ],
    }),
    ['https://example.test/tour%20photo.jpg', 'https://example.test/next.jpg?token=public'],
  );
  assert.deepEqual(tourPhotos({ coverImage: '', images: [] }), []);
});

test('duration never invents nights and preserves a registered zero-night day trip', () => {
  assert.equal(tourDuration({ durationDays: 14, durationNights: 13 }), '14D / 13N');
  assert.equal(tourDuration({ durationDays: 1, durationNights: 0 }), '1D / 0N');
  assert.equal(tourDuration({ durationDays: 3 }), '3 days');
  assert.equal(tourDuration({ durationDays: NaN }), 'Ask operator');
});
