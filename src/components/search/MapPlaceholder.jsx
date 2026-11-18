import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Minus,
  Layers,
  Star,
  X,
  MapPin,
  Navigation,
  ExternalLink,
  Compass,
} from 'lucide-react';
import { getPropertyPOIs } from '../../utils/stayfinderAlgorithms';

export const MapPlaceholder = ({
  properties = [],
  highlightedPropertyId = null,
  onPropertySelect = null,
  className = '',
}) => {
  const [zoom, setZoom] = useState(12);
  const [selectedPin, setSelectedPin] = useState(null);
  const [selectedPOI, setSelectedPOI] = useState(null);
  const [showPOIs, setShowPOIs] = useState(true);
  const [mapStyle, setMapStyle] = useState('standard'); // 'standard', 'satellite', 'dark'

  const pinPositions = [
    { top: '35%', left: '42%' },
    { top: '22%', left: '60%' },
    { top: '48%', left: '28%' },
    { top: '65%', left: '55%' },
    { top: '30%', left: '75%' },
    { top: '58%', left: '72%' },
    { top: '78%', left: '35%' },
    { top: '40%', left: '18%' },
    { top: '15%', left: '30%' },
    { top: '72%', left: '80%' },
    { top: '50%', left: '50%' },
    { top: '28%', left: '48%' },
  ];

  const poiPositions = [
    { top: '27%', left: '36%' },
    { top: '44%', left: '54%' },
    { top: '60%', left: '38%' },
    { top: '33%', left: '64%' },
  ];

  // Active POIs for the focused property (or first property in list)
  const activeFocusProperty = selectedPin || properties[0] || null;
  const activePOIs = useMemo(() => {
    if (!activeFocusProperty) return [];
    return getPropertyPOIs(activeFocusProperty).slice(0, 4);
  }, [activeFocusProperty]);

  const handlePinClick = (e, prop) => {
    e.stopPropagation();
    setSelectedPOI(null);
    setSelectedPin(prop);
    if (onPropertySelect) onPropertySelect(prop);
  };

  return (
    <div
      onClick={() => {
        setSelectedPin(null);
        setSelectedPOI(null);
      }}
      className={`relative w-full h-full overflow-hidden select-none bg-[#e5e3df] ${className}`}
      style={{
        backgroundImage:
          mapStyle === 'satellite'
            ? 'radial-gradient(circle at 50% 50%, #2f3e2e 0%, #1c261c 100%)'
            : mapStyle === 'dark'
            ? 'radial-gradient(circle at 50% 50%, #2c3437 0%, #1a1e21 100%)'
            : 'radial-gradient(circle at 50% 50%, #f4f3f0 0%, #e8e6e1 100%)',
      }}
    >
      {/* Visual map vector decorations (roads, water bodies, parks) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-35 pointer-events-none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M -100 120 C 150 200, 300 100, 600 300 C 900 500, 1100 250, 1400 400"
          stroke={mapStyle === 'dark' ? '#3e4a50' : '#d2d0c8'}
          strokeWidth="32"
          fill="none"
        />
        <path
          d="M 200 -50 C 350 150, 450 400, 500 800"
          stroke={mapStyle === 'dark' ? '#3e4a50' : '#d2d0c8'}
          strokeWidth="24"
          fill="none"
        />
        <path
          d="M 500 -50 C 600 250, 750 450, 950 800"
          stroke={mapStyle === 'dark' ? '#4f5d64' : '#c3c0b6'}
          strokeWidth="16"
          fill="none"
        />
        {/* River */}
        <path
          d="M -50 400 C 250 350, 450 500, 750 420 C 1050 340, 1200 480, 1500 450"
          stroke={mapStyle === 'dark' ? '#1f2e3d' : '#aadaff'}
          strokeWidth="48"
          fill="none"
          strokeLinecap="round"
        />
        {/* Park area */}
        <ellipse
          cx="65%"
          cy="35%"
          rx="140"
          ry="90"
          fill={mapStyle === 'dark' ? '#26382b' : '#c8e6c9'}
          opacity="0.5"
        />
        <ellipse
          cx="25%"
          cy="65%"
          rx="120"
          ry="70"
          fill={mapStyle === 'dark' ? '#26382b' : '#c8e6c9'}
          opacity="0.5"
        />
      </svg>

      {/* Top-Left POI Layer Toggle & Coordinates Pill */}
      <div className="absolute top-4 left-4 z-20 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setShowPOIs(!showPOIs);
          }}
          className={`px-3 py-1.5 rounded-full text-[11px] font-bold shadow-md border transition flex items-center gap-1.5 cursor-pointer ${
            showPOIs
              ? 'bg-emerald-700 text-white border-emerald-700'
              : 'bg-white text-dark border-gray-300'
          }`}
        >
          <Compass className="w-3.5 h-3.5" />
          <span>{showPOIs ? 'Nearby POIs: ON' : 'Nearby POIs: OFF'}</span>
        </button>

        {activeFocusProperty?.coordinates && (
          <a
            href={`https://www.google.com/maps?q=${activeFocusProperty.coordinates.lat},${activeFocusProperty.coordinates.lng}`}
            target="_blank"
            rel="noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="px-3 py-1.5 rounded-full bg-white/95 hover:bg-white text-dark text-[11px] font-bold shadow-md border border-gray-200 flex items-center gap-1"
            title="Open exact coordinates in Google Maps"
          >
            <MapPin className="w-3 h-3 text-airbnb" />
            <span>
              {activeFocusProperty.coordinates.lat.toFixed(3)},{' '}
              {activeFocusProperty.coordinates.lng.toFixed(3)}
            </span>
            <ExternalLink className="w-3 h-3 text-secondary" />
          </a>
        )}
      </div>

      {/* Map Control Buttons */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
        <div className="bg-white rounded-2xl shadow-search border border-borderLight overflow-hidden flex flex-col">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.min(18, z + 1));
            }}
            className="p-2.5 hover:bg-gray-100 text-dark transition flex items-center justify-center cursor-pointer"
            title="Zoom In"
          >
            <Plus className="w-4 h-4" />
          </button>
          <div className="h-px bg-gray-100" />
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setZoom((z) => Math.max(4, z - 1));
            }}
            className="p-2.5 hover:bg-gray-100 text-dark transition flex items-center justify-center cursor-pointer"
            title="Zoom Out"
          >
            <Minus className="w-4 h-4" />
          </button>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setMapStyle((s) =>
              s === 'standard' ? 'satellite' : s === 'satellite' ? 'dark' : 'standard'
            );
          }}
          className="p-2.5 bg-white hover:bg-gray-100 rounded-2xl shadow-search border border-borderLight text-dark transition flex items-center justify-center cursor-pointer"
          title="Toggle Layers"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>

      {/* Floating Nearby Points of Interest (POI) Pins */}
      {showPOIs &&
        activePOIs.map((poi, idx) => {
          const pos = poiPositions[idx % poiPositions.length];
          const isSelected = selectedPOI?.name === poi.name;
          return (
            <div
              key={poi.name}
              style={{ top: pos.top, left: pos.left }}
              className="absolute z-10 transform -translate-x-1/2 -translate-y-1/2"
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedPin(null);
                  setSelectedPOI(poi);
                }}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold shadow-md flex items-center gap-1 transition cursor-pointer ${
                  isSelected
                    ? 'bg-emerald-700 text-white scale-110 ring-2 ring-white z-30'
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300'
                }`}
              >
                <Navigation className="w-2.5 h-2.5 text-emerald-700" />
                <span className="truncate max-w-[110px]">{poi.name}</span>
              </button>
            </div>
          );
        })}

      {/* Floating Property Pins */}
      {properties.map((prop, idx) => {
        const pos =
          properties.length === 1
            ? { top: '50%', left: '50%' }
            : pinPositions[idx % pinPositions.length];
        const isSelected = selectedPin?.id === prop.id;
        const isHighlighted = highlightedPropertyId === prop.id;

        return (
          <div
            key={prop.id}
            style={{ top: pos.top, left: pos.left }}
            className="absolute z-20 transform -translate-x-1/2 -translate-y-1/2 transition-all duration-300"
          >
            <button
              type="button"
              onClick={(e) => handlePinClick(e, prop)}
              className={`px-3 py-1.5 rounded-full font-bold text-xs shadow-md transition-all transform duration-200 cursor-pointer flex items-center gap-1 ${
                isSelected || isHighlighted
                  ? 'bg-dark text-white scale-110 ring-2 ring-white z-30 shadow-xl'
                  : 'bg-white hover:bg-gray-50 text-dark hover:scale-105 border border-gray-300'
              }`}
            >
              <span>${prop.price}</span>
              {prop.suitability?.distanceKm != null && (
                <span className="text-[9px] font-normal opacity-80">
                  · {prop.suitability.distanceKm}km
                </span>
              )}
            </button>
          </div>
        );
      })}

      {/* Selected POI Info Popup */}
      {selectedPOI && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-72 bg-white rounded-2xl shadow-modal border border-emerald-200 p-4 space-y-1.5 animate-fade-in"
        >
          <div className="flex items-center justify-between">
            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase">
              {selectedPOI.category}
            </span>
            <button
              type="button"
              onClick={() => setSelectedPOI(null)}
              className="text-secondary hover:text-dark cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs font-extrabold text-dark">{selectedPOI.name}</p>
          <p className="text-[11px] text-secondary">
            Distance: <strong>{selectedPOI.distanceKm} km</strong> · Approx.{' '}
            <strong>{selectedPOI.walkMins} mins walk</strong> from property
          </p>
        </div>
      )}

      {/* Selected Property Preview Mini Card */}
      {selectedPin && (
        <div
          onClick={(e) => e.stopPropagation()}
          className="absolute bottom-6 left-1/2 -translate-x-1/2 z-30 w-72 bg-white rounded-2xl shadow-modal border border-borderLight overflow-hidden animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setSelectedPin(null)}
            className="absolute top-2 right-2 z-10 p-1 rounded-full bg-white/80 hover:bg-white text-dark shadow-xs cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          <Link to={`/rooms/${selectedPin.id}`} className="block">
            <div className="aspect-video w-full overflow-hidden bg-gray-100">
              <img
                src={selectedPin.images[0]}
                alt={selectedPin.title}
                className="w-full h-full object-cover hover:scale-105 transition duration-300"
              />
            </div>
            <div className="p-3">
              <div className="flex items-center justify-between text-xs font-semibold text-dark">
                <span className="truncate max-w-[180px]">
                  {selectedPin.city}, {selectedPin.country}
                </span>
                <span className="flex items-center gap-0.5">
                  <Star className="w-3 h-3 fill-dark text-dark" />
                  {selectedPin.rating.toFixed(2)}
                </span>
              </div>
              <p className="text-[11px] text-secondary truncate mt-0.5">{selectedPin.title}</p>
              <div className="mt-1.5 flex items-baseline justify-between text-xs">
                <div>
                  <span className="font-bold text-dark">${selectedPin.price}</span>
                  <span className="text-secondary text-[10px]"> night</span>
                </div>
                {selectedPin.coordinates && (
                  <span className="text-[10px] font-mono text-secondary">
                    {selectedPin.coordinates.lat.toFixed(2)}°,{' '}
                    {selectedPin.coordinates.lng.toFixed(2)}°
                  </span>
                )}
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* Bottom map watermark / badge */}
      <div className="absolute bottom-3 right-4 z-10 bg-white/85 backdrop-blur-xs text-[10px] text-secondary px-2.5 py-1 rounded-md border border-gray-200 pointer-events-none">
        StayFinder Geospatial & POI Layer · Zoom: {zoom}
      </div>
    </div>
  );
};
