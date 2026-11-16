/**
 * StayFinder / AbodeX Core Algorithms (Chapter 4 System Design)
 * Implements:
 * - 4.1.1 Location-Based Property Search, Geocoding & Haversine Distance
 * - 4.1.2 Weighted Property Comparison: S(p) = Σ (w_i * n_i(p))
 * - 4.1.3 Multi-Criteria Recommendation & Ranking
 * - 4.1.4 Booking Availability & Conflict Detection on [checkIn, checkOut)
 */

export const DESTINATION_COORDINATES = {
  malibu: { lat: 34.0259, lng: -118.7798, label: 'Malibu, California, US' },
  california: { lat: 34.0522, lng: -118.2437, label: 'California, United States' },
  aspen: { lat: 39.1911, lng: -106.8175, label: 'Aspen, Colorado, US' },
  colorado: { lat: 39.5501, lng: -105.7821, label: 'Colorado, United States' },
  santorini: { lat: 36.3932, lng: 25.4615, label: 'Santorini, Cyclades, Greece' },
  greece: { lat: 37.9838, lng: 23.7275, label: 'Greece' },
  florence: { lat: 43.7696, lng: 11.2558, label: 'Florence, Tuscany, Italy' },
  tuscany: { lat: 43.7711, lng: 11.2486, label: 'Tuscany, Italy' },
  italy: { lat: 41.8719, lng: 12.5674, label: 'Italy' },
  rovaniemi: { lat: 66.5039, lng: 25.7294, label: 'Rovaniemi, Lapland, Finland' },
  lapland: { lat: 67.9222, lng: 26.5046, label: 'Lapland, Finland' },
  finland: { lat: 61.9241, lng: 25.7482, label: 'Finland' },
  'lake tahoe': { lat: 39.0968, lng: -120.0324, label: 'Lake Tahoe, Nevada, US' },
  tahoe: { lat: 39.0968, lng: -120.0324, label: 'Lake Tahoe, Nevada, US' },
  'new york': { lat: 40.7128, lng: -74.006, label: 'New York, NY, US' },
  manhattan: { lat: 40.7831, lng: -73.9712, label: 'Manhattan, New York, US' },
  kyoto: { lat: 35.0116, lng: 135.7681, label: 'Kyoto, Kansai, Japan' },
  japan: { lat: 35.6762, lng: 139.6503, label: 'Japan' },
  ubud: { lat: -8.5069, lng: 115.2625, label: 'Ubud, Bali, Indonesia' },
  bali: { lat: -8.4095, lng: 115.1889, label: 'Bali, Indonesia' },
  indonesia: { lat: -8.4095, lng: 115.1889, label: 'Indonesia' },
  'bora bora': { lat: -16.5004, lng: -151.7415, label: 'Bora Bora, French Polynesia' },
  amboise: { lat: 47.4132, lng: 0.9831, label: 'Amboise, Loire Valley, France' },
  france: { lat: 46.2276, lng: 2.2137, label: 'France' },
  'joshua tree': { lat: 34.1347, lng: -116.3131, label: 'Joshua Tree, California, US' },
  hyderabad: { lat: 17.385, lng: 78.4867, label: 'Hyderabad, Telangana, India' },
  goa: { lat: 15.2993, lng: 74.124, label: 'Goa, India' },
  manali: { lat: 32.2432, lng: 77.1892, label: 'Manali, Himachal Pradesh, India' },
  india: { lat: 17.385, lng: 78.4867, label: 'India' },
};

export function geocodeDestination(query, properties = []) {
  if (!query || !query.trim()) return null;
  const normalized = query.toLowerCase().trim();

  for (const [key, coords] of Object.entries(DESTINATION_COORDINATES)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return coords;
    }
  }

  const matchedProp = properties.find(
    (p) =>
      p.city?.toLowerCase().includes(normalized) ||
      p.location?.toLowerCase().includes(normalized) ||
      p.country?.toLowerCase().includes(normalized)
  );
  if (matchedProp && matchedProp.coordinates) {
    return {
      lat: matchedProp.coordinates.lat,
      lng: matchedProp.coordinates.lng,
      label: matchedProp.location,
    };
  }

  return null;
}

export function calculateHaversineDistanceKm(coord1, coord2) {
  if (!coord1 || !coord2 || coord1.lat == null || coord2.lat == null) return null;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(coord2.lat - coord1.lat);
  const dLng = toRad(coord2.lng - coord1.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(coord1.lat)) *
      Math.cos(toRad(coord2.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export function getPropertyPOIs(property) {
  if (property.nearbyPOIs && property.nearbyPOIs.length > 0) {
    return property.nearbyPOIs;
  }

  const city = property.city || 'City Center';
  const categoryPOIs = {
    beachfront: [
      { name: `${city} Private Cove & Beach`, category: 'Tourist Attraction', distanceKm: 0.2, walkMins: 3 },
      { name: `${city} Coastal Pier & Boardwalk`, category: 'Landmark', distanceKm: 1.8, walkMins: 22 },
      { name: 'Pacific Coast Highway Transit Stop', category: 'Transportation', distanceKm: 0.9, walkMins: 11 },
      { name: 'Oceanfront Seafood & Sunset Grill', category: 'Dining', distanceKm: 1.2, walkMins: 15 },
    ],
    cabins: [
      { name: `${city} Gondola & Ski Base Lift`, category: 'Tourist Attraction', distanceKm: 2.1, walkMins: 25 },
      { name: 'Alpine Ridge National Trailhead', category: 'Nature & Parks', distanceKm: 0.4, walkMins: 5 },
      { name: `${city} Mountain Shuttle Terminal`, category: 'Transportation', distanceKm: 1.5, walkMins: 18 },
      { name: 'Nordic Timber Roastery & Cafe', category: 'Dining', distanceKm: 1.1, walkMins: 14 },
    ],
    'iconic-cities': [
      { name: `${city} Contemporary Art Museum`, category: 'Tourist Attraction', distanceKm: 0.5, walkMins: 6 },
      { name: 'Central Metro / Subway Express Hub', category: 'Transportation', distanceKm: 0.3, walkMins: 4 },
      { name: `${city} Financial & Tech District`, category: 'Business Center', distanceKm: 1.4, walkMins: 17 },
      { name: 'Michelin Star Bistro & Rooftop Lounge', category: 'Dining', distanceKm: 0.4, walkMins: 5 },
    ],
  };

  return (
    categoryPOIs[property.category] || [
      { name: `${city} Historic Cultural Center`, category: 'Tourist Attraction', distanceKm: 0.8, walkMins: 10 },
      { name: `${city} Central Transit Station`, category: 'Transportation', distanceKm: 1.4, walkMins: 17 },
      { name: `${city} Panorama Viewpoint`, category: 'Landmark', distanceKm: 0.6, walkMins: 8 },
      { name: `Artisanal Local Market & Dining Hub`, category: 'Dining', distanceKm: 0.9, walkMins: 11 },
    ]
  );
}

export function normalizeDateString(dateInput) {
  if (!dateInput) return null;
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
}

export function validateBookingDates(checkIn, checkOut) {
  const startStr = normalizeDateString(checkIn);
  const endStr = normalizeDateString(checkOut);

  if (!startStr || !endStr) {
    return { valid: false, error: 'Both check-in and check-out dates are required.' };
  }

  const start = new Date(startStr);
  const end = new Date(endStr);

  if (end <= start) {
    return {
      valid: false,
      error: 'Check-out date must occur after the check-in date.',
    };
  }

  const nights = Math.round((end - start) / (1000 * 60 * 60 * 24));
  return { valid: true, checkIn: startStr, checkOut: endStr, nights };
}

export function checkDateRangeOverlap(requestedCheckIn, requestedCheckOut, existingBookings = []) {
  const validation = validateBookingDates(requestedCheckIn, requestedCheckOut);
  if (!validation.valid) {
    return {
      hasConflict: true,
      reason: validation.error,
      conflictingBookings: [],
    };
  }

  const reqStart = new Date(validation.checkIn).getTime();
  const reqEnd = new Date(validation.checkOut).getTime();

  const conflicts = existingBookings.filter((booking) => {
    const status = (booking.status || 'Confirmed').toUpperCase();
    if (status === 'CANCELLED') return false;

    const exStartStr = normalizeDateString(booking.checkIn);
    const exEndStr = normalizeDateString(booking.checkOut);
    if (!exStartStr || !exEndStr) return false;

    const exStart = new Date(exStartStr).getTime();
    const exEnd = new Date(exEndStr).getTime();

    return exStart < reqEnd && exEnd > reqStart;
  });

  return {
    hasConflict: conflicts.length > 0,
    reason:
      conflicts.length > 0
        ? `Selected dates overlap with an existing reservation (${conflicts[0].checkIn} to ${conflicts[0].checkOut}). Please choose different dates.`
        : null,
    conflictingBookings: conflicts,
    nights: validation.nights,
  };
}

export const DEFAULT_COMPARISON_WEIGHTS = {
  price: 25,
  rating: 25,
  distance: 15,
  amenities: 15,
  capacity: 10,
  availability: 10,
};

export function calculateSuitabilityScore(property, context = {}) {
  const {
    allProperties = [property],
    weights = DEFAULT_COMPARISON_WEIGHTS,
    targetCoords = null,
    requestedGuests = 2,
    selectedAmenities = [],
    checkIn = '',
    checkOut = '',
    bookingsByProperty = {},
    maxBudget = 1000,
  } = context;

  const prices = allProperties.map((p) => p.price || 0);
  const minPrice = Math.min(...prices, 100);
  const maxPrice = Math.max(...prices, maxBudget, 950);
  const priceSpread = Math.max(1, maxPrice - minPrice);
  const nPrice = Math.max(0, Math.min(1, 1 - (property.price - minPrice) / priceSpread));

  const rawRating = property.rating || 4.5;
  const ratingNorm = Math.max(0, Math.min(1, (rawRating - 4.0) / 1.0));
  const reviewBonus = Math.min(0.15, (property.reviewCount || 0) / 1000);
  const nRating = Math.max(0, Math.min(1, ratingNorm * 0.9 + reviewBonus));

  let nDistance = (property.ratingBreakdown?.location || 4.8) / 5.0;
  let distanceKm = null;
  if (targetCoords && property.coordinates) {
    distanceKm = calculateHaversineDistanceKm(targetCoords, property.coordinates);
    if (distanceKm !== null) {
      nDistance = Math.max(0.15, Math.min(1, 1 / (1 + distanceKm / 120)));
    }
  }

  const propAmenities = property.amenities || [];
  let nAmenities = Math.min(1, propAmenities.length / 12);
  if (selectedAmenities && selectedAmenities.length > 0) {
    const matchedCount = selectedAmenities.filter((reqAmenity) =>
      propAmenities.some((pa) => pa.toLowerCase().includes(reqAmenity.toLowerCase()))
    ).length;
    const matchRatio = matchedCount / selectedAmenities.length;
    nAmenities = matchRatio * 0.8 + Math.min(0.2, propAmenities.length / 60);
  }

  const guestReq = Math.max(1, requestedGuests || 1);
  const propCap = property.guests || 2;
  let nCapacity = 1.0;
  if (propCap < guestReq) {
    nCapacity = Math.max(0, propCap / guestReq - 0.3);
  } else {
    const extra = propCap - guestReq;
    nCapacity = Math.max(0.6, Math.min(1, 1 - extra * 0.04));
  }

  const propBookings = [
    ...(property.bookedDates || []),
    ...(bookingsByProperty[property.id] || []),
  ];
  let isAvailable = true;
  if (checkIn && checkOut) {
    const overlap = checkDateRangeOverlap(checkIn, checkOut, propBookings);
    isAvailable = !overlap.hasConflict;
  }
  const nAvailability = isAvailable ? 1.0 : 0.0;

  const totalWeight =
    (weights.price || 0) +
    (weights.rating || 0) +
    (weights.distance || 0) +
    (weights.amenities || 0) +
    (weights.capacity || 0) +
    (weights.availability || 0) || 100;

  const w = {
    price: (weights.price || 0) / totalWeight,
    rating: (weights.rating || 0) / totalWeight,
    distance: (weights.distance || 0) / totalWeight,
    amenities: (weights.amenities || 0) / totalWeight,
    capacity: (weights.capacity || 0) / totalWeight,
    availability: (weights.availability || 0) / totalWeight,
  };

  const normalizedCriteria = {
    price: Number(nPrice.toFixed(3)),
    rating: Number(nRating.toFixed(3)),
    distance: Number(nDistance.toFixed(3)),
    amenities: Number(nAmenities.toFixed(3)),
    capacity: Number(nCapacity.toFixed(3)),
    availability: Number(nAvailability.toFixed(3)),
  };

  const weightedContributions = {
    price: Number((w.price * nPrice).toFixed(3)),
    rating: Number((w.rating * nRating).toFixed(3)),
    distance: Number((w.distance * nDistance).toFixed(3)),
    amenities: Number((w.amenities * nAmenities).toFixed(3)),
    capacity: Number((w.capacity * nCapacity).toFixed(3)),
    availability: Number((w.availability * nAvailability).toFixed(3)),
  };

  const scoreRaw =
    weightedContributions.price +
    weightedContributions.rating +
    weightedContributions.distance +
    weightedContributions.amenities +
    weightedContributions.capacity +
    weightedContributions.availability;

  const scorePercent = Math.round(scoreRaw * 100);

  return {
    propertyId: property.id,
    score: Number(scoreRaw.toFixed(3)),
    scorePercent,
    isAvailable,
    distanceKm,
    normalizedCriteria,
    weights: w,
    weightedContributions,
  };
}

export function rankProperties(properties, context = {}) {
  return properties
    .map((prop) => {
      const evaluation = calculateSuitabilityScore(prop, {
        ...context,
        allProperties: properties,
      });
      return {
        ...prop,
        suitability: evaluation,
      };
    })
    .sort((a, b) => b.suitability.score - a.suitability.score);
}
