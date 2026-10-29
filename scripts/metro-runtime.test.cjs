const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const ts = require('typescript');
const { limitCacheStores } = require('./metro-cache.cjs');
const turn = () => new Promise(resolve => setImmediate(resolve));

test('cache I/O stays bounded across simultaneous reads and writes', async () => {
  let active = 0; let peak = 0;
  async function operation(key) {
    active++; peak = Math.max(peak, active);
    try {
      if (active > 16) throw Object.assign(new Error('File handles exhausted'), { code: 'EMFILE' });
      await turn(); return key;
    } finally { active--; }
  }
  const [cache] = limitCacheStores([{ get: operation, set: operation, clear() {} }]);
  const results = await Promise.all(Array.from({ length: 2000 }, (_, index) => index % 2 ? cache.set(index, {}) : cache.get(index)));
  assert.equal(peak, 8); assert.equal(results.length, 2000); assert.equal(results[1999], 1999);
});

test('cache retries transient handle exhaustion and releases failed queue slots', async () => {
  let attempts = 0;
  const [cache] = limitCacheStores([{
    get: async key => {
      if (key === 'broken') throw Object.assign(new Error('Access denied'), { code: 'EACCES' });
      if (++attempts < 3) throw Object.assign(new Error('Exhausted'), { code: attempts === 1 ? 'EMFILE' : 'ENFILE' });
      return key;
    }, set() {}, clear() {},
  }], { concurrency: 1, retryDelayMs: 1 });
  const [bad, good] = await Promise.allSettled([cache.get('broken'), cache.get('healthy')]);
  assert.equal(bad.status, 'rejected'); assert.equal(bad.reason.code, 'EACCES');
  assert.equal(good.value, 'healthy'); assert.equal(attempts, 3);
});

test('persistent errors eventually surface instead of retrying forever', async () => {
  let attempts = 0;
  const [cache] = limitCacheStores([{
    get() { attempts++; throw Object.assign(new Error('Still exhausted'), { code: 'EMFILE' }); }, set() {}, clear() {},
  }], { retries: 2, retryDelayMs: 1 });
  await assert.rejects(cache.get('key'), { code: 'EMFILE' }); assert.equal(attempts, 3);
});

test('lazy cache factories and synchronous clear preserve the Metro contract', () => {
  let supplied; let cleared = 0;
  const factory = limitCacheStores(api => { supplied = api; return [{ get() {}, set() {}, clear() { cleared++; } }]; });
  const api = {}; const [cache] = factory(api);
  assert.equal(supplied, api); assert.equal(cache.clear(), undefined); assert.equal(cleared, 1);
});

test('real Expo binary cache survives a burst of writes and reads', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'banjara-metro-cache-'));
  try {
    const { getDefaultConfig } = require('expo/metro-config');
    const original = getDefaultConfig(path.resolve(__dirname, '..')).cacheStores[0];
    const store = new original.constructor({ root: directory });
    const [cache] = limitCacheStores([store]);
    const entries = Array.from({ length: 256 }, (_, index) => ({
      key: Buffer.from(index.toString(16).padStart(64, '0'), 'hex'),
      value: { path: `sample-${index}.js`, output: [{ type: 'js/module', data: { code: `module.exports=${index};`, map: [] } }], dependencies: [] },
    }));
    await Promise.all(entries.map(({ key, value }) => cache.set(key, value)));
    const values = await Promise.all(entries.map(({ key }) => cache.get(key)));
    values.forEach((value, index) => assert.deepEqual(value, entries[index].value));
  } finally {
    // Delete only the disposable directory created by this test, never a shared Metro cache.
    assert.equal(path.dirname(path.resolve(directory)), path.resolve(os.tmpdir()));
    assert.ok(path.basename(directory).startsWith('banjara-metro-cache-'));
    await fs.promises.rm(directory, { recursive: true, force: true });
  }
});

function pushRuntime(platform, expoGo) {
  let imports = 0; let channels = 0; let registrations = 0;
  const notifications = {
    setNotificationHandler() {}, AndroidImportance: { HIGH: 4 },
    setNotificationChannelAsync: async () => { channels++; },
    getPermissionsAsync: async () => ({ status: 'granted' }),
    getExpoPushTokenAsync: async () => ({ data: 'ExponentPushToken[test]' }),
    addNotificationReceivedListener: () => ({ remove() {} }),
    addNotificationResponseReceivedListener: () => ({ remove() {} }),
    getLastNotificationResponseAsync: async () => null,
  };
  const mocks = {
    expo: { isRunningInExpoGo: () => expoGo },
    'expo-constants': { expoConfig: { extra: { eas: { projectId: 'test-project' } } } },
    'expo-device': { isDevice: true }, 'react-native': { Platform: { OS: platform } },
    '@/services/api': { post: async () => { registrations++; }, get() {}, del() {}, patch() {} },
  };
  const source = fs.readFileSync(path.resolve(__dirname, '../services/pushNotifications.ts'), 'utf8');
  const code = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } }).outputText;
  const exports = {};
  vm.runInNewContext(code, { exports, require: id => {
    if (id === 'expo-notifications') { imports++; return notifications; }
    if (id in mocks) return mocks[id]; throw Error(`Unexpected import: ${id}`);
  } });
  return { service: exports, counts: () => ({ imports, channels, registrations }) };
}

for (const [platform, expoGo] of [['ios', true], ['android', true], ['web', false]]) {
  test(`${platform} ${expoGo ? 'Expo Go' : 'web'} skips native push imports and permission requests`, async () => {
    const runtime = pushRuntime(platform, expoGo); const service = runtime.service;
    assert.equal(service.isPushRuntimeSupported(), false);
    assert.equal(await service.requestPushPermission(), false);
    assert.equal(await service.registerPushToken('customer'), null);
    const listeners = await service.attachPushListeners({ onReceived() {}, onResponse() {} });
    assert.equal(listeners.receiveSub, null); assert.equal(runtime.counts().imports, 0);
  });
}
for (const platform of ['ios', 'android']) {
  test(`${platform} native builds still register push tokens and listeners`, async () => {
    const runtime = pushRuntime(platform, false); const service = runtime.service;
    assert.equal(service.isPushRuntimeSupported(), true);
    assert.equal(await service.registerPushToken('provider'), 'ExponentPushToken[test]');
    const listeners = await service.attachPushListeners({ onReceived() {}, onResponse() {} });
    assert.equal(typeof listeners.receiveSub.remove, 'function');
    assert.equal(runtime.counts().imports, 1); assert.equal(runtime.counts().registrations, 1);
    assert.equal(runtime.counts().channels, platform === 'android' ? 1 : 0);
  });
}
