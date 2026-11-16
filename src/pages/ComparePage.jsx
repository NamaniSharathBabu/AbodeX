import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Scale,
  Trophy,
  Sliders,
  RotateCcw,
  Star,
  MapPin,
  Users,
  Bed,
  Bath,
  CheckCircle2,
  XCircle,
  Plus,
  X,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { useCompare } from '../context/CompareContext';
import { useSearch } from '../context/SearchContext';
import {
  calculateSuitabilityScore,
  geocodeDestination,
  DEFAULT_COMPARISON_WEIGHTS,
} from '../utils/stayfinderAlgorithms';

export const ComparePage = () => {
  const {
    compareIds,
    setCompareIds,
    toggleCompare,
    weights,
    setWeights,
    updateWeight,
    resetWeights,
  } = useCompare();

  const {
    allProperties,
    destination,
    totalGuests,
    selectedAmenities,
    checkIn,
    checkOut,
    priceRange,
  } = useSearch();

  const [selectedAddId, setSelectedAddId] = useState('');

  // If user opens /compare directly with fewer than 2 items, show top 3 properties by default so they can immediately test S(p)
  const activeProperties = useMemo(() => {
    if (compareIds.length > 0) {
      return compareIds.map((id) => allProperties.find((p) => p.id === id)).filter(Boolean);
    }
    return allProperties.slice(0, 3);
  }, [compareIds, allProperties]);

  const targetCoords = useMemo(
    () => geocodeDestination(destination, allProperties),
    [destination, allProperties]
  );

  // 4.1.2 Calculate S(p) = Σ(w_i * n_i(p)) and sort descending
  const rankedComparison = useMemo(() => {
    if (activeProperties.length === 0) return [];
    const bookingsByProperty = {};
    for (const p of activeProperties) {
      bookingsByProperty[p.id] = p.bookedDates || [];
    }

    return activeProperties
      .map((prop) => {
        const suitability = calculateSuitabilityScore(prop, {
          allProperties: activeProperties,
          weights,
          targetCoords,
          requestedGuests: totalGuests || 2,
          selectedAmenities,
          checkIn,
          checkOut,
          bookingsByProperty,
          maxBudget: priceRange?.[1] || 1000,
        });
        return {
          ...prop,
          suitability,
        };
      })
      .sort((a, b) => b.suitability.score - a.suitability.score);
  }, [
    activeProperties,
    weights,
    targetCoords,
    totalGuests,
    selectedAmenities,
    checkIn,
    checkOut,
    priceRange,
  ]);

  const applyPreset = (preset) => {
    const presets = {
      balanced: DEFAULT_COMPARISON_WEIGHTS,
      budget: { price: 50, rating: 15, distance: 10, amenities: 10, capacity: 5, availability: 10 },
      luxury: { price: 5, rating: 45, distance: 15, amenities: 25, capacity: 5, availability: 5 },
      location: { price: 15, rating: 20, distance: 45, amenities: 10, capacity: 5, availability: 5 },
      group: { price: 20, rating: 15, distance: 10, amenities: 15, capacity: 30, availability: 10 },
    };
    if (presets[preset]) setWeights(presets[preset]);
  };

  const criteriaLabels = [
    { key: 'price', label: 'Price Suitability (w₁)', desc: 'Lower price scores higher' },
    { key: 'rating', label: 'Guest Rating (w₂)', desc: 'Rating & review confidence' },
    { key: 'distance', label: 'Location / Proximity (w₃)', desc: 'Distance & location score' },
    { key: 'amenities', label: 'Amenity Match (w₄)', desc: 'Richness & filter match' },
    { key: 'capacity', label: 'Capacity Fit (w₅)', desc: 'Fit for requested guest count' },
    { key: 'availability', label: 'Date Availability (w₆)', desc: 'Conflict-free [a, b) dates' },
  ];

  const remainingProperties = allProperties.filter(
    (p) => !activeProperties.some((ap) => ap.id === p.id)
  );

  const handleAddFromSelect = () => {
    if (!selectedAddId) return;
    const baseIds = compareIds.length > 0 ? compareIds : activeProperties.map((p) => p.id);
    if (baseIds.length >= 4) return;
    setCompareIds([...baseIds, selectedAddId]);
    setSelectedAddId('');
  };

  const handleRemoveProperty = (propId) => {
    const baseIds = compareIds.length > 0 ? compareIds : activeProperties.map((p) => p.id);
    setCompareIds(baseIds.filter((id) => id !== propId));
  };

  return (
    <div className="bg-bgLight min-h-screen py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLight shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-airbnb/10 text-airbnb text-xs font-bold">
              <Scale className="w-3.5 h-3.5" />
              <span>Section 4.1.2 · Multi-Criteria Weighted Property Comparison</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
              Smart Property Comparison & Suitability Ranking
            </h1>
            <p className="text-xs sm:text-sm text-secondary max-w-2xl">
              Evaluates candidate properties simultaneously using normalized multi-criteria scoring{' '}
              <code className="font-mono font-bold text-dark bg-gray-100 px-1.5 py-0.5 rounded">
                S(p) = Σ(wᵢ × nᵢ(p))
              </code>{' '}
              across price, rating, location proximity, amenities, capacity, and booking availability.
            </p>
          </div>

          {/* Add Property Selector */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <select
              value={selectedAddId}
              onChange={(e) => setSelectedAddId(e.target.value)}
              className="p-2.5 rounded-xl border border-borderLight bg-white text-xs font-semibold text-dark focus:border-dark focus:outline-none max-w-[230px]"
            >
              <option value="">+ Add property to compare...</option>
              {remainingProperties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.city} — ${p.price}/night ({p.rating}★)
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedAddId || activeProperties.length >= 4}
              onClick={handleAddFromSelect}
              className="flex items-center gap-1.5 px-4 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold transition disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add</span>
            </button>
          </div>
        </div>

        {/* Interactive Weight Configuration Panel (w_i) */}
        <div className="bg-white rounded-3xl p-6 border border-borderLight shadow-xs space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-gray-100 pb-4">
            <div className="flex items-center gap-2.5">
              <Sliders className="w-5 h-5 text-airbnb" />
              <div>
                <h2 className="text-base font-extrabold text-dark">
                  Configure Criterion Weights (wᵢ)
                </h2>
                <p className="text-xs text-secondary">
                  Adjust importance sliders to dynamically recalculate normalized suitability scores S(p)
                </p>
              </div>
            </div>

            {/* Weight Presets */}
            <div className="flex flex-wrap items-center gap-2">
              {[
                { id: 'balanced', label: 'Balanced' },
                { id: 'budget', label: 'Budget Priority' },
                { id: 'luxury', label: 'Rating & Amenities' },
                { id: 'location', label: 'Location Focus' },
                { id: 'group', label: 'Group Capacity' },
              ].map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className="px-3 py-1.5 rounded-xl border border-borderLight hover:border-dark bg-gray-50 hover:bg-white text-xs font-bold text-dark transition cursor-pointer"
                >
                  {preset.label}
                </button>
              ))}
              <button
                type="button"
                onClick={resetWeights}
                className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-airbnb hover:bg-airbnb/10 transition cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* 6 Weight Sliders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {criteriaLabels.map((c) => (
              <div
                key={c.key}
                className="p-3.5 rounded-2xl bg-gray-50 border border-gray-200/80 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-dark">{c.label}</span>
                  <span className="text-xs font-mono font-extrabold text-airbnb">
                    {weights[c.key]}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={weights[c.key]}
                  onChange={(e) => updateWeight(c.key, e.target.value)}
                  className="w-full accent-airbnb cursor-pointer"
                />
                <p className="text-[10px] text-secondary">{c.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Side-by-Side Ranked Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {rankedComparison.map((prop, index) => {
            const isWinner = index === 0;
            const s = prop.suitability;

            return (
              <div
                key={prop.id}
                className={`bg-white rounded-3xl overflow-hidden border transition flex flex-col justify-between relative ${
                  isWinner
                    ? 'border-airbnb ring-2 ring-airbnb/30 shadow-xl'
                    : 'border-borderLight shadow-xs'
                }`}
              >
                {/* Remove Button */}
                {activeProperties.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveProperty(prop.id)}
                    className="absolute top-3 right-3 z-20 p-1.5 rounded-full bg-white/90 hover:bg-white text-dark shadow-md cursor-pointer"
                    title="Remove from comparison"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <div>
                  {/* Image & Rank Badge */}
                  <div className="relative aspect-16/10 bg-gray-100 overflow-hidden">
                    <img
                      src={prop.images?.[0]}
                      alt={prop.title}
                      className="w-full h-full object-cover"
                    />
                    <div
                      className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-extrabold flex items-center gap-1.5 shadow-md ${
                        isWinner ? 'bg-airbnb text-white' : 'bg-dark/90 text-white'
                      }`}
                    >
                      {isWinner && <Trophy className="w-3.5 h-3.5" />}
                      <span>{isWinner ? '#1 Best Match' : `Rank #${index + 1}`}</span>
                    </div>
                  </div>

                  {/* Property Header & Overall Score S(p) */}
                  <div className="p-5 space-y-4">
                    <div>
                      <div className="flex items-center justify-between text-xs text-secondary">
                        <span className="flex items-center gap-1 font-semibold text-dark">
                          <MapPin className="w-3.5 h-3.5 text-airbnb" />
                          {prop.city}, {prop.country}
                        </span>
                        <span className="flex items-center gap-1 font-bold text-dark">
                          <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                          {prop.rating.toFixed(2)} ({prop.reviewCount})
                        </span>
                      </div>
                      <h3 className="text-base font-extrabold text-dark line-clamp-1 mt-1">
                        {prop.title}
                      </h3>
                    </div>

                    {/* S(p) Score Box */}
                    <div
                      className={`p-4 rounded-2xl border space-y-2 ${
                        isWinner
                          ? 'bg-airbnb/5 border-airbnb/30'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div className="flex items-baseline justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-dark">
                          Suitability S(p)
                        </span>
                        <div className="text-right">
                          <span className="text-2xl font-extrabold text-airbnb">
                            {s.scorePercent}%
                          </span>
                          <span className="block text-[10px] font-mono text-secondary">
                            S(p) = {s.score.toFixed(3)}
                          </span>
                        </div>
                      </div>
                      <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          style={{ width: `${s.scorePercent}%` }}
                          className={`h-full rounded-full transition-all duration-300 ${
                            isWinner ? 'bg-airbnb' : 'bg-dark'
                          }`}
                        />
                      </div>
                    </div>

                    {/* Normalized Criteria Breakdown n_i(p) */}
                    <div className="space-y-2.5 pt-1 text-xs">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-secondary">
                        Normalized Criterion Scores nᵢ(p)
                      </p>

                      {[
                        {
                          key: 'price',
                          label: 'Price Suitability',
                          rawLabel: `$${prop.price}/night`,
                        },
                        {
                          key: 'rating',
                          label: 'Rating Score',
                          rawLabel: `${prop.rating.toFixed(2)} ★`,
                        },
                        {
                          key: 'distance',
                          label: 'Location Score',
                          rawLabel:
                            s.distanceKm != null
                              ? `${s.distanceKm} km`
                              : `${prop.ratingBreakdown?.location || 4.9}/5`,
                        },
                        {
                          key: 'amenities',
                          label: 'Amenity Match',
                          rawLabel: `${prop.amenities?.length || 0} amenities`,
                        },
                        {
                          key: 'capacity',
                          label: 'Capacity Fit',
                          rawLabel: `${prop.guests} guests · ${prop.bedrooms} bd`,
                        },
                        {
                          key: 'availability',
                          label: 'Availability',
                          rawLabel: s.isAvailable ? 'Available' : 'Conflict',
                        },
                      ].map((row) => {
                        const normVal = s.normalizedCriteria[row.key] || 0;
                        const pct = Math.round(normVal * 100);
                        return (
                          <div key={row.key} className="space-y-1">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-secondary font-medium">{row.label}</span>
                              <span className="font-semibold text-dark">
                                {row.rawLabel}{' '}
                                <span className="font-mono text-[10px] text-airbnb">
                                  ({normVal.toFixed(2)})
                                </span>
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${pct}%` }}
                                className="h-full bg-dark rounded-full transition-all duration-300"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Key Specs & Top Amenities */}
                    <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                      <div className="flex items-center justify-between text-secondary">
                        <span className="flex items-center gap-1">
                          <Users className="w-3.5 h-3.5" /> {prop.guests} guests
                        </span>
                        <span className="flex items-center gap-1">
                          <Bed className="w-3.5 h-3.5" /> {prop.bedrooms} beds
                        </span>
                        <span className="flex items-center gap-1">
                          <Bath className="w-3.5 h-3.5" /> {prop.bathrooms} baths
                        </span>
                      </div>

                      <div className="pt-1 space-y-1">
                        {(prop.amenities || []).slice(0, 4).map((am, i) => (
                          <div
                            key={i}
                            className="flex items-center gap-1.5 text-[11px] text-dark truncate"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                            <span className="truncate">{am}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer CTA */}
                <div className="p-5 pt-0">
                  <Link
                    to={`/rooms/${prop.id}`}
                    className={`w-full py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition ${
                      isWinner
                        ? 'bg-airbnb hover:bg-airbnb-hover text-white shadow-md'
                        : 'bg-dark hover:bg-black text-white'
                    }`}
                  >
                    <span>View & Reserve Stay</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </main>
    </div>
  );
};
