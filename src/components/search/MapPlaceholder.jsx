import React, { useEffect, useRef, useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Layers,
  Star,
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
  Maximize2,
  ArrowRight,
  Home,
} from 'lucide-react';
import { getPropertyPOIs, calculateHaversineDistanceKm } from '../../utils/stayfinderAlgorithms';
import { useSearch } from '../../context/SearchContext';

// Map Tile Providers (Google Maps Road, Google Satellite Hybrid, Google Terrain, OpenStreetMap)
const TILE_LAYERS = {
  googleRoad: {
    name: 'Google Maps',
    url: 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}',
    attribution: 'Map data © Google',
  },
  googleSatellite: {
    name: 'Satellite',
    url: 'https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}',
    attribution: 'Imagery © Google',
  },
  googleTerrain: {
    name: 'Terrain',
    url: 'https://mt1.google.com/vt/lyrs=p&x={x}&y={y}&z={z}',
    attribution: 'Terrain © Google',
  },
  osm: {
    name: 'Street OSM',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap contributors',
  },
};

export const MapPlaceholder = ({
  properties = [],
  highlightedPropertyId = null,
  onPropertySelect = null,
  singlePropertyFocus = null,
  className = '',
}) => {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);

  const navigate = useNavigate();
  const { allProperties, userCoords, detectUserLocation } = useSearch();

  const [layerKey, setLayerKey] = useState('googleRoad');
  const [selectedPin, setSelectedPin] = useState(singlePropertyFocus || null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [showPOIs, setShowPOIs] = useState(true);
  const [showNearbyStays, setShowNearbyStays] = useState(true);

  // Combine passed properties with all properties when "Show Nearby Stays" is enabled on a single property page
  const mapProperties = useMemo(() => {
    if (singlePropertyFocus && showNearbyStays && allProperties.length > 0) {
      return allProperties;
    }
    return properties.length > 0 ? properties : allProperties;
  }, [properties, allProperties, singlePropertyFocus, showNearbyStays]);

  // Active focused property for POIs and distance calculation
  const activeFocusProperty =
    selectedPin || singlePropertyFocus || mapProperties[0] || null;

  // Compute nearby properties sorted by distance from the focused property
  const nearbyPropertiesList = useMemo(() => {
    if (!activeFocusProperty?.coordinates) return [];
    return allProperties
      .filter((p) => p.id !== activeFocusProperty.id && p.coordinates)
      .map((p) => ({
        ...p,
        distFromFocusKm: calculateHaversineDistanceKm(
          activeFocusProperty.coordinates,
          p.coordinates
        ),
      }))
      .sort((a, b) => (a.distFromFocusKm ?? 99999) - (b.distFromFocusKm ?? 99999))
      .slice(0, 5);
  }, [activeFocusProperty, allProperties]);

  // Generate real coordinate offsets for POIs around the active property
  const activePOIsWithCoords = useMemo(() => {
    if (!activeFocusProperty?.coordinates) return [];
    const baseLat = activeFocusProperty.coordinates.lat;
    const baseLng = activeFocusProperty.coordinates.lng;
    const offsets = [
      { dLat: 0.0045, dLng: -0.0055 },
      { dLat: -0.005, dLng: 0.0065 },
      { dLat: 0.006, dLng: 0.0045 },
      { dLat: -0.0035, dLng: -0.006 },
    ];
    return getPropertyPOIs(activeFocusProperty)
      .slice(0, 4)
      .map((poi, idx) => ({
        ...poi,
        lat: baseLat + offsets[idx % offsets.length].dLat,
        lng: baseLng + offsets[idx % offsets.length].dLng,
      }));
  }, [activeFocusProperty]);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = singlePropertyFocus?.coordinates
      ? [singlePropertyFocus.coordinates.lat, singlePropertyFocus.coordinates.lng]
      : mapProperties[0]?.coordinates
      ? [mapProperties[0].coordinates.lat, mapProperties[0].coordinates.lng]
      : [34.0259, -118.7798];

    const initialZoom = singlePropertyFocus ? 14 : 3;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: initialZoom,
      zoomControl: false,
      scrollWheelZoom: true,
    });

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const tileConfig = TILE_LAYERS[layerKey];
    const tileLayer = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 20,
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    markersLayerRef.current = markersLayer;

    // If multiple properties and no single focus, fit bounds to show them
    if (!singlePropertyFocus && mapProperties.length > 1) {
      const validCoords = mapProperties
        .filter((p) => p.coordinates?.lat != null && p.coordinates?.lng != null)
        .map((p) => [p.coordinates.lat, p.coordinates.lng]);
      if (validCoords.length > 1) {
        map.fitBounds(validCoords, { padding: [45, 45], maxZoom: 12 });
      }
    }

    setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Switch Tile Layer (Google Road / Google Satellite / Terrain / OSM)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const tileConfig = TILE_LAYERS[layerKey];
    tileLayerRef.current = L.tileLayer(tileConfig.url, {
      attribution: tileConfig.attribution,
      maxZoom: 20,
    }).addTo(map);
  }, [layerKey]);

  // Fly to singlePropertyFocus when property details page ID changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !singlePropertyFocus?.coordinates) return;
    setSelectedPin(singlePropertyFocus);
    map.flyTo(
      [singlePropertyFocus.coordinates.lat, singlePropertyFocus.coordinates.lng],
      14,
      { duration: 1.1 }
    );
  }, [singlePropertyFocus?.id]);

  // Render Property Price Markers, User GPS Marker & POI Markers
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();

    // 1. Render Property Price Pill Markers
    mapProperties.forEach((prop) => {
      if (!prop.coordinates || prop.coordinates.lat == null) return;
      const isSelected =
        selectedPin?.id === prop.id ||
        highlightedPropertyId === prop.id ||
        singlePropertyFocus?.id === prop.id;

      const bgColor = isSelected ? '#FF385C' : '#ffffff';
      const textColor = isSelected ? '#ffffff' : '#222222';
      const border = isSelected ? '2px solid #ffffff' : '1.5px solid #d1d5db';
      const scale = isSelected ? 'scale(1.12)' : 'scale(1)';
      const zIdx = isSelected ? 900 : 500;

      const priceIcon = L.divIcon({
        className: 'custom-stayfinder-price-pin',
        html: `
          <div style="
            background:${bgColor};
            color:${textColor};
            border:${border};
            transform:${scale};
            padding: 4px 10px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 12px;
            font-family: system-ui, sans-serif;
            box-shadow: 0 4px 12px rgba(0,0,0,0.22);
            white-space: nowrap;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            cursor: pointer;
            transition: all 0.15s ease;
          ">
            <span>$${prop.price}</span>
            <span style="font-size:10px; opacity:0.85;">★${prop.rating.toFixed(1)}</span>
          </div>
        `,
        iconSize: [76, 30],
        iconAnchor: [38, 15],
      });

      const marker = L.marker([prop.coordinates.lat, prop.coordinates.lng], {
        icon: priceIcon,
        zIndexOffset: zIdx,
      });

      marker.on('click', () => {
        setSelectedPOI(null);
        setSelectedPin(prop);
        if (onPropertySelect) onPropertySelect(prop);
        map.flyTo([prop.coordinates.lat, prop.coordinates.lng], Math.max(map.getZoom(), 13), {
          duration: 0.9,
        });
      });

      marker.addTo(markersLayer);
    });

    // 2. Render Nearby Points of Interest (POI) Pins around Active Property
    if (showPOIs && activePOIsWithCoords.length > 0) {
      activePOIsWithCoords.forEach((poi) => {
        const poiIcon = L.divIcon({
          className: 'custom-stayfinder-poi-pin',
          html: `
            <div style="
              background: #065f46;
              color: #ffffff;
              border: 2px solid #ffffff;
              padding: 3px 8px;
              border-radius: 9999px;
              font-weight: 700;
              font-size: 10px;
              font-family: system-ui, sans-serif;
              box-shadow: 0 3px 8px rgba(0,0,0,0.2);
              white-space: nowrap;
              cursor: pointer;
            ">
              📍 ${poi.name.length > 18 ? poi.name.slice(0, 18) + '…' : poi.name} (${poi.distanceKm}km)
            </div>
          `,
          iconSize: [140, 24],
          iconAnchor: [70, 12],
        });

        const poiMarker = L.marker([poi.lat, poi.lng], { icon: poiIcon, zIndexOffset: 300 });
        poiMarker.on('click', () => {
          setSelectedPin(null);
          setSelectedPOI(poi);
        });
        poiMarker.addTo(markersLayer);
      });
    }

    // 3. Render User GPS Location Marker if active
    if (userCoords?.lat != null && userCoords?.lng != null) {
      const gpsIcon = L.divIcon({
        className: 'custom-user-gps-pin',
        html: `
          <div style="
            background: #2563eb;
            color: #ffffff;
            border: 2px solid #ffffff;
            padding: 4px 9px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 10px;
            box-shadow: 0 0 0 6px rgba(37,99,235,0.25);
            white-space: nowrap;
          ">
            ● Your Location
          </div>
        `,
        iconSize: [100, 24],
        iconAnchor: [50, 12],
      });
      L.marker([userCoords.lat, userCoords.lng], { icon: gpsIcon, zIndexOffset: 1000 }).addTo(
        markersLayer
      );
    }
  }, [
    mapProperties,
    selectedPin,
    highlightedPropertyId,
    singlePropertyFocus,
    showPOIs,
    activePOIsWithCoords,
    userCoords,
  ]);

  const handleFitAllStays = (e) => {
    e.stopPropagation();
    const map = mapInstanceRef.current;
    if (!map || mapProperties.length === 0) return;
    const validCoords = mapProperties
      .filter((p) => p.coordinates?.lat != null && p.coordinates?.lng != null)
      .map((p) => [p.coordinates.lat, p.coordinates.lng]);
    if (validCoords.length > 0) {
      map.fitBounds(validCoords, { padding: [50, 50], maxZoom: 12 });
    }
  };

  const handleFlyToProperty = (prop) => {
    setSelectedPOI(null);
    setSelectedPin(prop);
    const map = mapInstanceRef.current;
    if (map && prop.coordinates) {
      map.flyTo([prop.coordinates.lat, prop.coordinates.lng], 14, { duration: 1.0 });
    }
  };

  return (
    <div className={`relative w-full h-full overflow-hidden bg-gray-100 ${className}`}>
      {/* Real Interactive Leaflet + Google Maps Tile Canvas */}
      <div ref={mapContainerRef} className="w-full h-full z-10" />

      {/* Top Controls Bar: Map Type Switcher, POI Toggle, Fit All, Near Me */}
      <div className="absolute top-3 left-3 right-3 z-20 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left Controls */}
        <div className="flex flex-wrap items-center gap-1.5 pointer-events-auto">
          {/* Map Style Pills (Google Maps / Satellite / Terrain) */}
          <div className="bg-white/95 backdrop-blur-xs rounded-2xl shadow-md border border-gray-200 p-1 flex items-center gap-1">
            {Object.entries(TILE_LAYERS).map(([key, cfg]) => (
              <button
                key={key}
                type="button"
                onClick={() => setLayerKey(key)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition cursor-pointer ${
                  layerKey === key
                    ? 'bg-dark text-white shadow-2xs'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                {cfg.name}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowPOIs(!showPOIs)}
            className={`px-3 py-1.5 rounded-2xl text-[11px] font-bold shadow-md border transition flex items-center gap-1 cursor-pointer ${
              showPOIs
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-white text-dark border-gray-200'
            }`}
          >
            <Compass className="w-3.5 h-3.5" />
            <span>POIs</span>
          </button>

          <button
            type="button"
            onClick={handleFitAllStays}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-gray-50 text-dark text-[11px] font-bold shadow-md border border-gray-200 flex items-center gap-1 cursor-pointer"
            title="Zoom out to see all properties on the map"
          >
            <Maximize2 className="w-3 h-3 text-airbnb" />
            <span>Show All ({mapProperties.length})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              detectUserLocation((coords) => {
                const map = mapInstanceRef.current;
                if (map) {
                  map.flyTo([coords.lat, coords.lng], 11, { duration: 1.1 });
                }
              });
            }}
            className="px-3 py-1.5 rounded-2xl bg-white hover:bg-gray-50 text-airbnb text-[11px] font-bold shadow-md border border-gray-200 flex items-center gap-1 cursor-pointer"
            title="Center map on your location"
          >
            <Navigation className="w-3 h-3" />
            <span>Near Me</span>
          </button>
        </div>

        {/* Quick Jump Selector to Any Property on Map */}
        <div className="pointer-events-auto">
          <select
            value={selectedPin?.id || ''}
            onChange={(e) => {
              const found = mapProperties.find((p) => p.id === e.target.value);
              if (found) handleFlyToProperty(found);
            }}
            className="px-3 py-1.5 rounded-2xl bg-white/95 backdrop-blur-xs shadow-md border border-gray-200 text-xs font-bold text-dark focus:outline-none cursor-pointer max-w-[220px]"
          >
            <option value="">Jump to stay on map...</option>
            {mapProperties.map((p) => (
              <option key={p.id} value={p.id}>
                {p.city} — ${p.price}/nt ({p.rating}★)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Nearby Stays Quick Chips Strip at Bottom Left */}
      {nearbyPropertiesList.length > 0 && (
        <div className="absolute bottom-3 left-3 z-20 max-w-[75%] overflow-x-auto no-scrollbar flex items-center gap-1.5 bg-white/90 backdrop-blur-xs p-1.5 rounded-2xl shadow-md border border-gray-200">
          <span className="text-[10px] font-extrabold uppercase text-secondary px-2 shrink-0">
            Other Stays on Map:
          </span>
          {nearbyPropertiesList.map((np) => (
            <button
              key={np.id}
              type="button"
              onClick={() => handleFlyToProperty(np)}
              className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-dark hover:text-white text-[11px] font-bold text-dark transition shrink-0 cursor-pointer flex items-center gap-1"
            >
              <span>{np.city}</span>
              <span className="text-airbnb">${np.price}</span>
            </button>
          ))}
        </div>
      )}

      {/* Selected POI Info Card */}
      {selectedPOI && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 w-72 bg-white rounded-2xl shadow-2xl border border-emerald-300 p-4 space-y-1.5 animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
              {selectedPOI.category}
            </span>
            <button
              type="button"
              onClick={() => setSelectedPOI(null)}
              className="text-secondary hover:text-dark cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs font-extrabold text-dark">{selectedPOI.name}</p>
          <p className="text-[11px] text-secondary">
            <strong>{selectedPOI.distanceKm} km</strong> from stay ·{' '}
            <strong>{selectedPOI.walkMins} mins walk</strong>
          </p>
        </div>
      )}

      {/* Selected Property Interactive Card on Map */}
      {selectedPin && (
        <div className="absolute bottom-14 left-1/2 -translate-x-1/2 z-30 w-80 bg-white rounded-3xl shadow-2xl border border-borderLight overflow-hidden animate-fade-in">
          <button
            type="button"
            onClick={() => setSelectedPin(null)}
            className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-dark shadow-md cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="aspect-16/9 w-full overflow-hidden bg-gray-100 relative">
            <img
              src={selectedPin.images?.[0]}
              alt={selectedPin.title}
              className="w-full h-full object-cover"
            />
            <span className="absolute bottom-2 left-2.5 px-2.5 py-0.5 rounded-full bg-dark/85 text-white text-[10px] font-bold">
              {selectedPin.type}
            </span>
          </div>

          <div className="p-4 space-y-2.5">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-dark">
                <span className="truncate max-w-[190px]">
                  {selectedPin.city}, {selectedPin.country}
                </span>
                <span className="flex items-center gap-0.5 shrink-0">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  {selectedPin.rating?.toFixed(2)} ({selectedPin.reviewCount})
                </span>
              </div>
              <p className="text-xs text-secondary truncate mt-0.5">{selectedPin.title}</p>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-gray-100">
              <div>
                <span className="text-base font-extrabold text-dark">${selectedPin.price}</span>
                <span className="text-xs text-secondary"> / night</span>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedPin.coordinates && (
                  <a
                    href={`https://www.google.com/maps?q=${selectedPin.coordinates.lat},${selectedPin.coordinates.lng}`}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-gray-200 hover:border-dark text-dark transition"
                    title="Open in Google Maps"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => navigate(`/rooms/${selectedPin.id}`)}
                  className="px-3.5 py-2 rounded-xl bg-airbnb hover:bg-airbnb-hover text-white text-xs font-bold flex items-center gap-1 shadow-sm transition cursor-pointer"
                >
                  <span>Choose Stay</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
