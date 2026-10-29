const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const cache = new Map();
function load(file) {
  const full = path.join(root, file);
  if (cache.has(full)) return cache.get(full).exports;
  const module = { exports: {} };
  cache.set(full, module);
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
const { groupServiceArea, uniqueAreaNames } = load('utils/serviceArea.ts');

test('separates the screenshot stop labels from their route, including the route-first Urdu format', () => {
  const groups = groupServiceArea(
    ['Rawalpindi → Gilgit'],
    ['· Garelth · Rawalpindi → Gilgit'],
    ['· Garelth · Rawalpindi → Gilgit', 'Rawalpindi → Gilgit · ڈُر تھن'],
  );
  assert.equal(groups.length, 1);
  assert.equal(groups[0].from, 'Rawalpindi');
  assert.equal(groups[0].to, 'Gilgit');
  assert.deepEqual(groups[0].pickups, ['Garelth']);
  assert.deepEqual(groups[0].dropoffs, ['Garelth', 'ڈُر تھن']);
});
test('keeps each journey direction and its stops separate', () => {
  const groups = groupServiceArea(
    ['Islamabad → Hunza', 'Hunza → Islamabad'],
    ['Faizabad · Islamabad → Hunza', 'Aliabad · Hunza → Islamabad'],
    ['Aliabad · Islamabad → Hunza', 'Faizabad · Hunza → Islamabad'],
  );
  assert.deepEqual(
    groups.map((group) => group.pickups),
    [['Faizabad'], ['Aliabad']],
  );
  assert.deepEqual(
    groups.map((group) => group.dropoffs),
    [['Aliabad'], ['Faizabad']],
  );
});
test('does not assign unscoped stops to the first available route', () => {
  const groups = groupServiceArea(
    ['Islamabad → Hunza'],
    ['Unlinked bus terminal'],
    [],
  );
  assert.deepEqual(groups[0].pickups, []);
  assert.equal(groups[1].from, undefined);
  assert.deepEqual(groups[1].pickups, ['Unlinked bus terminal']);
});
test('discovers routes in stop metadata, preserves dotted names, and removes duplicates within each list', () => {
  const groups = groupServiceArea(
    [],
    [
      'Block A · Gate 2 · Islamabad -> Gilgit',
      'block a · gate 2 · Islamabad → Gilgit',
    ],
    [],
  );
  assert.equal(groups.length, 1);
  assert.deepEqual(groups[0].pickups, ['Block A · Gate 2']);
  assert.deepEqual(groups[0].dropoffs, []);
});
test('ignores empty values and retains non-Latin and long names without shortening them', () => {
  const name = 'گلگت بس ٹرمینل، مرکزی شاہراہ کے ساتھ';
  assert.deepEqual(groupServiceArea([], ['', '  ', name], []), [
    { key: 'unassigned', pickups: [name], dropoffs: [] },
  ]);
  assert.deepEqual(groupServiceArea([], [], []), []);
  assert.deepEqual(
    uniqueAreaNames([' Islamabad ', 'islamabad', 'Gilgit', '']),
    ['Islamabad', 'Gilgit'],
  );
});
