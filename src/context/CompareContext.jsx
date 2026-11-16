import React, { createContext, useContext, useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Scale,
  X,
  Trophy,
  Sparkles,
  Star,
  MapPin,
  Users,
  Bed,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Sliders,
  RotateCcw,
  ArrowRight,
  GripVertical,
} from 'lucide-react';
import {
  DEFAULT_COMPARISON_WEIGHTS,
  calculateSuitabilityScore,
  geocodeDestination,
} from '../utils/stayfinderAlgorithms';
import { useSearch } from './SearchContext';
import { useToast } from './ToastContext';

const CompareContext = createContext();

export const CompareProvider = ({ children }) => {
  const [compareIds, setCompareIds] = useState([]);
  const [weights, setWeights] = useState(DEFAULT_COMPARISON_WEIGHTS);
  const [isDraggingProperty, setIsDraggingProperty] = useState(false);
  const [draggedPropertyId, setDraggedPropertyId] = useState(null);
  const [isDragOverBox, setIsDragOverBox] = useState(false);
  const [isHoveringBox, setIsHoveringBox] = useState(false);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState(false);
  const [activeInterestPreset, setActiveInterestPreset] = useState('balanced');

  const {
    allProperties,
    destination,
    totalGuests,
    selectedAmenities,
    checkIn,
    checkOut,
    priceRange,
  } = useSearch();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const addPropertyToCompare = (propertyId) => {
    if (!propertyId) return;
    const prop = allProperties.find((p) => p.id === propertyId);
    if (compareIds.includes(propertyId)) {
      showToast(`"${prop?.city || 'Property'}" is already in your Compare Box`, 'info');
      return;
    }
    if (compareIds.length >= 4) {
      showToast('Compare Box is full (max 4 properties). Remove one to add another.', 'error');
      return;
    }
    setCompareIds((prev) => [...prev, propertyId]);
    showToast(`Dropped "${prop?.city || 'Property'}" into Compare Box!`, 'success');
  };

  const removePropertyFromCompare = (propertyId) => {
    setCompareIds((prev) => prev.filter((id) => id !== propertyId));
  };

  const toggleCompare = (propertyId, propertyTitle = 'Property') => {
    if (compareIds.includes(propertyId)) {
      removePropertyFromCompare(propertyId);
      showToast(`Removed from Compare Box`, 'info');
    } else {
      addPropertyToCompare(propertyId, propertyTitle);
    }
  };

  const isCompared = (propertyId) => compareIds.includes(propertyId);

  const clearCompare = () => {
    setCompareIds([]);
    setIsCompareModalOpen(false);
  };

  const updateWeight = (criterion, value) => {
    setActiveInterestPreset('custom');
    setWeights((prev) => ({
      ...prev,
      [criterion]: Number(value),
    }));
  };

  const applyInterestPreset = (presetId) => {
    setActiveInterestPreset(presetId);
    const presets = {
      balanced: DEFAULT_COMPARISON_WEIGHTS,
      budget: { price: 55, rating: 15, distance: 10, amenities: 10, capacity: 5, availability: 5 },
      luxury: { price: 5, rating: 45, distance: 15, amenities: 25, capacity: 5, availability: 5 },
      location: { price: 15, rating: 20, distance: 45, amenities: 10, capacity: 5, availability: 5 },
      family: { price: 20, rating: 15, distance: 10, amenities: 15, capacity: 30, availability: 10 },
    };
    if (presets[presetId]) setWeights(presets[presetId]);
  };

  const resetWeights = () => {
    setActiveInterestPreset('balanced');
    setWeights(DEFAULT_COMPARISON_WEIGHTS);
  };

  const comparedProperties = useMemo(
    () => compareIds.map((id) => allProperties.find((p) => p.id === id)).filter(Boolean),
    [compareIds, allProperties]
  );

  const targetCoords = useMemo(
    () => geocodeDestination(destination, allProperties),
    [destination, allProperties]
  );

  // Ranked results S(p) = Σ(w_i * n_i(p))
  const rankedResults = useMemo(() => {
    if (comparedProperties.length === 0) return [];
    const bookingsByProperty = {};
    for (const p of comparedProperties) {
      bookingsByProperty[p.id] = p.bookedDates || [];
    }

    return comparedProperties
      .map((prop) => {
        const suitability = calculateSuitabilityScore(prop, {
          allProperties: comparedProperties,
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
    comparedProperties,
    weights,
    targetCoords,
    totalGuests,
    selectedAmenities,
    checkIn,
    checkOut,
    priceRange,
  ]);

  const handleDropOnBox = (e) => {
    e.preventDefault();
    setIsDragOverBox(false);
    setIsDraggingProperty(false);
    setIsHoveringBox(false);
    const propId = e.dataTransfer.getData('text/plain') || draggedPropertyId;
    if (propId) {
      addPropertyToCompare(propId);
    }
    setDraggedPropertyId(null);
  };

  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';
  const bestMatch = rankedResults[0] || null;
  const isBoxOpen = isHoveringBox || isDraggingProperty || isDragOverBox;

  return (
    <CompareContext.Provider
      value={{
        compareIds,
        setCompareIds,
        comparedProperties,
        rankedResults,
        addPropertyToCompare,
        removePropertyFromCompare,
        toggleCompare,
        isCompared,
        clearCompare,
        weights,
        setWeights,
        updateWeight,
        resetWeights,
        applyInterestPreset,
        isDraggingProperty,
        setIsDraggingProperty,
        draggedPropertyId,
        setDraggedPropertyId,
        isCompareModalOpen,
        setIsCompareModalOpen,
        compareCount: compareIds.length,
      }}
    >
      {children}

      {/* =====================================================================
          RIGHT-SIDE DRAG & DROP COMPARE BOX (Closed by default; opens on hover or drag)
      ===================================================================== */}
      {!isAuthPage && (
        <div
          onMouseEnter={() => setIsHoveringBox(true)}
          onMouseLeave={() => setIsHoveringBox(false)}
          onDragOver={(e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
            if (!isDragOverBox) setIsDragOverBox(true);
          }}
          onDragLeave={() => setIsDragOverBox(false)}
          onDrop={handleDropOnBox}
          className={`fixed right-0 top-28 z-40 transition-transform duration-300 ease-in-out select-none ${
            isBoxOpen ? 'translate-x-0' : 'translate-x-[calc(100%-36px)]'
          }`}
        >
          <div className="flex items-start">
            {/* Compact Edge Tab (Visible when closed; opens on hover or drag) */}
            <div
              className={`mt-4 py-3.5 px-2 rounded-l-2xl shadow-lg border border-r-0 flex flex-col items-center gap-1.5 cursor-pointer transition ${
                compareIds.length > 0
                  ? 'bg-airbnb text-white border-airbnb'
                  : 'bg-dark text-white border-gray-700 hover:bg-black'
              }`}
              title="Hover or drag a property card here to open Compare Box"
            >
              <Scale className="w-4 h-4" />
              <span className="text-[10px] font-extrabold">
                {compareIds.length}/4
              </span>
              {isBoxOpen ? (
                <ChevronRight className="w-3.5 h-3.5" />
              ) : (
                <ChevronLeft className="w-3.5 h-3.5" />
              )}
            </div>

            {/* Main Right-Side Drop Box Panel */}
            <div
              className={`w-64 sm:w-72 bg-white/95 backdrop-blur-md rounded-l-3xl shadow-2xl border-2 p-4 space-y-3 transition-all ${
                isDragOverBox
                  ? 'border-airbnb bg-airbnb/5 scale-[1.03] ring-4 ring-airbnb/20'
                  : isDraggingProperty
                  ? 'border-dashed border-airbnb shadow-airbnb'
                  : 'border-borderLight'
              }`}
            >
              {/* Box Header */}
              <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-xl bg-airbnb/10 text-airbnb flex items-center justify-center">
                    <Scale className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-extrabold text-dark leading-tight">
                      Compare Drop Box
                    </h4>
                    <p className="text-[10px] text-secondary">
                      Drag & drop stays here ({compareIds.length}/4)
                    </p>
                  </div>
                </div>

                {compareIds.length > 0 && (
                  <button
                    type="button"
                    onClick={clearCompare}
                    className="text-[10px] font-bold text-secondary hover:text-red-600 transition cursor-pointer"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Drop Target Zone / Dropped Property Items */}
              <div
                className={`min-h-[120px] rounded-2xl p-2.5 transition flex flex-col justify-center ${
                  isDragOverBox
                    ? 'bg-airbnb/10 border-2 border-dashed border-airbnb'
                    : comparedProperties.length === 0
                    ? 'bg-gray-50 border-2 border-dashed border-gray-300'
                    : 'bg-gray-50/70 space-y-2'
                }`}
              >
                {comparedProperties.length === 0 ? (
                  <div className="text-center py-4 px-2 space-y-1.5 pointer-events-none">
                    <GripVertical className="w-6 h-6 text-airbnb mx-auto animate-bounce" />
                    <p className="text-xs font-bold text-dark">
                      {isDragOverBox ? 'Release to Drop Stay!' : 'Drag any property card here'}
                    </p>
                    <p className="text-[10px] text-secondary leading-snug">
                      Drop 2 to 4 properties to compare suitability scores & find your best match
                    </p>
                  </div>
                ) : (
                  <>
                    {comparedProperties.map((p, idx) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-2xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-extrabold text-airbnb w-4 text-center">
                            #{idx + 1}
                          </span>
                          <img
                            src={p.images?.[0]}
                            alt={p.city}
                            className="w-9 h-9 rounded-lg object-cover shrink-0"
                          />
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-dark truncate">{p.city}</p>
                            <p className="text-[10px] text-secondary">
                              ${p.price}/nt · {p.rating}★
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removePropertyFromCompare(p.id)}
                          className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition cursor-pointer shrink-0"
                          title="Remove"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}

                    {comparedProperties.length < 4 && (
                      <div
                        className={`py-2 px-3 rounded-xl border border-dashed text-center text-[10px] font-semibold transition ${
                          isDragOverBox
                            ? 'border-airbnb bg-airbnb/10 text-airbnb'
                            : 'border-gray-300 text-secondary'
                        }`}
                      >
                        + Drag & drop another stay ({4 - comparedProperties.length} slots left)
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Open & Compare CTA */}
              {comparedProperties.length > 0 && (
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(true)}
                  className="w-full py-2.5 px-4 bg-gradient-to-r from-[#FF385C] via-[#E00B41] to-[#D70466] hover:opacity-95 text-white rounded-2xl text-xs font-extrabold shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open & Compare ({comparedProperties.length})</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          INTERACTIVE COMPARISON & INTEREST MATCHER MODAL (Open Box View)
      ===================================================================== */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-6xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-borderLight overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-airbnb/10 text-airbnb flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-extrabold text-dark">
                    Smart Property Comparison & Interest Matcher
                  </h2>
                  <p className="text-xs text-secondary">
                    Select your travel priority below — we rank your dropped stays using{' '}
                    <code className="font-mono font-bold text-dark">S(p) = Σ(wᵢ × nᵢ(p))</code> so you can book the best match!
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsCompareModalOpen(false);
                    navigate('/compare');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-gray-200 hover:border-dark text-xs font-bold text-dark transition cursor-pointer"
                >
                  Full Page View
                </button>
                <button
                  type="button"
                  onClick={() => setIsCompareModalOpen(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-secondary hover:text-dark cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-bgLight">
              {/* Step 1: Choose What Matters Most to You (Interests + Sliders) */}
              <div className="bg-white rounded-2xl p-5 border border-borderLight space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-airbnb" />
                    <span className="text-xs sm:text-sm font-extrabold text-dark">
                      What matters most for your trip? (Adjust Interests wᵢ)
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {[
                      { id: 'balanced', label: 'Balanced Match' },
                      { id: 'budget', label: 'Best Budget / Price' },
                      { id: 'luxury', label: 'Highest Rating & Amenities' },
                      { id: 'location', label: 'Best Location' },
                      { id: 'family', label: 'Large Group / Space' },
                    ].map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyInterestPreset(preset.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                          activeInterestPreset === preset.id
                            ? 'bg-dark text-white shadow-xs'
                            : 'bg-gray-100 hover:bg-gray-200 text-dark'
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={resetWeights}
                      className="p-1.5 text-airbnb hover:bg-airbnb/10 rounded-lg text-xs font-bold cursor-pointer"
                      title="Reset weights"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Compact Weight Sliders */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {[
                    { key: 'price', label: 'Price' },
                    { key: 'rating', label: 'Rating' },
                    { key: 'distance', label: 'Location' },
                    { key: 'amenities', label: 'Amenities' },
                    { key: 'capacity', label: 'Capacity' },
                    { key: 'availability', label: 'Availability' },
                  ].map((crit) => (
                    <div
                      key={crit.key}
                      className="bg-gray-50 px-3 py-2 rounded-xl border border-gray-200"
                    >
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-dark">{crit.label}</span>
                        <span className="text-airbnb font-mono">{weights[crit.key]}%</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="5"
                        value={weights[crit.key]}
                        onChange={(e) => updateWeight(crit.key, e.target.value)}
                        className="w-full accent-airbnb cursor-pointer mt-1"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Step 2: Best Match Winner Recommendation Banner */}
              {bestMatch && (
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-black text-white rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-5">
                  <div className="flex items-center gap-4">
                    <img
                      src={bestMatch.images?.[0]}
                      alt={bestMatch.title}
                      className="w-20 h-20 rounded-2xl object-cover border-2 border-airbnb shrink-0"
                    />
                    <div className="space-y-1">
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-airbnb text-white text-[11px] font-extrabold">
                        <Trophy className="w-3.5 h-3.5" />
                        <span>
                          #1 Recommended Match ({bestMatch.suitability.scorePercent}% Suitability Score)
                        </span>
                      </div>
                      <h3 className="text-lg font-extrabold">{bestMatch.title}</h3>
                      <p className="text-xs text-gray-300">
                        {bestMatch.location} · <strong>${bestMatch.price}/night</strong> ·{' '}
                        {bestMatch.rating.toFixed(2)}★ ({bestMatch.reviewCount} reviews) ·{' '}
                        {bestMatch.guests} guests
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setIsCompareModalOpen(false);
                      navigate(`/rooms/${bestMatch.id}`);
                    }}
                    className="px-6 py-3.5 bg-airbnb hover:bg-airbnb-hover text-white font-extrabold rounded-2xl text-xs sm:text-sm shadow-md transition flex items-center justify-center gap-2 shrink-0 cursor-pointer"
                  >
                    <span>Book Best Match Now</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* Step 3: Side-by-Side Comparison Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {rankedResults.map((prop, idx) => {
                  const isWinner = idx === 0;
                  const s = prop.suitability;
                  return (
                    <div
                      key={prop.id}
                      className={`bg-white rounded-3xl overflow-hidden border flex flex-col justify-between relative ${
                        isWinner
                          ? 'border-airbnb ring-2 ring-airbnb/30 shadow-lg'
                          : 'border-borderLight'
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => removePropertyFromCompare(prop.id)}
                        className="absolute top-2.5 right-2.5 z-10 p-1.5 rounded-full bg-white/90 hover:bg-white text-dark shadow-xs cursor-pointer"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="relative aspect-16/10 bg-gray-100">
                          <img
                            src={prop.images?.[0]}
                            alt={prop.title}
                            className="w-full h-full object-cover"
                          />
                          <div
                            className={`absolute top-2.5 left-2.5 px-2.5 py-1 rounded-full text-[11px] font-extrabold flex items-center gap-1 ${
                              isWinner ? 'bg-airbnb text-white' : 'bg-dark/85 text-white'
                            }`}
                          >
                            {isWinner && <Trophy className="w-3 h-3" />}
                            <span>{isWinner ? '#1 Best Match' : `Rank #${idx + 1}`}</span>
                          </div>
                        </div>

                        <div className="p-4 space-y-3">
                          <div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="font-bold text-dark truncate">
                                {prop.city}, {prop.country}
                              </span>
                              <span className="flex items-center gap-0.5 font-bold text-dark shrink-0">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                {prop.rating.toFixed(2)}
                              </span>
                            </div>
                            <p className="text-xs text-secondary truncate mt-0.5">{prop.title}</p>
                          </div>

                          {/* Suitability Progress */}
                          <div className="p-3 rounded-2xl bg-gray-50 border border-gray-200 space-y-1.5">
                            <div className="flex items-center justify-between">
                              <span className="text-[11px] font-bold text-dark">Match Score S(p)</span>
                              <span className="text-base font-extrabold text-airbnb">
                                {s.scorePercent}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                style={{ width: `${s.scorePercent}%` }}
                                className={`h-full rounded-full ${
                                  isWinner ? 'bg-airbnb' : 'bg-dark'
                                }`}
                              />
                            </div>
                          </div>

                          {/* Key Metrics */}
                          <div className="space-y-1.5 text-xs">
                            <div className="flex justify-between">
                              <span className="text-secondary">Nightly Price</span>
                              <span className="font-extrabold text-dark">${prop.price}/night</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-secondary">Capacity</span>
                              <span className="font-semibold text-dark">
                                {prop.guests} guests · {prop.bedrooms} beds
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-secondary">Amenities</span>
                              <span className="font-semibold text-dark">
                                {prop.amenities?.length || 0} included
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-secondary">Availability</span>
                              <span
                                className={`font-bold ${
                                  s.isAvailable ? 'text-emerald-600' : 'text-red-600'
                                }`}
                              >
                                {s.isAvailable ? 'Open' : 'Date Conflict'}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="p-4 pt-0">
                        <button
                          type="button"
                          onClick={() => {
                            setIsCompareModalOpen(false);
                            navigate(`/rooms/${prop.id}`);
                          }}
                          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 ${
                            isWinner
                              ? 'bg-airbnb hover:bg-airbnb-hover text-white shadow-sm'
                              : 'bg-gray-100 hover:bg-dark hover:text-white text-dark'
                          }`}
                        >
                          <span>{isWinner ? 'Book Best Match' : 'Select & Book'}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </CompareContext.Provider>
  );
};

export const useCompare = () => {
  const context = useContext(CompareContext);
  if (!context) {
    throw new Error('useCompare must be used within a CompareProvider');
  }
  return context;
};
