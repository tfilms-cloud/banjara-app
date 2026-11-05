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
const { tripAvailability, tripPhotos } = load('utils/tripDetails.ts');

test('bookable departures require available seats and an active status', () => {
  assert.equal(tripAvailability({ availableSeats: 3, status: 'scheduled' }).canBook, true);
  for (const status of ['cancelled', 'completed', 'departed', ' CANCELLED ']) {
    assert.deepEqual(tripAvailability({ availableSeats: 3, status }), {
      unavailable: true,
      soldOut: false,
      canBook: false,
    });
  }
});

test('zero or negative inventory cannot proceed to pickup booking', () => {
  for (const availableSeats of [0, -1]) {
    assert.deepEqual(tripAvailability({ availableSeats, status: 'scheduled' }), {
      unavailable: false,
      soldOut: true,
      canBook: false,
    });
  }
});

test('gallery normalizes URLs, preserves ordering and removes duplicates and empty images', () => {
  assert.deepEqual(
    tripPhotos({
      image: ' https://example.com/Trip Photos/van.jpg ',
      vehicleImages: [
        '',
        'https://example.com/Trip%20Photos/van.jpg',
        'https://example.com/inside.jpg',
      ],
    }),
    ['https://example.com/Trip%20Photos/van.jpg', 'https://example.com/inside.jpg'],
  );
  assert.deepEqual(tripPhotos({}), []);
});
