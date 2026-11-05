// Read-only checkout preview: native primitives are rendered as HTML; all services/stores are fixtures.
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '../..');
const appRequire = createRequire(path.join(root, 'package.json'));
const React = appRequire('react');
const { renderToStaticMarkup } = appRequire('react-dom/server');
const ts = appRequire('typescript');
const glyphs = appRequire('@expo/vector-icons/build/vendor/react-native-vector-icons/glyphmaps/Ionicons.json');

function createCheckoutHarness(options = {}) {
  const events = [], navigation = [];
  const trip = { id:'trip1', from:'Islamabad', to:'Hunza', date:'2026-11-15', departureTime:'07:00', price:3200, currency:'PKR', status:'scheduled', availableSeats:8, totalSeats:12, vehicleType:'van', vehicleName:'Toyota Hiace', vehicleClass:'van', agencyId:'provider1', agency:{ name:'Karakoram Journeys', id:'provider1', phone:'', verified:true }, journeyType:'one_way' };
  const points = [{ id:'pickup1', name:'Faizabad Terminal', address:'Main terminal, Islamabad', time:'06:45', distanceKm:0, coordinates:{ latitude:33.65,longitude:73.08 } }, { id:'pickup2',name:'G-9 Markaz',address:'Main bus stop, Islamabad',time:'07:00',distanceKm:0,coordinates:{latitude:33.69,longitude:73.04} }];
  const breakdown={ticketPrice:6400,serviceFee:150,discount:0,total:6550,currency:'PKR'};
  const layout={rows:4,columns:3,aisleAfterColumn:2,seats:Array.from({length:12},(_,i)=>({id:'s'+i,label:String(i+1),row:Math.floor(i/3)+1,column:i%3+1,status:i===5?'occupied':i===8?'reserved':'available',price:3200}))};
  const account={id:'account1',channel:'bank',bankName:'Provider bank',accountTitle:'Karakoram Journeys',accountNumber:'TEST-ACCOUNT',iban:'TEST-IBAN'};
  const payment={id:'pay1', bookingId:'book1',providerId:'provider1',amount:6550,currency:'PKR',method:'bankTransfer',status:options.paymentStatus||'payment_initiated',receivingAccount:account,transactionId:'PREVIEW-001',summary:{title:'Islamabad → Hunza',providerName:'Karakoram Journeys',bookingNumber:'BNJ-PREVIEW',subtotal:6400,tax:0,serviceFee:150,discount:0},expiresAt:'2099-11-15T07:00:00Z'};
  const state={ selectedTrip:trip,selectedPickup:points[0],selectedSeats:['2','3'],passengerDetails:{name:'',email:'',phone:''},priceBreakdown:breakdown,lastBooking:{id:'book1',bookingCode:'BNJ-PREVIEW',tripId:'trip1',seats:['2','3'],status:options.bookingStatus||'pending',paymentStatus:'pending',priceBreakdown:breakdown},setPickup:p=>{state.selectedPickup=p;},toggleSeat:label=>{state.selectedSeats=state.selectedSeats.includes(label)?state.selectedSeats.filter(s=>s!==label):[...state.selectedSeats,label];},pruneUnavailableSeats:()=>{},setPassengerDetails:patch=>Object.assign(state.passengerDetails,patch),setPaymentMethod:()=>{},confirmBooking:async()=>{ throw Error('Preview cannot create bookings'); },isSubmitting:false,...options.state };
  if(options.offline)Object.assign(state,{selectedTrip:null,selectedPickup:null,priceBreakdown:null,lastBooking:null});
  const userStore=selector=>selector({settings:{darkMode:Boolean(options.dark)},user:null});
  const bookingStore=selector=>selector?selector(state):state;bookingStore.getState=()=>state;
  const cache=new Map();let currentScreen='';
  const flatten=value=>Array.isArray(value)?Object.assign({},...value.filter(Boolean).map(flatten)):value||{};
  function css(value) {
    const result={...flatten(value)};
    for(const [from,tos] of Object.entries({paddingHorizontal:['paddingLeft','paddingRight'],paddingVertical:['paddingTop','paddingBottom'],marginHorizontal:['marginLeft','marginRight'],marginVertical:['marginTop','marginBottom']}))if(result[from]!=null){tos.forEach(to=>result[to]=result[from]);delete result[from];}
    if(typeof result.lineHeight==='number')result.lineHeight+='px';
    if(Array.isArray(result.transform))result.transform=result.transform.flatMap(item=>Object.entries(item).map(([key,v])=>`${key}(${typeof v==='number'&&!key.startsWith('scale')?v+'px':v})`)).join(' ');
    for(const key of ['includeFontPadding','textAlignVertical','elevation','shadowColor','shadowOffset','shadowOpacity','shadowRadius','writingDirection'])delete result[key];
    if(result.borderWidth&&!result.borderStyle)result.borderStyle='solid';
    for(const side of ['Top','Bottom','Left','Right'])if(result['border'+side+'Width']&&!result['border'+side+'Style'])result['border'+side+'Style']='solid';
    return result;
  }
  const base={display:'flex',flexDirection:'column',boxSizing:'border-box',minWidth:0,flexShrink:0,borderWidth:0,position:'relative'};
  const View=({children,style,accessibilityLabel,accessibilityRole})=>React.createElement('div',{'aria-label':accessibilityLabel,role:accessibilityRole==='header'?'heading':undefined,style:{...base,...css(style)}},children);
  const Text=({children,style,accessibilityRole,numberOfLines})=>React.createElement('span',{role:accessibilityRole==='header'?'heading':undefined,style:{...css(style),...(numberOfLines?{overflow:'hidden',display:'-webkit-box',WebkitLineClamp:numberOfLines,WebkitBoxOrient:'vertical'}:{})}},children);
  const Pressable=({children,style,onPress,disabled,accessibilityLabel,accessibilityRole,accessibilityState})=>{if(onPress)events.push({label:accessibilityLabel,disabled:Boolean(disabled),onPress,role:accessibilityRole,selected:accessibilityState?.selected});return React.createElement('button',{'aria-label':accessibilityLabel,disabled,style:{...base,appearance:'none',textAlign:'left',font:'inherit',background:'transparent',padding:0,...css(typeof style==='function'?style({pressed:false}):style)}},children);};
  const ScrollView=React.forwardRef(({children,style,contentContainerStyle,horizontal},ref)=>React.createElement('div',{ref,style:{...base,flexGrow:1,flexShrink:1,flexBasis:0,overflow:horizontal?'auto':'hidden auto',...css(style)}},React.createElement('div',{style:{...base,flexDirection:horizontal?'row':'column',...css(contentContainerStyle)}},children)));
  const TextInput=React.forwardRef(({style,value,placeholder,multiline,accessibilityLabel,editable},ref)=>React.createElement(multiline?'textarea':'input',{ref,defaultValue:value,placeholder,'aria-label':accessibilityLabel,disabled:editable===false,style:{font:'inherit',outline:0,border:0,background:'transparent',minWidth:0,...css(style)}}));
  const Image=({source,style})=>React.createElement('img',{src:typeof source==='string'?source:source?.uri,alt:'',style:{objectFit:'contain',...css(style)}});
  const native={View,Text,Pressable,ScrollView,TextInput,Image,KeyboardAvoidingView:View,ActivityIndicator:()=>React.createElement(Text,null,'Loading…'),RefreshControl:()=>null,Modal:({visible,children})=>visible?children:null,FlatList:({data,renderItem})=>data.map((item,index)=>renderItem({item,index})),StyleSheet:{create:s=>s,hairlineWidth:1,absoluteFill:{position:'absolute',inset:0}},Platform:{OS:'android',select:v=>v.android??v.default},Alert:{alert:()=>{}},Keyboard:{addListener:()=>({remove(){}}),dismiss(){}},useWindowDimensions:()=>({width:390,height:844}),Dimensions:{get:()=>({width:390,height:844})}};
  const router={push:value=>navigation.push(value),replace:value=>navigation.push(value),back:()=>navigation.push('back'),canGoBack:()=>false};
  const icon=({name,size,color,style})=>React.createElement('span',{'aria-hidden':true,style:{fontFamily:'Ionicons',fontSize:size,lineHeight:1,color,...css(style)}},String.fromCodePoint(glyphs[name]||0x25cb));
  function resolve(file,name) {
    if(name==='react')return {...React,useState:initial=>React.useState(initial===true?false:(file.endsWith('/booking/payment.tsx')&&initial===null?'bankTransfer':initial))};
    if(name==='react-native')return native;
    if(name==='react-native-reanimated')return {__esModule:true,default:{View,createAnimatedComponent:c=>c},useSharedValue:v=>({value:v}),useAnimatedStyle:f=>f(),withSpring:v=>v,withTiming:v=>v};
    if(name==='@expo/vector-icons')return {Ionicons:icon};
    if(name==='expo-image')return {Image};
    if(name==='expo-router')return {router,useLocalSearchParams:()=>({id:'trip1',paymentId:'pay1',bookingId:'book1',method:'bankTransfer'}),useFocusEffect:()=>{}};
    if(name==='react-native-safe-area-context')return {useSafeAreaInsets:()=>({top:24,bottom:16,left:0,right:0})};
    if(name==='expo-clipboard')return {setStringAsync:async()=>{}};
    if(name==='@/utils/themeModeCache')return {getCachedDarkMode:()=>Boolean(options.dark)};
    if(name==='@/store/userStore')return {useUserStore:userStore};
    if(name==='@/store/bookingStore')return {useBookingStore:bookingStore};
    if(name==='@/store/authStore')return {useAuthStore:selector=>selector({user:null})};
    if(name==='@/store/hotelStore')return {useHotelStore:Object.assign(()=>()=>{},{getState:()=>({setDestination(){},setCheckIn(){},setCheckOut(){}})})};
    if(name==='@/store/paymentProofDraftStore')return {usePaymentProofDraftStore:{getState:()=>({drafts:{},save(){},remove(){}})}};
    if(name==='@/components/auth/AuthContext')return {AuthContext:React.createContext({})};
    if(name==='@/hooks/useBackendFocusEffect')return {useBackendFocusEffect:()=>{}};
    if(name==='@/hooks/useBackendData')return {useBackendStatus:()=>options.offline?'offline':'online',useBackendEffect:React.useEffect,useBackendState:initial=>{
      let value=initial;
      if(file.includes('ChoosePickupScreen'))value=options.offline?[]:points;
      else if(file.includes('/seat/'))value=options.offline||options.noLayout?null:layout;
      else if(file.includes('/payments/')&&!file.includes('PaymentChat'))value=Array.isArray(initial)?(options.offline?[]:[account]):options.offline?null:payment;
      return [value,()=>{}];
    }};
    if(name==='@/hooks/useLocation')return {useLocation:()=>({location:null,request:async()=>{}})};
    if(name==='@/hooks/useProviderPaymentMethods')return {useProviderPaymentMethods:()=>({methods:options.noMethods?[]:load('constants/payments.ts').CUSTOMER_PAYMENT_METHODS.filter(m=>['bankTransfer','easypaisa','jazzcash','raast'].includes(m.id)),defaultMethodId:'bankTransfer',hasAccounts:!options.noMethods,loading:false,error:options.noMethods?'Payment methods unavailable':'',reload(){}})};
    if(name==='@/components/map/PickupMap')return {PickupMap:()=>React.createElement(View,{style:{height:220,backgroundColor:options.dark?'#24363B':'#E4F2F0',alignItems:'center',justifyContent:'center'}},React.createElement(icon,{name:'map-outline',size:35,color:'#006D6A'}),React.createElement(Text,null,'Provider boarding points · map preview'))};
    if(name==='@/utils/navigation')return {paramId:v=>Array.isArray(v)?v[0]:v,safeBack:p=>router.push(p),pushPath:p=>router.push(p)};
    if(name==='@/services/apiError')return {getApiErrorMessage:e=>e.message};
    if(name.startsWith('@/services/'))return new Proxy({}, {get:()=>async()=>{throw Error('Network is disabled in checkout preview');}});
    if(name.endsWith('.png')||name.endsWith('.jpg'))return '/assets/'+name.split('assets/')[1];
    if(name.startsWith('@/'))return load(name.slice(2));
    if(name.startsWith('.'))return load(path.relative(root,path.resolve(root,path.dirname(file),name)));
    return appRequire(name);
  }
  function load(relative) {
    const absolute=path.resolve(root,relative);const file=[absolute,absolute+'.ts',absolute+'.tsx'].find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
    if(!file)throw Error('Missing preview import '+relative);
    const name=path.relative(root,file).replaceAll('\\','/');
    if(cache.has(name))return cache.get(name).exports;
    const module={exports:{}};cache.set(name,module);
    const output=ts.transpileModule(fs.readFileSync(file,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,jsx:ts.JsxEmit.ReactJSX,esModuleInterop:true}}).outputText;
    vm.runInThisContext(`(function(require,module,exports){${output}\n})`,{filename:name})(dep=>resolve(name,dep),module,module.exports);
    return module.exports;
  }
  function render(screen) {events.length=0;currentScreen=screen;const Component=load(screen).default;return renderToStaticMarkup(React.createElement(Component));}
  return {render,events,navigation,state,load,root};
}
module.exports={createCheckoutHarness};
