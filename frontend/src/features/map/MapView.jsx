import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
  pinIcon, pinIconEdit, InvalidateOnMount, MapClickHandler, RegionDetector,
  MARKER_RADIUS_M, LOCATION_RADIUS_M, MARKER_COLOR, MARKER_EDIT_COLOR, LOCATE_BLUE,
} from './mapUtils';

const locationIcon = L.divIcon({
  className: '',
  html: `<div style="width:14px;height:14px;background:${LOCATE_BLUE};border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 4px rgba(90,169,230,0.25),0 0 12px rgba(90,169,230,0.6)"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function FlyToLocation({ position }) {
  const map = useMap();
  useEffect(() => {
    if (position) map.flyTo(position, Math.max(map.getZoom(), 10), { duration: 1.2 });
  }, [position]);
  return null;
}

// Renders the Leaflet map and all its layers. Stateless: marker data and edit
// state come in as props; user interactions are reported via callbacks.
export default function MapView({ displayMarkers, editing, userLocation, onAddMarker, onRemoveMarker, onRegion }) {
  return (
    <MapContainer
      center={[20, 0]}
      zoom={2}
      minZoom={1}
      maxZoom={18}
      style={{ height: '100%', width: '100%' }}
      worldCopyJump={true}
    >
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
      />
      <MapClickHandler editing={editing} onAdd={onAddMarker} />
      <RegionDetector onRegion={onRegion} />
      {userLocation && <FlyToLocation position={userLocation} />}
      {userLocation && (
        <>
          <Circle
            center={userLocation}
            radius={LOCATION_RADIUS_M}
            pathOptions={{ color: LOCATE_BLUE, fillColor: LOCATE_BLUE, fillOpacity: 0.12, weight: 1, opacity: 0.4 }}
          />
          <Marker position={userLocation} icon={locationIcon} />
        </>
      )}
      {displayMarkers.map((pos, i) => (
        <React.Fragment key={i}>
          <Circle
            center={pos}
            radius={MARKER_RADIUS_M}
            pathOptions={{
              color: editing ? MARKER_EDIT_COLOR : MARKER_COLOR,
              fillColor: editing ? MARKER_EDIT_COLOR : MARKER_COLOR,
              fillOpacity: 0.15,
              weight: 1.5,
              opacity: 0.6,
            }}
          />
          <Marker
            position={pos}
            icon={editing ? pinIconEdit : pinIcon}
            eventHandlers={editing ? {
              click(e) { L.DomEvent.stopPropagation(e); onRemoveMarker(i); },
            } : {}}
          />
        </React.Fragment>
      ))}
      <InvalidateOnMount />
    </MapContainer>
  );
}
