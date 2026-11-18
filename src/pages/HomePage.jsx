import React, { useState } from 'react';
import { FilterBar } from '../components/common/FilterBar';
import { PropertyCard } from '../components/property/PropertyCard';
import { useSearch } from '../context/SearchContext';
import { Sparkles, SlidersHorizontal, RotateCcw, Shield, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export const HomePage = () => {
  const {
    filteredProperties,
    resetFilters,
    sortBy,
    setSortBy,
    activeTargetCoords,
    userCoords,
    setUserCoords,
    detectUserLocation,
  } = useSearch();
  const [showTotal, setShowTotal] = useState(false);

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

          <div className="flex items-center gap-3 self-end lg:self-auto shrink-0 border-t lg:border-t-0 pt-3 lg:pt-0 border-gray-200 w-full lg:w-auto justify-end">
            <span className="text-xs font-bold text-dark">Display total price</span>
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

        {/* Properties Grid or Empty State */}
        {filteredProperties.length > 0 ? (
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
