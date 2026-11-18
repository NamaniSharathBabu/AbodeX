import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import {
  checkDateRangeOverlap,
  validateBookingDates,
  calculateSuitabilityScore,
  calculateHaversineDistanceKm,
  geocodeDestination,
  DEFAULT_COMPARISON_WEIGHTS,
} from '../utils/stayfinderAlgorithms';

const API_BASE = 'http://localhost:5000';
const SearchContext = createContext();

const SORT_WEIGHT_PROFILES = {
  recommended: DEFAULT_COMPARISON_WEIGHTS,
  budget: { price: 55, rating: 15, distance: 10, amenities: 10, capacity: 5, availability: 5 },
  rating: { price: 10, rating: 55, distance: 10, amenities: 15, capacity: 5, availability: 5 },
  distance: { price: 10, rating: 15, distance: 55, amenities: 10, capacity: 5, availability: 5 },
  capacity: { price: 15, rating: 15, distance: 10, amenities: 15, capacity: 35, availability: 10 },
};

function getRecommendationReason(suitability, prop) {
  if (!suitability?.normalizedCriteria) return 'Recommended Stay';
  const c = suitability.normalizedCriteria;
  if (suitability.distanceKm != null && suitability.distanceKm < 25) {
    return `${suitability.distanceKm} km from destination`;
  }
  if (c.price >= 0.75 && c.rating >= 0.85) return 'Best Value & Top Rated';
  if (c.rating >= 0.92) return `Top Rated (${prop.rating.toFixed(2)}★)`;
  if (c.price >= 0.8) return 'Great Budget Fit';
  if (c.amenities >= 0.85) return 'High Amenity Match';
  if (c.capacity >= 0.9) return 'Ideal Group Capacity';
  return 'Smart Multi-Criteria Match';
}

export const SearchProvider = ({ children }) => {
  const [allProperties, setAllProperties] = useState([]);
  const [loadingProperties, setLoadingProperties] = useState(true);
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState({
    adults: 1,
    children: 0,
    infants: 0,
    pets: 0,
  });
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([50, 1000]);
  const [bedroomsFilter, setBedroomsFilter] = useState('any');
  const [propertyTypeFilter, setPropertyTypeFilter] = useState('all');
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [sortBy, setSortBy] = useState('recommended');
  const [userCoords, setUserCoords] = useState(null);
  const [radiusKm, setRadiusKm] = useState('any'); // 'any' | 50 | 250 | 1000
  const [searchOpen, setSearchOpen] = useState(false);

  const totalGuests = guests.adults + guests.children;

  // 4.1.1 Browser Geolocation Support
  const detectUserLocation = useCallback((onResult) => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = {
            lat: Number(pos.coords.latitude.toFixed(4)),
            lng: Number(pos.coords.longitude.toFixed(4)),
            label: 'Your Current Location (GPS)',
          };
          setUserCoords(coords);
          setDestination('');
          setSortBy('distance');
          if (onResult) onResult(coords);
        },
        () => {
          // Fallback if browser blocks geolocation prompt on localhost
          const fallback = {
            lat: 34.0259,
            lng: -118.7798,
            label: 'Malibu Coast (Geolocation Demo)',
          };
          setUserCoords(fallback);
          setDestination('');
          setSortBy('distance');
          if (onResult) onResult(fallback);
        },
        { timeout: 5000 }
      );
    }
  }, []);

  // Always fetch properties from PostgreSQL database via Backend API (Single Source of Truth)
  const refreshProperties = useCallback(async () => {
    try {
      setLoadingProperties(true);
      const res = await axios.get(`${API_BASE}/api/properties`);
      if (res.data?.properties && Array.isArray(res.data.properties)) {
        setAllProperties(res.data.properties);
      }
    } catch (e) {
      console.error('Failed to fetch properties from PostgreSQL:', e);
    } finally {
      setLoadingProperties(false);
    }
  }, []);

  useEffect(() => {
    refreshProperties();

    const handleFocus = () => refreshProperties();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refreshProperties]);

  const updateGuests = (type, delta) => {
    setGuests((prev) => {
      const current = prev[type] || 0;
      const updated = Math.max(type === 'adults' ? 1 : 0, current + delta);
      return { ...prev, [type]: updated };
    });
  };

  const toggleAmenity = (amenity) => {
    setSelectedAmenities((prev) =>
      prev.includes(amenity) ? prev.filter((a) => a !== amenity) : [...prev, amenity]
    );
  };

  const resetFilters = () => {
    setDestination('');
    setCheckIn('');
    setCheckOut('');
    setGuests({ adults: 1, children: 0, infants: 0, pets: 0 });
    setSelectedCategory('all');
    setPriceRange([50, 1000]);
    setBedroomsFilter('any');
    setPropertyTypeFilter('all');
    setSelectedAmenities([]);
    setUserCoords(null);
    setRadiusKm('any');
    setSortBy('recommended');
  };

  // 4.1.1 & 4.1.3 Location-Based Discovery + Multi-Criteria Ranking Pipeline
  const activeTargetCoords = useMemo(() => {
    if (destination.trim()) {
      return geocodeDestination(destination, allProperties);
    }
    return userCoords;
  }, [destination, userCoords, allProperties]);

  const filteredProperties = useMemo(() => {
    const targetCoords = activeTargetCoords;
    const activeWeights = SORT_WEIGHT_PROFILES[sortBy] || DEFAULT_COMPARISON_WEIGHTS;

    const candidates = allProperties.filter((prop) => {
      // Category filter
      if (selectedCategory !== 'all' && prop.category !== selectedCategory) {
        return false;
      }

      // Destination & Proximity Radius search (Section 4.1.1)
      if (destination.trim()) {
        const query = destination.toLowerCase().trim();
        const matchesLocation =
          prop.location.toLowerCase().includes(query) ||
          prop.city.toLowerCase().includes(query) ||
          prop.country.toLowerCase().includes(query) ||
          prop.title.toLowerCase().includes(query);

        let withinGeoRadius = false;
        if (targetCoords && prop.coordinates) {
          const dist = calculateHaversineDistanceKm(targetCoords, prop.coordinates);
          const maxR = radiusKm !== 'any' ? Number(radiusKm) : 350;
          if (dist != null && dist <= maxR) withinGeoRadius = true;
        }
        if (!matchesLocation && !withinGeoRadius) return false;
      } else if (userCoords && radiusKm !== 'any' && prop.coordinates) {
        const dist = calculateHaversineDistanceKm(userCoords, prop.coordinates);
        if (dist != null && dist > Number(radiusKm)) return false;
      }

      // Guests filter
      if (totalGuests > 1 && prop.guests < totalGuests) {
        return false;
      }

      // Price filter
      if (prop.price < priceRange[0] || prop.price > priceRange[1]) {
        return false;
      }

      // Bedrooms filter
      if (bedroomsFilter !== 'any') {
        const minBeds = parseInt(bedroomsFilter, 10);
        if (prop.bedrooms < minBeds) return false;
      }

      // Amenities filter
      if (selectedAmenities.length > 0) {
        const hasAllSelected = selectedAmenities.every((selected) =>
          prop.amenities.some((propAmenity) =>
            propAmenity.toLowerCase().includes(selected.toLowerCase())
          )
        );
        if (!hasAllSelected) return false;
      }

      // 4.1.4 Date Range Availability & Overlap Filter [checkIn, checkOut)
      if (checkIn && checkOut) {
        const dateVal = validateBookingDates(checkIn, checkOut);
        if (dateVal.valid) {
          const overlap = checkDateRangeOverlap(checkIn, checkOut, prop.bookedDates || []);
          if (overlap.hasConflict) return false;
        }
      }

      return true;
    });

    const bookingsByProperty = {};
    for (const p of candidates) {
      bookingsByProperty[p.id] = p.bookedDates || [];
    }

    // Score each candidate property with S(p) = Σ(w_i * n_i(p))
    const scored = candidates.map((prop) => {
      const suitability = calculateSuitabilityScore(prop, {
        allProperties: candidates.length > 0 ? candidates : allProperties,
        weights: activeWeights,
        targetCoords,
        requestedGuests: totalGuests || 2,
        selectedAmenities,
        checkIn,
        checkOut,
        bookingsByProperty,
        maxBudget: priceRange[1] || 1000,
      });

      return {
        ...prop,
        suitability,
        recommendationReason: getRecommendationReason(suitability, prop),
      };
    });

    // Sort according to selected ranking strategy
    if (sortBy === 'price-asc') {
      return scored.sort((a, b) => a.price - b.price);
    }
    if (sortBy === 'price-desc') {
      return scored.sort((a, b) => b.price - a.price);
    }
    if (sortBy === 'rating') {
      return scored.sort(
        (a, b) => b.rating - a.rating || b.suitability.score - a.suitability.score
      );
    }
    if (sortBy === 'distance') {
      return scored.sort(
        (a, b) =>
          (a.suitability?.distanceKm ?? 99999) - (b.suitability?.distanceKm ?? 99999)
      );
    }

    // Default ('recommended', 'budget', 'capacity'): sort by multi-criteria suitability score S(p)
    return scored.sort((a, b) => b.suitability.score - a.suitability.score);
  }, [
    allProperties,
    activeTargetCoords,
    userCoords,
    radiusKm,
    selectedCategory,
    destination,
    totalGuests,
    priceRange,
    bedroomsFilter,
    selectedAmenities,
    checkIn,
    checkOut,
    sortBy,
  ]);

  return (
    <SearchContext.Provider
      value={{
        allProperties,
        setAllProperties,
        loadingProperties,
        refreshProperties,
        destination,
        setDestination,
        checkIn,
        setCheckIn,
        checkOut,
        setCheckOut,
        guests,
        setGuests,
        updateGuests,
        totalGuests,
        selectedCategory,
        setSelectedCategory,
        priceRange,
        setPriceRange,
        bedroomsFilter,
        setBedroomsFilter,
        propertyTypeFilter,
        setPropertyTypeFilter,
        selectedAmenities,
        setSelectedAmenities,
        sortBy,
        setSortBy,
        userCoords,
        setUserCoords,
        radiusKm,
        setRadiusKm,
        activeTargetCoords,
        detectUserLocation,
        toggleAmenity,
        resetFilters,
        filteredProperties,
        searchOpen,
        setSearchOpen,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
