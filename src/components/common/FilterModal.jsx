import React from 'react';
import { X, Check } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

export const FilterModal = ({ isOpen, onClose }) => {
  const {
    priceRange,
    setPriceRange,
    bedroomsFilter,
    setBedroomsFilter,
    propertyTypeFilter,
    setPropertyTypeFilter,
    selectedAmenities,
    toggleAmenity,
    resetFilters,
    filteredProperties,
  } = useSearch();

  if (!isOpen) return null;

  const bedroomOptions = ['any', '1', '2', '3', '4', '5+'];
  const propertyTypes = [
    { id: 'all', title: 'Any type', desc: 'All vacation homes' },
    { id: 'entire', title: 'Entire place', desc: 'A place all to yourself' },
    { id: 'villa', title: 'Luxury Villa', desc: 'High-end architecture & private amenities' },
    { id: 'cabin', title: 'Cabin & Cottage', desc: 'Cozy rustic wood retreats' },
  ];

  const commonAmenities = [
    'Wi-Fi',
    'Private Pool',
    'Hot Tub',
    'Chef Kitchen',
    'Free Parking',
    'Air Conditioning',
    'EV Charger',
    'Dedicated Workspace',
    'Waterfront',
    'Wood Fireplace',
    'Sauna',
    'Balcony',
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-modal border border-borderLight overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-dark transition"
          >
            <X className="w-5 h-5" />
          </button>
          <h2 className="text-base font-bold text-dark">Filters</h2>
          <div className="w-9"></div>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-8 divide-y divide-gray-100">
          {/* Price Range */}
          <div className="space-y-4">
            <h3 className="text-lg font-bold text-dark">Price range</h3>
            <p className="text-xs text-secondary">Nightly prices before taxes and fees</p>

            {/* Price Histogram graphic representation */}
            <div className="h-16 flex items-end gap-1.5 px-2 pt-2">
              {[25, 40, 65, 80, 100, 75, 90, 60, 45, 85, 95, 50, 40, 30, 20, 10].map(
                (height, i) => (
                  <div
                    key={i}
                    style={{ height: `${height}%` }}
                    className="flex-1 bg-gray-200 rounded-t hover:bg-airbnb transition"
                  />
                )
              )}
            </div>

            <div className="flex items-center gap-4">
              <div className="flex-1 border border-borderLight rounded-2xl p-3 focus-within:border-dark">
                <label className="block text-[11px] font-semibold text-secondary uppercase">
                  Minimum
                </label>
                <div className="flex items-center gap-1 font-semibold text-dark text-base">
                  <span>$</span>
                  <input
                    type="number"
                    min="50"
                    max={priceRange[1] - 10}
                    value={priceRange[0]}
                    onChange={(e) =>
                      setPriceRange([parseInt(e.target.value) || 0, priceRange[1]])
                    }
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>

              <span className="text-secondary font-medium">-</span>

              <div className="flex-1 border border-borderLight rounded-2xl p-3 focus-within:border-dark">
                <label className="block text-[11px] font-semibold text-secondary uppercase">
                  Maximum
                </label>
                <div className="flex items-center gap-1 font-semibold text-dark text-base">
                  <span>$</span>
                  <input
                    type="number"
                    min={priceRange[0] + 10}
                    max="2000"
                    value={priceRange[1]}
                    onChange={(e) =>
                      setPriceRange([priceRange[0], parseInt(e.target.value) || 1000])
                    }
                    className="w-full bg-transparent focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Type of Place */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-dark">Type of place</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {propertyTypes.map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setPropertyTypeFilter(type.id)}
                  className={`p-4 rounded-2xl border text-left transition ${
                    propertyTypeFilter === type.id
                      ? 'border-dark bg-gray-50 ring-1 ring-dark'
                      : 'border-borderLight hover:border-gray-400'
                  }`}
                >
                  <p className="font-semibold text-sm text-dark">{type.title}</p>
                  <p className="text-xs text-secondary mt-1">{type.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Bedrooms */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-dark">Bedrooms</h3>
            <div className="flex flex-wrap gap-2">
              {bedroomOptions.map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBedroomsFilter(opt)}
                  className={`px-6 py-2.5 rounded-full text-sm font-semibold transition capitalize ${
                    bedroomsFilter === opt
                      ? 'bg-dark text-white'
                      : 'border border-borderLight text-dark hover:border-dark bg-white'
                  }`}
                >
                  {opt === 'any' ? 'Any' : `${opt}+ beds`}
                </button>
              ))}
            </div>
          </div>

          {/* Amenities */}
          <div className="pt-6 space-y-4">
            <h3 className="text-lg font-bold text-dark">Amenities</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {commonAmenities.map((amenity) => {
                const isChecked = selectedAmenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => toggleAmenity(amenity)}
                    className={`flex items-center gap-3 p-3 rounded-xl border text-xs sm:text-sm font-medium transition text-left ${
                      isChecked
                        ? 'border-dark bg-gray-50 text-dark'
                        : 'border-borderLight hover:border-gray-400 text-secondary'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center ${
                        isChecked
                          ? 'bg-dark border-dark text-white'
                          : 'border-gray-400 bg-white'
                      }`}
                    >
                      {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <span className="truncate">{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 bg-white shrink-0">
          <button
            type="button"
            onClick={resetFilters}
            className="text-sm font-semibold text-dark underline hover:text-gray-600 transition"
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-dark hover:bg-black text-white font-semibold rounded-xl text-sm transition"
          >
            Show {filteredProperties.length} places
          </button>
        </div>
      </div>
    </div>
  );
};
