const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const web = path.resolve(root, '../banjara-admin');
const webRequire = createRequire(path.join(web, 'package.json'));

function load(file, mocks = {}, requireModule = require, globals = {}) {
  const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const context = vm.createContext({ module, exports: module.exports,
    require: name => Object.hasOwn(mocks, name) ? mocks[name] : requireModule(name),
    Promise, Set, Map, Date, Response, AbortSignal, console, setTimeout, clearTimeout, ...globals });
  vm.runInContext(source, context, { filename: file });
  return module.exports;
}
const targets = [
  ['mobile', path.join(root, 'utils/backendAvailability.ts')],
  ['website', path.join(web, 'src/lib/backend-monitor.ts')],
];

for (const [label, file] of targets) {
  const { createBackendMonitor, isBackendReady, isBackendOutage } = load(file);
  test(`${label}: only a successful database readiness response permits data`, () => {
    assert.equal(isBackendReady({ success: true, data: { database: 'connected' } }), true);
    for (const body of [null, {}, { success: true }, { success: false, data: { database: 'connected' } }, { success: true, data: { database: 'disconnected' } }]) {
      assert.equal(isBackendReady(body), false);
    }
  });
  test(`${label}: startup, outage, recovery clear old data before re-exposing screens`, async () => {
    let available = true;
    let displayCache = ['provider service A'];
    const monitor = createBackendMonitor(async () => available);
    monitor.registerReset(() => { displayCache = []; });
    assert.equal(monitor.getSnapshot(), 'checking');
    await monitor.check();
    assert.equal(monitor.getSnapshot(), 'online');
    displayCache = ['old provider service'];
    available = false;
    await monitor.check();
    assert.equal(monitor.getSnapshot(), 'offline');
    assert.deepEqual(displayCache, []);
    const offlineEpoch = monitor.getEpoch();
    available = true;
    await monitor.check();
    assert.equal(monitor.getSnapshot(), 'online');
    assert.equal(monitor.hasDisconnected(), true);
    assert.ok(monitor.getEpoch() > offlineEpoch);
  });
  test(`${label}: an old successful health request cannot undo a newer API failure`, async () => {
    let complete;
    const monitor = createBackendMonitor(() => new Promise(resolve => { complete = resolve; }));
    const pending = monitor.check();
    await Promise.resolve();
    monitor.reportFailure();
    complete(true);
    await pending;
    assert.equal(monitor.getSnapshot(), 'offline');
  });
  test(`${label}: readiness errors fail closed and simultaneous checks share a request`, async () => {
    let calls = 0;
    const monitor = createBackendMonitor(async () => { calls++; throw Error('Connection refused'); });
    await Promise.all([monitor.check(), monitor.check(), monitor.check()]);
    assert.equal(calls, 1);
    assert.equal(monitor.getSnapshot(), 'offline');
  });
  test(`${label}: cancellation and record/auth errors do not hide unrelated provider data`, () => {
    for (const status of [400, 401, 403, 404, 409, 422, 429, 500]) assert.equal(isBackendOutage({ response: { status } }), false);
    assert.equal(isBackendOutage({ code: 'ERR_CANCELED' }), false);
    for (const status of [502, 503, 504]) assert.equal(isBackendOutage({ response: { status } }), true);
    assert.equal(isBackendOutage({ code: 'ECONNREFUSED' }), true);
  });
}

test('website readiness proxy rejects a database outage and never caches readiness', async () => {
  const { isBackendReady } = load(targets[1][1]);
  let connected = true;
  let received;
  const route = load(path.join(web, 'src/app/api/backend-status/route.ts'), { '@/lib/backend-monitor': { isBackendReady } }, webRequire, {
    process: { env: { NEXT_PUBLIC_API_URL: 'http://test-api/api/' } },
    fetch: async (url, options) => { received = { url, options }; return Response.json({ success: true, data: { database: connected ? 'connected' : 'disconnected' } }); },
  });
  assert.equal((await route.GET()).status, 200);
  assert.equal(received.url, 'http://test-api/api/ready');
  assert.equal(received.options.cache, 'no-store');
  connected = false;
  const offline = await route.GET();
  assert.equal(offline.status, 503);
  assert.match(offline.headers.get('Cache-Control'), /no-store/);
});

test('mobile trip and hotel caches fetch current provider records after reconnect, including late old responses', async () => {
  const { createBackendMonitor } = load(targets[0][1]);
  const monitor = createBackendMonitor(async () => true);
  await monitor.check();
  let record = { id: 'registered', name: 'Provider service A' };
  let calls = 0;
  let finishOldRequest;
  const api = { get: async () => { calls++; return record; } };
  const mappers = new Proxy({}, { get: (_, name) => name === 'asArray' ? x => x : x => x });
  const mocks = { '@/services/api': api, '@/services/backendAvailability': { backendAvailability: monitor },
    '@/services/mappers': mappers, '@/utils/matchesSearchText': { matchesSearchText: () => true },
    '@/services/apiError': { ApiError: Error } };
  const trips = load(path.join(root, 'services/tripService.ts'), mocks);
  const hotels = load(path.join(root, 'services/hotelService.ts'), mocks);
  assert.equal((await trips.getTripById('registered')).name, 'Provider service A');
  assert.equal((await hotels.getHotelById('registered')).name, 'Provider service A');
  await trips.getTripById('registered');
  await hotels.getHotelById('registered');
  assert.equal(calls, 2);
  api.get = () => new Promise(resolve => { finishOldRequest = resolve; });
  const oldRequest = trips.getTripById('late');
  monitor.reportFailure();
  await monitor.check();
  finishOldRequest({ id: 'late', name: 'Outdated service' });
  await oldRequest;
  record = { id: 'registered', name: 'New provider service B' };
  api.get = async () => record;
  assert.equal((await trips.getTripById('registered')).name, 'New provider service B');
  assert.equal((await hotels.getHotelById('registered')).name, 'New provider service B');
  assert.equal((await trips.getTripById('late')).name, 'New provider service B');
});

test('website keeps navigation and search visible while data sections are unavailable', () => {
  const React = webRequire('react');
  const { renderToStaticMarkup } = webRequire('react-dom/server');
  const { QueryClient, QueryClientProvider } = webRequire('@tanstack/react-query');
  const { createBackendMonitor } = load(targets[1][1]);
  const availability = { backendAvailability: createBackendMonitor(async () => true) };
  const liveQuery = load(path.join(web, 'src/lib/live-query.ts'), { '@/lib/backend-availability': availability }, webRequire);
  const { BackendData } = load(path.join(web, 'src/components/site/backend-data.tsx'), {
    '@/lib/backend-availability': availability, '@/lib/live-query': liveQuery,
  }, webRequire);
  const { BackendAvailabilityGate } = load(path.join(web, 'src/components/providers/backend-availability-gate.tsx'), {
    '@/lib/backend-availability': availability, '@/lib/live-query': liveQuery,
  }, webRequire);
  const html = renderToStaticMarkup(React.createElement(QueryClientProvider, { client: new QueryClient() },
    React.createElement(BackendAvailabilityGate, null,
      React.createElement('nav', null, 'APP NAVIGATION'),
      React.createElement('input', { placeholder: 'Search trips', defaultValue: 'Hunza' }),
      React.createElement(BackendData, { label: 'Trips' }, 'STALE PROVIDER LISTING'))));
  assert.ok(!html.includes('STALE PROVIDER LISTING'));
  assert.match(html, /APP NAVIGATION/);
  assert.match(html, /Search trips/);
  assert.match(html, /Hunza/);
  assert.match(html, /Trips.*temporarily unavailable/);
});

test('provider receiving-account cache reloads real account changes after an outage', async () => {
  const { createBackendMonitor } = load(targets[0][1]);
  const monitor = createBackendMonitor(async () => true);
  await monitor.check();
  let accounts = [{ id: 'old-account', active: true }];
  const service = load(path.join(root, 'services/paymentAccountsCache.ts'), {
    '@/services/backendAvailability': { backendAvailability: monitor },
    '@/services/p2pPaymentService': { listMyPaymentAccounts: async () => accounts },
  });
  assert.equal((await service.getPaymentAccountsStatus()).accounts[0].id, 'old-account');
  monitor.reportFailure();
  assert.equal(service.peekPaymentAccountsCache(), null);
  assert.equal(service.paymentAccountsCacheAgeMs(), null);
  accounts = [{ id: 'new-account', active: true }];
  await monitor.check();
  assert.equal((await service.getPaymentAccountsStatus()).accounts[0].id, 'new-account');
});

test('mobile keeps UI visible and masks only backend records during an outage', async () => {
  const React = webRequire('react');
  const { renderToStaticMarkup } = webRequire('react-dom/server');
  const { createBackendMonitor } = load(targets[0][1]);
  let ready = false;
  const monitor = createBackendMonitor(async () => ready);
  const availability = { backendAvailability: monitor };
  const dataHooks = load(path.join(root, 'hooks/useBackendData.ts'), { react: React, '@/services/backendAvailability': availability }, webRequire);
  const element = tag => ({ children }) => React.createElement(tag, null, children);
  const { BackendAvailabilityGate } = load(path.join(root, 'components/BackendAvailabilityGate.tsx'), {
    react: React,
    'react/jsx-runtime': webRequire('react/jsx-runtime'),
    'react-native': { AppState: {}, Pressable: element('button'), Text: element('p'), View: element('div') },
    'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 0 }) },
    '@/hooks/useBackendData': dataHooks,
    '@/constants/colors': { useThemeColors: () => ({}) },
    '@/services/backendAvailability': availability,
    '@/store/providerStore': {},
    ...Object.fromEntries(['bookingStore','hotelStore','tourBookingStore','guideBookingStore','chatStore','userStore'].map(name => ['@/store/'+name, {}])),
  }, webRequire);
  function DataSection() {
    const [trips] = dataHooks.useBackendState([{ name: 'REGISTERED PROVIDER SERVICE' }], []);
    return React.createElement('section', null, 'TRIPS SECTION', trips.map(trip => trip.name).join(''));
  }
  const render = () => renderToStaticMarkup(React.createElement(BackendAvailabilityGate, null,
    React.createElement('nav', null, 'MOBILE NAVIGATION'), React.createElement(DataSection)));
  assert.ok(!render().includes('REGISTERED PROVIDER SERVICE'));
  assert.match(render(), /MOBILE NAVIGATION/);
  assert.match(render(), /TRIPS SECTION/);
  await monitor.check();
  assert.match(render(), /Live data unavailable/);
  assert.ok(!render().includes('REGISTERED PROVIDER SERVICE'));
  ready = true;
  await monitor.check();
  assert.match(render(), /REGISTERED PROVIDER SERVICE/);
  monitor.reportFailure();
  assert.ok(!render().includes('REGISTERED PROVIDER SERVICE'));
});

test('mobile record state never revives old trips after recovery or a functional update', async () => {
  const { createBackendMonitor } = load(targets[0][1]);
  const monitor = createBackendMonitor(async () => true);
  await monitor.check();
  const cells = [];
  let cursor = 0;
  const react = {
    useSyncExternalStore: (_subscribe, snapshot) => snapshot(),
    useCallback: callback => callback,
    useState: initial => {
      const index = cursor++;
      if (!(index in cells)) cells[index] = typeof initial === 'function' ? initial() : initial;
      return [cells[index], update => { cells[index] = typeof update === 'function' ? update(cells[index]) : update; }];
    },
  };
  const { useBackendState } = load(path.join(root, 'hooks/useBackendData.ts'), {
    react, '@/services/backendAvailability': { backendAvailability: monitor },
  });
  const render = () => { cursor = 0; return useBackendState([], []); };
  const [, setTrips] = render();
  setTrips(['old trip']);
  assert.deepEqual(render()[0], ['old trip']);
  monitor.reportFailure();
  assert.deepEqual(render()[0], []);
  await monitor.check();
  assert.deepEqual(render()[0], []);
  setTrips(previous => [...previous, 'fresh trip']);
  assert.deepEqual(render()[0], ['fresh trip']);
});
