/** Dedicated picker map: the center pin is drawn once by the native overlay. */
export function createLocationMapHtml(latitude: number, longitude: number, interactive: boolean, pinMode: 'center' | 'tap', topInset = 0, bottomInset = 0): string {
  return `<!DOCTYPE html><html><head>
<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"/>
<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>
<style>
html,body,#map{margin:0;width:100%;height:100%;background:#e6f2f0;overflow:hidden}
.leaflet-container{font-family:system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.leaflet-control-zoom{border:1px solid #dbe4e2!important;border-radius:12px!important;overflow:hidden;box-shadow:0 2px 8px #163c3420!important;margin:12px!important;margin-top:${12 + topInset}px!important}
.leaflet-control-zoom a{width:36px!important;height:36px!important;line-height:36px!important;color:#134e4a!important;font-size:23px!important}
.leaflet-control-attribution{font:10px/16px system-ui,sans-serif!important;padding:1px 5px!important;background:#ffffffe6!important;margin-bottom:${bottomInset}px!important}
</style></head><body><div id="map"></div>
<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script><script>
(function(){
  function post(data){if(window.ReactNativeWebView)window.ReactNativeWebView.postMessage(JSON.stringify(data));}
  if(!window.L){post({type:'error'});return;}
  var enabled=${JSON.stringify(interactive)}, tap=${JSON.stringify(pinMode === 'tap')}, suppress=false;
  var map=L.map('map',{zoomControl:false,dragging:enabled,touchZoom:enabled,scrollWheelZoom:enabled,doubleClickZoom:enabled,boxZoom:false,keyboard:enabled}).setView([${latitude},${longitude}],16);
  map.attributionControl.setPrefix('<a href="https://leafletjs.com">Leaflet</a>');
  if(enabled)L.control.zoom({position:'topright'}).addTo(map);
  var tiles=L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',{maxZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'}).addTo(map);
  var marker=null;
  if(tap){
    var icon=L.divIcon({className:'',html:'<svg width="36" height="44" viewBox="0 0 40 48"><path d="M20 1C9.5 1 2 8.5 2 18c0 12 18 29 18 29s18-17 18-29C38 8.5 30.5 1 20 1Z" fill="#16a66e" stroke="white" stroke-width="2"/><circle cx="20" cy="18" r="6" fill="white"/></svg>',iconSize:[36,44],iconAnchor:[18,44]});
    marker=L.marker([${latitude},${longitude}],{icon:icon,draggable:enabled}).addTo(map);
    marker.on('dragstart',function(){post({type:'moving'});});
    marker.on('dragend',function(){var p=marker.getLatLng();post({type:'settled',latitude:p.lat,longitude:p.lng});});
  }
  function settled(){if(suppress||!enabled||tap)return;var p=map.getCenter();post({type:'settled',latitude:p.lat,longitude:p.lng});}
  map.on('movestart',function(){if(!suppress&&enabled&&!tap)post({type:'moving'});});
  map.on('moveend',settled);
  if(enabled)map.on('click',function(e){
    if(tap){marker.setLatLng(e.latlng);post({type:'settled',latitude:e.latlng.lat,longitude:e.latlng.lng});}
    else map.panTo(e.latlng,{animate:false});
  });
  window.setPickerCoordinate=function(lat,lng){
    suppress=true;
    if(marker)marker.setLatLng([lat,lng]);
    map.setView([lat,lng],map.getZoom(),{animate:false});
    suppress=false;
  };
  tiles.on('tileerror',function(){post({type:'tileError'});});
  window.addEventListener('resize',function(){map.invalidateSize();});
  post({type:'ready'});
})();</script></body></html>`;
}
