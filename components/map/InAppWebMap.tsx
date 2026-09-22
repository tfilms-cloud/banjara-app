import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import {
  isValidCoord,
  regionForPoints,
  type MapPerson,
  type MapVehicleInfo,
} from '@/components/map/mapHelpers';
import { Colors } from '@/constants/colors';
import { Radius } from '@/constants/spacing';
import type { Coordinates } from '@/types/route';

export type InAppMapMarker = {
  id: string;
  title: string;
  subtitle?: string;
  coordinate: Coordinates;
  selected?: boolean;
};

type InAppWebMapProps = {
  markers: InAppMapMarker[];
  userLocation?: Coordinates | null;
  traveler?: MapPerson | null;
  vehicle?: MapVehicleInfo | null;
  showRoute?: boolean;
  /** Road-following path (lat/lng). Prefer over straight line. */
  roadRoute?: Coordinates[] | null;
  height?: number;
  fill?: boolean;
  onSelectMarker?: (id: string) => void;
  /** When set, tapping the map reports a coordinate (drop-pin). */
  onPressMap?: (coordinate: Coordinates) => void;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function initials(name: string) {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function buildHtml(
  markers: InAppMapMarker[],
  userLocation?: Coordinates | null,
  showRoute?: boolean,
  traveler?: MapPerson | null,
  vehicle?: MapVehicleInfo | null,
  roadRoute?: Coordinates[] | null,
  dropPin = false
) {
  const points = markers
    .filter((m) => isValidCoord(m.coordinate))
    .map((m) => ({
      id: m.id,
      title: m.title,
      subtitle: m.subtitle ?? '',
      lat: m.coordinate.latitude,
      lng: m.coordinate.longitude,
      selected: Boolean(m.selected),
    }));

  const roadLatLng =
    roadRoute && roadRoute.length > 1
      ? roadRoute.filter(isValidCoord).map((c) => [c.latitude, c.longitude] as [number, number])
      : null;

  const selected = points.find((p) => p.selected) ?? points[0];
  const straightFallback =
    showRoute && isValidCoord(userLocation) && selected
      ? ([
          [userLocation.latitude, userLocation.longitude],
          [selected.lat, selected.lng],
        ] as [number, number][])
      : null;

  const routePath = showRoute ? roadLatLng ?? straightFallback : null;

  const region = regionForPoints(
    [
      ...points.map((p) => ({ latitude: p.lat, longitude: p.lng })),
      ...(isValidCoord(userLocation) ? [userLocation] : []),
      ...(roadRoute ?? []),
    ],
    points[0]
      ? { latitude: points[0].lat, longitude: points[0].lng }
      : { latitude: 33.6844, longitude: 73.0479 }
  );

  const travelerPayload = traveler
    ? {
        name: escapeHtml(traveler.name),
        initials: escapeHtml(initials(traveler.name || 'You')),
        avatarUrl: traveler.avatarUrl ? escapeHtml(traveler.avatarUrl) : '',
        phone: traveler.phone ? escapeHtml(traveler.phone) : '',
      }
    : null;

  const vehiclePayload = vehicle
    ? {
        name: escapeHtml(vehicle.name),
        agency: escapeHtml(vehicle.agencyName || vehicle.name),
        plate: vehicle.plate ? escapeHtml(vehicle.plate) : '',
        initials: escapeHtml(initials(vehicle.agencyName || vehicle.name || 'V')),
        logo: vehicle.agencyLogo
          ? escapeHtml(vehicle.agencyLogo)
          : vehicle.imageUrl
            ? escapeHtml(vehicle.imageUrl)
            : '',
      }
    : null;

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <style>
    html, body, #map { margin:0; padding:0; height:100%; width:100%; background:#E6F2F0; }
    .pin {
      background:#134E4A; color:#fff; border:2px solid #fff; border-radius:999px;
      width:28px; height:28px; display:flex; align-items:center; justify-content:center;
      font:700 12px/1 system-ui,sans-serif; box-shadow:0 2px 8px rgba(0,0,0,.25);
    }
    .pin.selected { background:#C2410C; transform:scale(1.08); }
    .person-mark, .vehicle-mark {
      display:flex; flex-direction:column; align-items:center; gap:2px;
    }
    .avatar {
      width:36px; height:36px; border-radius:999px; border:3px solid #fff;
      background:#DC2626; color:#fff; display:flex; align-items:center; justify-content:center;
      font:700 11px/1 system-ui,sans-serif; box-shadow:0 0 0 4px rgba(220,38,38,.28), 0 2px 10px rgba(0,0,0,.28);
      overflow:hidden;
    }
    .avatar img { width:100%; height:100%; object-fit:cover; }
    .avatar.provider { background:#134E4A; box-shadow:0 2px 10px rgba(0,0,0,.28); }
    .label {
      background:rgba(15,61,58,.92); color:#fff; border-radius:999px;
      padding:2px 8px; font:600 10px/1.2 system-ui,sans-serif; white-space:nowrap;
      max-width:120px; overflow:hidden; text-overflow:ellipsis;
    }
    .label.traveler { background:#DC2626; }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <script>
    const markers = ${JSON.stringify(points)};
    const user = ${JSON.stringify(
      isValidCoord(userLocation)
        ? { lat: userLocation.latitude, lng: userLocation.longitude }
        : null
    )};
    const traveler = ${JSON.stringify(travelerPayload)};
    const vehicle = ${JSON.stringify(vehiclePayload)};
    const routePath = ${JSON.stringify(routePath)};
    const map = L.map('map', { zoomControl: true }).setView(
      [${region.latitude}, ${region.longitude}],
      12
    );
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap'
    }).addTo(map);

    const bounds = [];
    markers.forEach((m, index) => {
      const icon = L.divIcon({
        className: '',
        html: '<div class="pin ' + (m.selected ? 'selected' : '') + '">' + (index + 1) + '</div>',
        iconSize: [28, 28],
        iconAnchor: [14, 28],
      });
      const marker = L.marker([m.lat, m.lng], { icon }).addTo(map);
      marker.bindPopup('<strong>' + m.title + '</strong><br/>' + (m.subtitle || ''));
      marker.on('click', () => {
        window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'select', id: m.id }));
      });
      bounds.push([m.lat, m.lng]);

      if (m.selected && vehicle) {
        const logoHtml = vehicle.logo
          ? '<img src="' + vehicle.logo + '" alt="" />'
          : vehicle.initials;
        const vIcon = L.divIcon({
          className: '',
          html: '<div class="vehicle-mark"><div class="avatar provider">' + logoHtml + '</div><div class="label">' + vehicle.agency + '</div></div>',
          iconSize: [48, 56],
          iconAnchor: [24, -8],
        });
        L.marker([m.lat, m.lng], { icon: vIcon, interactive: false }).addTo(map);
      }
    });

    if (user) {
      const name = traveler ? traveler.name : 'You';
      const avatarInner = traveler && traveler.avatarUrl
        ? '<img src="' + traveler.avatarUrl + '" alt="" />'
        : (traveler ? traveler.initials : 'You');
      const userIcon = L.divIcon({
        className: '',
        html: '<div class="person-mark"><div class="avatar">' + avatarInner + '</div><div class="label traveler">' + name + '</div></div>',
        iconSize: [48, 56],
        iconAnchor: [24, 28],
      });
      const popup = traveler
        ? '<strong>' + traveler.name + '</strong> (traveler)<br/>' + (traveler.phone || 'Your location')
        : 'You are here';
      L.marker([user.lat, user.lng], { icon: userIcon }).addTo(map).bindPopup(popup);
      L.circle([user.lat, user.lng], {
        radius: 90,
        color: '#DC2626',
        weight: 2,
        fillColor: '#DC2626',
        fillOpacity: 0.12,
      }).addTo(map);
      bounds.push([user.lat, user.lng]);
    }

    if (routePath && routePath.length > 1) {
      // Blue = exact road route for distance
      L.polyline(routePath, {
        color: '#0F9B98',
        weight: 5,
        opacity: 0.92,
        lineJoin: 'round',
        lineCap: 'round',
      }).addTo(map);

      // Red = traveler start segment (first stretch of the path)
      const redEnd = Math.min(12, Math.max(2, Math.floor(routePath.length * 0.08)));
      const travelerSegment = routePath.slice(0, redEnd);
      if (travelerSegment.length > 1) {
        L.polyline(travelerSegment, {
          color: '#DC2626',
          weight: 6,
          opacity: 0.95,
          lineJoin: 'round',
          lineCap: 'round',
        }).addTo(map);
      }

      routePath.forEach(function (pt) { bounds.push(pt); });
    }

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [48, 48] });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], ${dropPin ? 16 : 14});
    }

    ${
      dropPin
        ? `map.on('click', function (e) {
      window.ReactNativeWebView && window.ReactNativeWebView.postMessage(JSON.stringify({
        type: 'press',
        latitude: e.latlng.lat,
        longitude: e.latlng.lng
      }));
    });`
        : ''
    }
  </script>
</body>
</html>`;
}

export function InAppWebMap({
  markers,
  userLocation,
  traveler,
  vehicle,
  showRoute,
  roadRoute,
  height,
  fill = false,
  onSelectMarker,
  onPressMap,
}: InAppWebMapProps) {
  const html = useMemo(
    () =>
      buildHtml(
        markers,
        userLocation,
        showRoute,
        traveler,
        vehicle,
        roadRoute,
        Boolean(onPressMap)
      ),
    [markers, userLocation, showRoute, traveler, vehicle, roadRoute, onPressMap]
  );

  const resolvedHeight = fill ? undefined : (height ?? 280);

  return (
    <View
      style={[styles.wrap, fill ? [styles.fill, styles.wrapFill] : { height: resolvedHeight }]}
    >
      <WebView
        originWhitelist={['*']}
        source={{ html }}
        style={styles.web}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data) as {
              type?: string;
              id?: string;
              latitude?: number;
              longitude?: number;
            };
            if (data.type === 'select' && data.id) onSelectMarker?.(data.id);
            if (
              data.type === 'press' &&
              typeof data.latitude === 'number' &&
              typeof data.longitude === 'number'
            ) {
              onPressMap?.({ latitude: data.latitude, longitude: data.longitude });
            }
          } catch {
            // ignore
          }
        }}
        javaScriptEnabled
        domStorageEnabled
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback
        nestedScrollEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius['2xl'],
    overflow: 'hidden',
    backgroundColor: Colors.primarySoft,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  wrapFill: {
    borderRadius: 0,
    borderWidth: 0,
    flex: 1,
  },
  fill: {
    flex: 1,
  },
  web: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
