const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const ts = require('typescript');
const file = path.resolve(__dirname, '../utils/bookingPresentation.ts');
const source = ts.transpileModule(fs.readFileSync(file, 'utf8'), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText;
const mod = { exports: {} };
vm.runInThisContext(`(function(require,module,exports){${source}\n})`)(require, mod, mod.exports);
const { matchesBookingStatus, filterBookingItems, bookingMatchesQuery } = mod.exports;
const item = (kind, status, id, createdAt = '2026-10-30') => ({
  kind, data: { id, status, createdAt, bookingCode: `CODE-${id}` },
});

function loadLocal(file, overrides = {}) {
  const code = ts.transpileModule(fs.readFileSync(path.resolve(__dirname, '..', file), 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const module = { exports: {} };
  vm.runInThisContext(`(function(require,module,exports){${code}\n})`)(
    name => name in overrides ? overrides[name] : name.startsWith('@/') ? loadLocal(`${name.slice(2)}.ts`, overrides) : require(name),
    module, module.exports,
  );
  return module.exports;
}

test('guide mapping retains chat user identity without substituting the provider profile', () => {
  const { mapGuideBooking } = loadLocal('services/guideBookingService.ts', {
    '@/services/api': {get: () => { throw new Error('Network disabled in this test'); }},
  });
  assert.equal(mapGuideBooking({providerId:'profile-1',providerUserId:'user-2'}).providerUserId, 'user-2');
  const absent = mapGuideBooking({providerId:'profile-1'});
  assert.equal(absent.providerUserId, undefined);
  assert.equal(absent.providerId, 'profile-1');
});

test('Upcoming includes provider approval states and excludes finished reservations', () => {
  for (const status of ['pending', 'confirmed', 'upcoming']) assert.ok(matchesBookingStatus(status, 'upcoming'));
  for (const status of ['completed', 'cancelled', 'unknown']) assert.equal(matchesBookingStatus(status, 'upcoming'), false);
  assert.ok(matchesBookingStatus('completed', 'completed'));
  assert.equal(matchesBookingStatus('pending', 'completed'), false);
});
test('service and status filters intersect for all four service types', () => {
  const items = ['transport', 'hotel', 'tour', 'guide'].flatMap(kind => [item(kind, 'pending', kind), item(kind, 'cancelled', `${kind}-cancelled`)]);
  for (const [category, kind] of [['transport','transport'], ['hotels','hotel'], ['tours','tour'], ['guides','guide']]) {
    assert.deepEqual(filterBookingItems(items, category, 'upcoming').map(x => x.data.id), [kind]);
  }
  assert.equal(filterBookingItems(items, 'all', 'cancelled').length, 4);
});
test('newest creation sorts first without mutating source and invalid dates sort last', () => {
  const items = [item('hotel','confirmed','old','2026-01-01'), item('guide','confirmed','invalid','invalid'), item('transport','confirmed','new','2026-10-30')];
  assert.deepEqual(filterBookingItems(items, 'all', 'upcoming').map(x => x.data.id), ['new','old','invalid']);
  assert.deepEqual(items.map(x => x.data.id), ['old','invalid','new']);
});
test('transport search handles loading metadata and finds enriched route, provider and seats', () => {
  const row = { ...item('transport','confirmed','ride'), data: {...item('transport','confirmed','ride').data, date:'2026-11-01',seats:['A1']} };
  assert.ok(bookingMatchesQuery(row, ' code-RIDE '));
  assert.equal(bookingMatchesQuery(row, 'Hunza'), false);
  const details = {trip:{from:'Islamabad',to:'Hunza',agency:{name:'Northern Express'},vehicleName:'Toyota Coaster'}};
  for(const query of [' HUNZA ','northern','coaster','A1']) assert.ok(bookingMatchesQuery(row,query,details));
});
test('hotel search uses actual property, city, room and check-in data', () => {
  const row={kind:'hotel',data:{id:'stay',bookingCode:'STAY-1',status:'confirmed',checkIn:'2026-11-03',checkOut:'2026-11-05'}};
  const details={hotel:{name:'Valley Lodge',location:{city:'Skardu'}},room:{name:'Mountain Suite'}};
  for(const query of ['lodge','skardu','suite','2026-11-03']) assert.ok(bookingMatchesQuery(row,query,details));
  assert.equal(bookingMatchesQuery(row,'Hunza',details),false);
});
test('tour and guide searches use service data and accept a cleared search', () => {
  const tour={kind:'tour',data:{id:'t',bookingCode:'TOUR-1',status:'pending',title:'Deosai excursion',destination:'Skardu',tourType:'private_tour',startDate:'2026-11-04'}};
  const guide={kind:'guide',data:{id:'g',bookingCode:'GUIDE-1',status:'pending',serviceName:'Old town walk',providerName:'Preview Guide',date:'2026-11-05',meetingPoint:'Fort gate'}};
  for(const query of ['Deosai','private_tour','Skardu']) assert.ok(bookingMatchesQuery(tour,query));
  for(const query of ['town','preview guide','Fort gate']) assert.ok(bookingMatchesQuery(guide,query));
  assert.ok(bookingMatchesQuery(guide,'   '));
  assert.equal(bookingMatchesQuery(guide,'Deosai'),false);
});
