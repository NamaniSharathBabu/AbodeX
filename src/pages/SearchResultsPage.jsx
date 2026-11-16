import React, { useState } from 'react';
import { PropertyCard } from '../components/property/PropertyCard';
import { MapPlaceholder } from '../components/search/MapPlaceholder';
import { FilterModal } from '../components/common/FilterModal';
import { useSearch } from '../context/SearchContext';
import {
  Map as MapIcon,
  List,
  SlidersHorizontal,
  RotateCcw,
  Sparkles,
  Award,
  ShieldCheck,
  Check,
} from 'lucide-react';

export const SearchResultsPage = () => {
  const {
    filteredProperties,
    destination,
    totalGuests,
    checkIn,
    checkOut,
    resetFilters,
  } = useSearch();

  const [mobileView, setMobileView] = useState('list'); // 'list' or 'map'
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [highlightedId, setHighlightedId] = useState(null);
  const [superhostOnly, setSuperhostOnly] = useState(false);
  const [instantBookOnly, setInstantBookOnly] = useState(false);

  const displayedProperties = filteredProperties.filter((p) => {
    if (superhostOnly && !p.isSuperhost) return false;
    return true;
  });

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Top Filter Chips & Search Context Header */}
      <div className="border-b border-borderLight bg-white sticky top-20 z-30 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex flex-wrap items-center justify-between gap-3">
          {/* Summary Breadcrumbs */}
          <div className="text-xs text-secondary">
            <span className="font-bold text-dark text-sm">
              {displayedProperties.length} {displayedProperties.length === 1 ? 'stay' : 'stays'}
            </span>
            {destination && <span> in <strong className="text-dark capitalize">{destination}</strong></span>}
            {totalGuests > 1 && <span> · {totalGuests} guests</span>}
            {checkIn && <span> · {checkIn}</span>}
          </div>

          {/* Quick Filter Chips */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
            <button
              onClick={() => setFilterModalOpen(true)}
              className="flex items-center gap-2 border border-borderLight hover:border-dark rounded-full py-1.5 px-3.5 text-xs font-semibold text-dark transition shrink-0 bg-white"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Filters</span>
            </button>

            <button
              onClick={() => setSuperhostOnly(!superhostOnly)}
              className={`flex items-center gap-1.5 border rounded-full py-1.5 px-3.5 text-xs font-semibold transition shrink-0 ${
                superhostOnly
                  ? 'border-dark bg-dark text-white'
                  : 'border-borderLight hover:border-dark text-dark bg-white'
              }`}
            >
              <Award className="w-3.5 h-3.5" />
              <span>Superhosts</span>
            </button>

            <button
              onClick={() => setInstantBookOnly(!instantBookOnly)}
              className={`flex items-center gap-1.5 border rounded-full py-1.5 px-3.5 text-xs font-semibold transition shrink-0 ${
                instantBookOnly
                  ? 'border-dark bg-dark text-white'
                  : 'border-borderLight hover:border-dark text-dark bg-white'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Free cancellation</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Split Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Column: Properties List (70% on desktop) */}
        <div
          className={`w-full lg:w-[65%] xl:w-[70%] overflow-y-auto p-4 sm:p-6 lg:p-8 ${
            mobileView === 'map' ? 'hidden lg:block' : 'block'
          }`}
        >
          {displayedProperties.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {displayedProperties.map((property) => (
                <div
                  key={property.id}
                  onMouseEnter={() => setHighlightedId(property.id)}
                  onMouseLeave={() => setHighlightedId(null)}
                >
                  <PropertyCard property={property} />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-secondary">
                <Sparkles className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-dark">No stays match your criteria</h3>
              <p className="text-sm text-secondary">
                Try expanding your search radius, adjusting dates or removing some filters.
              </p>
              <button
                type="button"
                onClick={() => {
                  resetFilters();
                  setSuperhostOnly(false);
                  setInstantBookOnly(false);
                }}
                className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-dark hover:bg-black text-white font-semibold rounded-xl text-sm transition"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset filters</span>
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Interactive Map View (30% on desktop, full on mobile if toggled) */}
        <div
          className={`w-full lg:w-[35%] xl:w-[30%] h-[calc(100vh-140px)] sticky top-36 ${
            mobileView === 'list' ? 'hidden lg:block' : 'block h-[calc(100vh-140px)]'
          }`}
        >
          <MapPlaceholder
            properties={displayedProperties}
            highlightedPropertyId={highlightedId}
          />
        </div>
      </div>

      {/* Floating Mobile Toggle Map / List Button */}
      <div className="lg:hidden fixed bottom-18 left-1/2 -translate-x-1/2 z-40">
        <button
          type="button"
          onClick={() => setMobileView(mobileView === 'list' ? 'map' : 'list')}
          className="flex items-center gap-2 px-5 py-3 rounded-full bg-dark hover:bg-black text-white font-bold text-xs shadow-xl transition transform active:scale-95"
        >
          {mobileView === 'list' ? (
            <>
              <span>Show map</span>
              <MapIcon className="w-4 h-4" />
            </>
          ) : (
            <>
              <span>Show list</span>
              <List className="w-4 h-4" />
            </>
          )}
        </button>
      </div>

      {/* Filter Modal */}
      <FilterModal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </div>
  );
};
