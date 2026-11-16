import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import { checkDateRangeOverlap, validateBookingDates } from '../utils/stayfinderAlgorithms';

const API_BASE = 'http://localhost:5000';
const SearchContext = createContext();

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
  const [searchOpen, setSearchOpen] = useState(false);

  const totalGuests = guests.adults + guests.children;

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

    // Also re-fetch when user switches back from Prisma Studio tab so DB edits appear immediately
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
  };

  const filteredProperties = useMemo(() => {
    return allProperties.filter((prop) => {
      // Category filter
      if (selectedCategory !== 'all' && prop.category !== selectedCategory) {
        return false;
      }

      // Destination search
      if (destination.trim()) {
        const query = destination.toLowerCase().trim();
        const matchesLocation =
          prop.location.toLowerCase().includes(query) ||
          prop.city.toLowerCase().includes(query) ||
          prop.country.toLowerCase().includes(query) ||
          prop.title.toLowerCase().includes(query);
        if (!matchesLocation) return false;
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
  }, [
    allProperties,
    selectedCategory,
    destination,
    totalGuests,
    priceRange,
    bedroomsFilter,
    selectedAmenities,
    checkIn,
    checkOut,
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
