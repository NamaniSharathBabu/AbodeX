import React, { useState } from 'react';
import { FilterBar } from '../components/common/FilterBar';
import { PropertyCard } from '../components/property/PropertyCard';
import { MapPlaceholder } from '../components/search/MapPlaceholder';
import { useSearch } from '../context/SearchContext';
import { Sparkles, RotateCcw, Home, Map as MapIcon, List, Columns } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const {
    filteredProperties,
    resetFilters,
    sortBy,
    setSortBy,
  } = useSearch();
  const [showTotal, setShowTotal] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'split' | 'map'
  const [highlightedId, setHighlightedId] = useState(null);

  const rankingOptions = [
    { id: 'recommended', label: 'Smart Match S(p)' },
    { id: 'budget', label: 'Best Value' },
    { id: 'rating', label: 'Top Rated' },
    { id: 'distance', label: 'Nearest Distance' },
    { id: 'price-asc', label: 'Price: Low → High' },
    { id: 'price-desc', label: 'Price: High → Low' },
    { id: 'capacity', label: 'Group Capacity' },
  ];

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Category filter bar */}
      <FilterBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full">
        {/* Smart Recommendation & Ranking Bar + Total Price Toggle */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8 bg-gray-50/80 border border-borderLight rounded-2xl p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white border border-borderLight flex items-center justify-center text-airbnb shadow-2xs shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold text-dark">
                Smart Recommendation & Ranking
              </h2>
              <p className="text-xs text-secondary">
                Multi-criteria ranking across price, rating, location, amenities, capacity & availability
              </p>
            </div>

            {/* Ranking Pills */}
            <div className="flex flex-wrap items-center gap-1.5 pt-1 lg:pt-0 lg:ml-2">
              {rankingOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setSortBy(opt.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold transition cursor-pointer ${
                    sortBy === opt.id
                      ? 'bg-dark text-white shadow-xs'
                      : 'bg-white border border-borderLight text-secondary hover:border-dark hover:text-dark'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 self-end lg:self-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-200 w-full lg:w-auto justify-end">
            {/* View Mode Toggle: Grid / Split Map / Full Map */}
            <div className="bg-white rounded-xl border border-borderLight p-1 flex items-center gap-1 shadow-2xs">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'grid'
                    ? 'bg-dark text-white'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <List className="w-3.5 h-3.5" />
                <span>Grid</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('split')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'split'
                    ? 'bg-dark text-white'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Columns className="w-3.5 h-3.5" />
                <span>Split + Map</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode('map')}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  viewMode === 'map'
                    ? 'bg-airbnb text-white'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <MapIcon className="w-3.5 h-3.5" />
                <span>Full Map</span>
              </button>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-dark">Total price</span>
              <button
                type="button"
                onClick={() => setShowTotal(!showTotal)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none cursor-pointer ${
                  showTotal ? 'bg-dark' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                    showTotal ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Properties Grid, Split View, or Full Interactive Map */}
        {filteredProperties.length > 0 ? (
          viewMode === 'map' ? (
            <div className="h-[640px] rounded-3xl overflow-hidden border border-borderLight shadow-md">
              <MapPlaceholder
                properties={filteredProperties}
                highlightedPropertyId={highlightedId}
              />
            </div>
          ) : viewMode === 'split' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProperties.map((property, index) => (
                  <div
                    key={property.id}
                    onMouseEnter={() => setHighlightedId(property.id)}
                    onMouseLeave={() => setHighlightedId(null)}
                  >
                    <PropertyCard
                      property={property}
                      showTotal={showTotal}
                      rankIndex={sortBy === 'recommended' ? index : null}
                    />
                  </div>
                ))}
              </div>
              <div className="lg:col-span-5 h-[620px] sticky top-28 rounded-3xl overflow-hidden border border-borderLight shadow-md">
                <MapPlaceholder
                  properties={filteredProperties}
                  highlightedPropertyId={highlightedId}
                />
              </div>
            </div>
          ) : (
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-10">
                {filteredProperties.map((property, index) => (
                  <PropertyCard
                    key={property.id}
                    property={property}
                    showTotal={showTotal}
                    rankIndex={sortBy === 'recommended' ? index : null}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          <div className="py-20 text-center flex flex-col items-center justify-center max-w-md mx-auto space-y-4">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center text-secondary">
              <Home className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-dark">No exact matches found</h3>
            <p className="text-sm text-secondary">
              Try changing or clearing your search filters or destination to explore more places.
            </p>
            <button
              type="button"
              onClick={resetFilters}
              className="mt-2 flex items-center gap-2 px-6 py-2.5 bg-dark hover:bg-black text-white font-semibold rounded-xl text-sm transition"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset all filters</span>
            </button>
          </div>
        )}

        {/* Floating Show Map / Show List Pill Button */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            type="button"
            onClick={() => setViewMode(viewMode === 'map' ? 'grid' : 'map')}
            className="flex items-center gap-2 px-5 py-3 rounded-full bg-dark hover:bg-black text-white font-bold text-xs sm:text-sm shadow-xl transition transform active:scale-95 cursor-pointer"
          >
            {viewMode === 'map' ? (
              <>
                <span>Show List</span>
                <List className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Explore on Map</span>
                <MapIcon className="w-4 h-4 text-airbnb" />
              </>
            )}
          </button>
        </div>

        {/* Host Inspiration Callout Banner */}
        <section className="mt-20 rounded-3xl overflow-hidden relative bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white p-8 sm:p-12">
          <div className="max-w-xl space-y-4 relative z-10">
            <span className="inline-block px-3 py-1 rounded-full bg-airbnb/20 text-airbnb text-xs font-bold uppercase tracking-wider">
              Earn with AbodeX
            </span>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
              Turn your home into your next adventure
            </h2>
            <p className="text-sm text-gray-300 leading-relaxed">
              Earn extra income and unlock new opportunities by renting your home or spare room to verified global travelers with full AirCover protection.
            </p>
            <div className="pt-2">
              <Link
                to="/profile"
                className="inline-flex items-center gap-2 px-6 py-3 bg-airbnb hover:bg-airbnb-hover text-white font-bold rounded-2xl text-sm shadow-md transition transform active:scale-95"
              >
                AbodeX your home
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};
