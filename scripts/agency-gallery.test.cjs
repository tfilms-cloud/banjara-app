const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
function load(file) {
  const full = path.join(__dirname, '..', file);
  const module = { exports: {} };
  const source = ts.transpileModule(fs.readFileSync(full, 'utf8'), {
    fileName: full,
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
    },
  }).outputText;
  vm.runInThisContext(`(function(require,module,exports){${source}\n})`, {
    filename: full,
  })(
    (name) =>
      name.startsWith('@/') ? load(`${name.slice(2)}.ts`) : require(name),
    module,
    module.exports,
  );
  return module.exports;
}
const { withoutDriverPhoto } = load('utils/agencyGallery.ts');
test('removes a portrait embedded in older gallery or vehicle responses', () => {
  assert.deepEqual(
    withoutDriverPhoto(
      [
        'https://images.test/front.jpg',
        'https://images.test/driver.jpg',
        'https://images.test/back.jpg',
      ],
      'https://images.test/driver.jpg',
    ),
    ['https://images.test/front.jpg', 'https://images.test/back.jpg'],
  );
});
test('recognizes the same portrait with different signed URL tokens and encoded spaces', () => {
  assert.deepEqual(
    withoutDriverPhoto(
      [
        'https://images.test/driver%20photo.jpg?token=old',
        'https://images.test/front.jpg',
      ],
      'https://images.test/driver photo.jpg?token=new',
    ),
    ['https://images.test/front.jpg'],
  );
});
test('preserves other provider galleries when there is no driver photo', () => {
  assert.deepEqual(
    withoutDriverPhoto([
      'https://images.test/room.jpg',
      'https://images.test/room.jpg',
      '  ',
    ]),
    ['https://images.test/room.jpg'],
  );
});
test('handles a gallery containing only a portrait', () => {
  assert.deepEqual(
    withoutDriverPhoto(
      ['https://images.test/driver.jpg'],
      'https://images.test/driver.jpg',
    ),
    [],
  );
});
