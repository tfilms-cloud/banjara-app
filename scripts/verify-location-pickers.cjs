// Exercise the real picker hooks and components without a native device or live geocoder.
// Run: node scripts/verify-location-pickers.cjs
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const jsx = (type, props) => ({ type, props });
const flush = () => new Promise(resolve => setImmediate(resolve));
const plain = value => JSON.parse(JSON.stringify(value));
const deferred = () => { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; };

function hooks() {
  const slots = []; let cursor = 0; let effects = []; let mounted = true;
  const same = (a, b) => a && b && a.length === b.length && a.every((x, i) => Object.is(x, b[i]));
  const api = {
    useState(initial) {
      const i = cursor++;
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial;
      return [slots[i], next => { if (mounted) slots[i] = typeof next === 'function' ? next(slots[i]) : next; }];
    },
    useRef(initial) { const i = cursor++; if (!(i in slots)) slots[i] = { current: initial }; return slots[i]; },
    useMemo(fn, deps) { const i = cursor++; if (!slots[i] || !same(slots[i].deps, deps)) slots[i] = { deps, value: fn() }; return slots[i].value; },
    useCallback(fn, deps) { return api.useMemo(() => fn, deps); },
    useEffect(fn, deps) {
      const i = cursor++;
      if (!slots[i] || !same(slots[i].deps, deps)) {
        const prior = slots[i]; slots[i] = { deps };
        effects.push(() => { prior?.cleanup?.(); slots[i].cleanup = fn(); });
      }
    },
  };
  return {
    api,
    render(fn) { cursor = 0; const result = fn(); const pending = effects; effects = []; pending.forEach(fn => fn()); return result; },
    unmount() { mounted = false; slots.forEach(slot => slot?.cleanup?.()); },
  };
}

const rn = {
  ActivityIndicator: 'Spinner', Pressable: 'Pressable', View: 'View', Text: 'Text', ScrollView: 'ScrollView',
  Modal: 'Modal', KeyboardAvoidingView: 'KeyboardAvoidingView', Keyboard: { dismiss() {} },
  Platform: { OS: 'ios' }, Linking: { openSettings() {} },
  useWindowDimensions: () => ({ width: 390, height: 844 }),
  StyleSheet: { create: x => x, absoluteFill: {}, hairlineWidth: 1 },
};
const shared = {
  'react/jsx-runtime': { jsx, jsxs: jsx, Fragment: 'Fragment' },
  'react-native': rn,
  '@expo/vector-icons': { Ionicons: 'Icon' },
  'react-native-safe-area-context': { useSafeAreaInsets: () => ({ top: 47, bottom: 34 }) },
  '@/constants/colors': { Colors: {}, useThemeColors: () => ({}) },
  '@/constants/spacing': { Radius: {}, Spacing: { sm: 8, md: 12, lg: 20 }, Shadows: {} },
  '@/constants/typography': { Fonts: {} },
};

function load(file, mocks) {
  const source = fs.readFileSync(path.join(root, file), 'utf8');
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
  const exports = {};
  vm.runInNewContext(js, { exports, require: id => {
    if (id in mocks) return mocks[id]; if (id in shared) return shared[id]; throw Error(`Unexpected import: ${id}`);
  }, setTimeout, clearTimeout, console, URL }, { filename: file });
  return exports;
}

function all(node) {
  if (!node || typeof node !== 'object' || (node.type === 'Modal' && !node.props.visible)) return [];
  return [node, ...[node.props?.children].flat(Infinity).flatMap(all)];
}
const find = (tree, predicate) => { const result = all(tree).find(predicate); assert.ok(result, 'Expected control exists'); return result; };
const place = (latitude, longitude, name) => ({ latitude, longitude, name, address: { city: name, formattedAddress: `${name} address` } });

async function selectionChecks() {
  const runner = hooks(); let reverse = async (lat, lng) => place(lat + 0.01, lng + 0.01, 'Resolved');
  let position = async () => ({ coords: { latitude: 33.5, longitude: 73.1 } });
  let granted = true;
  const module = load('hooks/useLocationPicker.ts', {
    react: runner.api,
    'expo-location': {
      PermissionStatus: { GRANTED: 'granted', DENIED: 'denied' }, Accuracy: { Balanced: 3 },
      getForegroundPermissionsAsync: async () => ({ status: granted ? 'granted' : 'denied', canAskAgain: false }),
      hasServicesEnabledAsync: async () => true,
      getCurrentPositionAsync: () => position(), reverseGeocodeAsync: async () => [],
    },
    '@/services/apiError': { getApiErrorMessage: e => e.message },
    '@/services/locationService': { reverseGeocode: (...args) => reverse(...args) },
  });
  const render = () => runner.render(() => module.usePinnedLocationPicker({ latitude: 36, longitude: 74, address: { city: 'Original' } }));
  let state = render(); assert.equal(state.pinConfirmed, false);
  state.selectPlace(place(35, 73, 'Search result')); state = render();
  assert.equal(state.pinConfirmed, false, 'Search must require explicit pin confirmation');
  const pending = deferred(); reverse = () => pending.promise;
  state.onPinStatusChange(true); const resolving = state.onRegionSettled(34, 72); state = render();
  assert.equal(state.picker.value.address.city, '', 'New coordinates clear the old address');
  assert.equal(state.reversing, true);
  state.onPinStatusChange(false); state.selectPlace(place(32, 71, 'Newer search')); state = render();
  assert.equal(state.reversing, false, 'Search cancels stale address work');
  pending.resolve(place(34, 72, 'Old result')); await resolving; state = render();
  assert.equal(state.picker.value.address.city, 'Newer search', 'Late address responses cannot overwrite a new choice');

  const gps = deferred(); position = () => gps.promise;
  const locating = state.onUseCurrent(); await flush();
  state = render(); state.selectPlace(place(30, 70, 'Chosen during GPS'));
  gps.resolve({ coords: { latitude: 33, longitude: 73 } }); await locating; state = render();
  assert.equal(state.picker.value.latitude, 30, 'Late GPS responses cannot overwrite a new choice');

  position = async () => ({ coords: { latitude: 33.5, longitude: 73.1 } });
  reverse = async () => place(33.51, 73.11, 'GPS address');
  await state.onUseCurrent(); state = render();
  assert.equal(state.pinConfirmed, false, 'GPS must require explicit pin confirmation');
  assert.equal(state.picker.value.latitude, 33.5, 'Keep exact GPS/pin coordinates rather than nearby geocoder coordinates');
  state.onPinStatusChange(true); await state.onRegionSettled(33.5, 73.1); state = render();
  assert.equal(state.pinConfirmed, true);
  assert.equal(state.picker.value.longitude, 73.1);

  granted = false; await state.onUseCurrent(); state = render();
  assert.ok(state.current.error, 'Permission denial must show an actionable error');
  reverse = async (lat, lng) => place(lat, lng, 'Manual choice');
  state.onPinStatusChange(true); await state.onRegionSettled(35, 75); state = render();
  assert.equal(state.pinConfirmed, true, 'Manual pinning works without GPS permission');
  assert.equal(state.picker.value.latitude, 35);

  reverse = async () => { throw Error('Geocoder offline'); };
  await state.onRegionSettled(34, 74); state = render();
  assert.equal(state.picker.value.latitude, 34);
  assert.equal(state.picker.value.address.city, '', 'A failed address lookup cannot retain a previous city');
  assert.ok(state.reverseError);
  state.onPinStatusChange(false); state = render(); assert.equal(state.reverseError, null);
  runner.unmount();
  console.log('PASS selection: explicit pins, exact coordinates, stale address/GPS rejection, permission denial, offline addresses');
}

function mapChecks() {
  const runner = hooks(); const selected = [];
  const { LocationMap } = load('components/location/LocationMap.tsx', {
    react: runner.api,
    '@/components/map/MapFallback': { MapFallback: 'MapFallback' },
    '@/components/location/LocationWebMap': { LocationWebMap: 'WebMap' },
    '@/components/map/mapHelpers': { isValidCoord: c => Number.isFinite(c.latitude) && Number.isFinite(c.longitude) },
    '@/components/map/nativeMaps': { useNativeMaps: () => ({ ready: true, maps: null }) },
    '@/components/location/MapPinIcon': { MapPinIcon: 'Pin' },
  });
  const props = { latitude: 36, longitude: 74, onRegionSettled: (lat, lng) => selected.push([lat, lng]) };
  const render = extra => runner.render(() => LocationMap({ ...props, ...extra }));
  let tree = render(); let web = find(tree, n => n.type === 'WebMap');
  web.props.onMoving(); tree = render();
  assert.equal(find(tree, n => n.props?.accessibilityLabel === 'Pin location').props.disabled, true);
  web = find(tree, n => n.type === 'WebMap'); web.props.onSettled({ latitude: 35, longitude: 73 }); tree = render();
  assert.equal(selected.length, 0, 'Moving the map must not submit a location');
  find(tree, n => n.props?.accessibilityLabel === 'Pin location').props.onPress(); tree = render();
  assert.deepEqual(selected, [[35, 73]]);
  find(tree, n => n.props?.accessibilityLabel === 'Open full screen map').props.onPress(); tree = render();
  let full = find(tree, n => n.type === 'Modal');
  web = find(full, n => n.type === 'WebMap'); web.props.onMoving();
  web.props.onSettled({ latitude: 34, longitude: 72 }); tree = render();
  full = find(tree, n => n.type === 'Modal');
  assert.equal(find(full, n => n.type === 'WebMap').props.latitude, 34);
  find(full, n => n.props?.accessibilityLabel === 'Back to location form').props.onPress(); tree = render();
  assert.equal(find(tree, n => n.type === 'WebMap').props.latitude, 34, 'Back retains the candidate pin');
  assert.equal(selected.length, 1, 'Full-screen drag/Back must not auto-submit');
  find(tree, n => n.props?.accessibilityLabel === 'Pin location').props.onPress();
  assert.deepEqual(selected, [[35, 73], [34, 72]]);
  tree = render({ pinConfirmed: false });
  assert.ok(find(tree, n => n.props?.accessibilityLabel === 'Pin location'), 'External search resets on-map pinned status');
  tree = render({ interactive: false });
  assert.equal(all(tree).filter(n => ['Pin location', 'Location pinned'].includes(n.props?.accessibilityLabel)).length, 0);
  runner.unmount();
  console.log('PASS map: default pin button, movement lock, explicit submission, full-screen/Back retention, preview maps');
}

function sheetChecks() {
  let state = { pinConfirmed: false, reversing: false, picker: { value: { latitude: 34, longitude: 73, address: { city: 'Chosen city' } } }, current: { loading: false }, onRegionSettled() {}, onPinStatusChange() {}, selectPlace() {}, onUseCurrent() {} };
  const confirms = []; const runner = hooks();
  const { LocationPinSheet, formatPickedCity, toPlaceSearchResult } = load('components/location/LocationPinSheet.tsx', {
    '@/components/location/AddressPreview': { AddressPreview: 'AddressPreview' },
    '@/components/location/CurrentLocationButton': { CurrentLocationButton: 'CurrentLocationButton' },
    '@/components/location/LocationMap': { LocationMap: 'LocationMap' },
    '@/components/location/LocationPermissionHandler': { LocationPermissionHandler: 'PermissionHandler' },
    '@/components/location/LocationSearchBar': { LocationSearchBar: 'Search' },
    '@/components/ui/Button': { Button: 'Button' },
    '@/hooks/useLocationPicker': { usePinnedLocationPicker: () => state, useLocationSearch: () => ({}) },
  });
  const props = { visible: true, onClose() {}, onConfirm: value => confirms.push(plain(value)) };
  const outer = LocationPinSheet(props); const content = outer.props.children;
  const render = () => runner.render(() => content.type(content.props));
  let tree = render(); const button = () => find(tree, n => n.type === 'Button');
  assert.equal(button().props.disabled, true); button().props.onPress(); assert.equal(confirms.length, 0);
  const map = find(tree, n => n.type === 'LocationMap');
  assert.equal(map.props.requirePinConfirmation, true); assert.notEqual(map.props.allowFullscreen, false);
  assert.ok(find(tree, n => n.props?.accessibilityLabel === 'Back from location picker'));
  state = { ...state, pinConfirmed: true, reversing: true }; tree = render(); assert.equal(button().props.disabled, true);
  state = { ...state, reversing: false, current: { loading: true } }; tree = render(); assert.equal(button().props.disabled, true);
  state = { ...state, current: { loading: false } }; tree = render(); button().props.onPress();
  assert.equal(confirms.length, 1); assert.equal(confirms[0].latitude, 34);
  assert.equal(formatPickedCity({ ...state.picker.value, placeName: 'Hotel entrance' }), 'Chosen city', 'City searches use the city rather than an entrance or building name');
  assert.deepEqual(plain(toPlaceSearchResult(state.picker.value).location.coordinates), [73, 34], 'Consumers receive GeoJSON longitude/latitude in the correct order');
  assert.equal(LocationPinSheet({ ...props, visible: false }).props.children, null, 'Closing discards the picker session');
  runner.unmount();
  console.log('PASS shared sheet: pin required, full-screen enabled, Back control, pending work blocks confirmation, fresh open sessions');
}

function nativeMapChecks() {
  const runner = hooks(); const statuses = []; const selected = [];
  const { LocationMap } = load('components/location/LocationMap.tsx', {
    react: runner.api,
    '@/components/map/MapFallback': { MapFallback: 'MapFallback' },
    '@/components/location/LocationWebMap': { LocationWebMap: 'WebMap' },
    '@/components/map/mapHelpers': { isValidCoord: () => true },
    '@/components/map/nativeMaps': { useNativeMaps: () => ({ ready: true, maps: { default: 'NativeMap', Marker: 'Marker' } }) },
    '@/components/location/MapPinIcon': { MapPinIcon: 'Pin' },
  });
  const render = () => runner.render(() => LocationMap({ latitude: 36, longitude: 74, pinConfirmed: true, onPinStatusChange: value => statuses.push(value), onRegionSettled: (lat, lng) => selected.push([lat, lng]) }));
  let tree = render(); let map = find(tree, n => n.type === 'NativeMap');
  map.props.onRegionChange({ latitude: 36, longitude: 74 });
  map.props.onRegionChangeComplete({ latitude: 36, longitude: 74 });
  assert.equal(statuses.length, 0, 'Mount/zoom events cannot invalidate an existing pin');
  tree = render(); map = find(tree, n => n.type === 'NativeMap');
  map.props.onRegionChange({ latitude: 35, longitude: 73 });
  map.props.onRegionChangeComplete({ latitude: 35, longitude: 73 });
  assert.ok(statuses.includes(false), 'Real native map movement requires a new pin');
  assert.equal(selected.length, 0);
  tree = render(); find(tree, n => n.props?.accessibilityLabel === 'Location pinned').props.onPress();
  assert.deepEqual(selected, [[35, 73]]);
  runner.unmount();
  console.log('PASS native map: mount/zoom preserve the pin, coordinate movement requires a new pin');
}

(async () => { await selectionChecks(); mapChecks(); nativeMapChecks(); sheetChecks(); })().catch(error => { console.error(error); process.exitCode = 1; });
