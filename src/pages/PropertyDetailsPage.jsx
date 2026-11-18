import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ImageGallery } from '../components/property/ImageGallery';
import { BookingCard } from '../components/property/BookingCard';
import { ReviewCard } from '../components/property/ReviewCard';
import { AmenitiesModal } from '../components/property/AmenitiesModal';
import { HostBadge } from '../components/property/HostBadge';
import { MapPlaceholder } from '../components/search/MapPlaceholder';
import { PropertyCard } from '../components/property/PropertyCard';
import { useWishlist } from '../context/WishlistContext';
import { useCompare } from '../context/CompareContext';
import { useSearch } from '../context/SearchContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getPropertyPOIs } from '../utils/stayfinderAlgorithms';
import {
  Star,
  Share2,
  Heart,
  Scale,
  Navigation,
  Compass,
  ExternalLink,
  Award,
  Key,
  MapPin,
  Calendar,
  Flame,
  Waves,
  Sun,
  Coffee,
  ShieldCheck,
  Building2,
  Trees,
  TentTree,
  Bed,
  CheckCircle2,
  ChevronRight,
} from 'lucide-react';

const highlightIcons = {
  Award,
  Key,
  MapPin,
  Calendar,
  Flame,
  Waves,
  Sun,
  Coffee,
  ShieldCheck,
  Building2,
  Trees,
  TentTree,
};

export const PropertyDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { isCompared, toggleCompare } = useCompare();
  const { allProperties, refreshProperties } = useSearch();
  const { user, token, refreshUser } = useAuth();
  const { showToast } = useToast();

  const [amenitiesModalOpen, setAmenitiesModalOpen] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewForm, setReviewForm] = useState({
    rating: 5,
    cleanliness: 5,
    accuracy: 5,
    communication: 5,
    location: 5,
    checkIn: 5,
    value: 5,
    comment: '',
  });

  // Scroll to top on id change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  // Find property by ID strictly from PostgreSQL database list
  const property = allProperties.find((p) => p.id === id) || allProperties[0];

  if (!property) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center text-sm text-secondary">
        Loading property from PostgreSQL database...
      </div>
    );
  }

  const wishlisted = isWishlisted(property.id);

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Listing link copied to clipboard!', 'success');
  };

  const handleWishlist = () => {
    toggleWishlist(property.id);
    if (!wishlisted) {
      showToast(`Saved "${property.title.substring(0, 25)}..." to your wishlist!`, 'success');
    } else {
      showToast('Removed from wishlist', 'info');
    }
  };

  // Similar listings from PostgreSQL database
  const similarListings = allProperties
    .filter((p) => p.id !== property.id)
    .slice(0, 4);

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewForm.comment.trim()) {
      showToast('Please write a comment for your review', 'error');
      return;
    }
    try {
      setSubmittingReview(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.post(
        `http://localhost:5000/api/properties/${property.id}/reviews`,
        reviewForm,
        { headers }
      );
      await refreshProperties();
      await refreshUser();
      setReviewForm({
        rating: 5,
        cleanliness: 5,
        accuracy: 5,
        communication: 5,
        location: 5,
        checkIn: 5,
        value: 5,
        comment: '',
      });
      setShowReviewForm(false);
      showToast('Review saved to PostgreSQL and rating recalculated!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to submit review', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="bg-white min-h-screen pb-16">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 space-y-8">
        {/* Title and Action Header */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-dark tracking-tight">
              {property.title}
            </h1>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => toggleCompare(property.id, property.title)}
                className={`flex items-center gap-2 text-xs sm:text-sm font-semibold py-2 px-3.5 rounded-xl transition cursor-pointer ${
                  isCompared(property.id)
                    ? 'bg-airbnb text-white shadow-xs'
                    : 'text-dark hover:bg-gray-100 border border-borderLight'
                }`}
              >
                <Scale className="w-4 h-4" />
                <span>{isCompared(property.id) ? 'Comparing' : 'Compare'}</span>
              </button>

              <button
                onClick={handleShare}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-dark hover:bg-gray-100 py-2 px-3.5 rounded-xl transition"
              >
                <Share2 className="w-4 h-4" />
                <span className="underline">Share</span>
              </button>

              <button
                onClick={handleWishlist}
                className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-dark hover:bg-gray-100 py-2 px-3.5 rounded-xl transition"
              >
                <Heart
                  className={`w-4 h-4 ${
                    wishlisted ? 'fill-airbnb text-airbnb' : 'text-dark'
                  }`}
                />
                <span className="underline">{wishlisted ? 'Saved' : 'Save'}</span>
              </button>
            </div>
          </div>

          {/* Subheader: Ratings and location */}
          <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm font-medium text-dark">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-dark text-dark" />
              <span className="font-bold">{property.rating.toFixed(2)}</span>
            </div>
            <span>·</span>
            <a href="#reviews" className="font-semibold underline">
              {property.reviewCount} reviews
            </a>
            {property.isSuperhost && (
              <>
                <span>·</span>
                <span className="flex items-center gap-1 text-secondary font-medium">
                  <Award className="w-3.5 h-3.5 text-airbnb" />
                  Superhost
                </span>
              </>
            )}
            <span>·</span>
            <span className="text-secondary underline">{property.location}</span>
          </div>
        </div>

        {/* 5-Image Gallery */}
        <ImageGallery
          images={property.images}
          propertyId={property.id}
          title={property.title}
        />

        {/* Content & Sticky Booking Card Split (65% / 35%) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 pt-4">
          {/* Left Column: Details (2 cols on desktop) */}
          <div className="lg:col-span-2 space-y-8 divide-y divide-gray-200">
            {/* Host Intro & Property Specs */}
            <div className="flex items-center justify-between pb-6">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-dark">
                  {property.type} hosted by {property.host.name}
                </h2>
                <p className="text-sm text-secondary mt-1">
                  {property.guests} guests · {property.bedrooms} bedrooms · {property.beds} beds · {property.bathrooms} baths
                </p>
              </div>

              <img
                src={property.host.avatar}
                alt={property.host.name}
                className="w-14 h-14 rounded-full object-cover border border-borderLight shadow-xs"
              />
            </div>

            {/* Highlights */}
            {property.highlights && property.highlights.length > 0 && (
              <div className="py-6 space-y-5">
                {property.highlights.map((hl, idx) => {
                  const IconComponent = highlightIcons[hl.icon] || Award;
                  return (
                    <div key={idx} className="flex items-start gap-4">
                      <div className="mt-0.5 text-dark">
                        <IconComponent className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-dark text-sm">{hl.title}</h4>
                        <p className="text-xs sm:text-sm text-secondary">{hl.description}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Description */}
            <div className="py-6 space-y-4">
              <h3 className="text-lg font-bold text-dark">About this space</h3>
              <div className="text-sm text-dark leading-relaxed whitespace-pre-line">
                {descExpanded
                  ? property.description
                  : `${property.description.slice(0, 320)}...`}
              </div>
              <button
                type="button"
                onClick={() => setDescExpanded(!descExpanded)}
                className="text-sm font-bold underline text-dark hover:text-gray-600 transition"
              >
                {descExpanded ? 'Show less' : 'Show more'}
              </button>
            </div>

            {/* Where you'll sleep */}
            <div className="py-6 space-y-4">
              <h3 className="text-lg font-bold text-dark">Where you'll sleep</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[...Array(property.bedrooms || 2)].map((_, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl border border-borderLight bg-white space-y-2"
                  >
                    <Bed className="w-6 h-6 text-dark" />
                    <div>
                      <h4 className="font-bold text-sm text-dark">Bedroom {i + 1}</h4>
                      <p className="text-xs text-secondary">
                        {i === 0 ? '1 King bed' : '1 Queen bed'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="py-6 space-y-4">
              <h3 className="text-lg font-bold text-dark">What this place offers</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm">
                {property.amenities.slice(0, 8).map((amenity, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-dark">
                    <CheckCircle2 className="w-4 h-4 text-airbnb shrink-0" />
                    <span>{amenity}</span>
                  </div>
                ))}
              </div>

              {property.amenities.length > 8 && (
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setAmenitiesModalOpen(true)}
                    className="px-5 py-2.5 border border-dark rounded-xl text-sm font-semibold text-dark hover:bg-gray-100 transition"
                  >
                    Show all {property.amenities.length} amenities
                  </button>
                </div>
              )}
            </div>

            {/* Host Badge Info Box */}
            <div className="py-6">
              <HostBadge
                host={property.host}
                propertyId={property.id}
                propertyTitle={property.title}
              />
            </div>
          </div>

          {/* Right Column: Sticky Booking Card (1 col on desktop) */}
          <div className="lg:col-span-1">
            <BookingCard property={property} />
          </div>
        </div>

        {/* Reviews Section */}
        <section id="reviews" className="pt-12 border-t border-gray-200 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-xl sm:text-2xl font-extrabold text-dark">
              <Star className="w-6 h-6 fill-dark text-dark" />
              <span>{property.rating.toFixed(2)} · {property.reviewCount} reviews</span>
            </div>

            <button
              type="button"
              onClick={() => setShowReviewForm(!showReviewForm)}
              className="px-5 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition cursor-pointer"
            >
              {showReviewForm ? 'Cancel Review' : 'Write a Review'}
            </button>
          </div>

          {/* 4.1.5 Interactive Guest Review & Sub-Criteria Rating Form */}
          {showReviewForm && (
            <form
              onSubmit={handleSubmitReview}
              className="bg-gray-50 rounded-3xl p-6 border border-borderLight space-y-5 animate-fade-in"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="text-base font-extrabold text-dark">
                    Share your stay experience at {property.title}
                  </h4>
                  <p className="text-xs text-secondary">
                    Posting as <strong>{user?.name || 'Verified Guest'}</strong> · Saved to PostgreSQL
                  </p>
                </div>

                {/* Overall Star Picker */}
                <div className="flex items-center gap-1.5 bg-white px-3.5 py-2 rounded-2xl border border-gray-200">
                  <span className="text-xs font-bold text-dark mr-1">Overall:</span>
                  {[1, 2, 3, 4, 5].map((starVal) => (
                    <button
                      key={starVal}
                      type="button"
                      onClick={() => setReviewForm({ ...reviewForm, rating: starVal })}
                      className="cursor-pointer transition transform hover:scale-110"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          starVal <= reviewForm.rating
                            ? 'fill-amber-400 text-amber-400'
                            : 'text-gray-300'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* 6 Sub-Criteria Sliders */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {['cleanliness', 'accuracy', 'communication', 'location', 'checkIn', 'value'].map(
                  (crit) => (
                    <div
                      key={crit}
                      className="bg-white p-3 rounded-2xl border border-gray-200 space-y-1"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-semibold text-secondary">{crit}</span>
                        <span className="font-bold text-dark">{reviewForm[crit]}★</span>
                      </div>
                      <input
                        type="range"
                        min="1"
                        max="5"
                        step="0.5"
                        value={reviewForm[crit]}
                        onChange={(e) =>
                          setReviewForm({ ...reviewForm, [crit]: Number(e.target.value) })
                        }
                        className="w-full accent-airbnb cursor-pointer"
                      />
                    </div>
                  )
                )}
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-dark mb-1.5">
                  Written Review *
                </label>
                <textarea
                  rows="3"
                  required
                  placeholder="Describe the location, amenities, host communication, and overall value..."
                  value={reviewForm.comment}
                  onChange={(e) => setReviewForm({ ...reviewForm, comment: e.target.value })}
                  className="w-full p-3.5 rounded-2xl border border-borderLight bg-white text-sm text-dark focus:border-dark focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowReviewForm(false)}
                  className="px-4 py-2 text-xs font-bold text-secondary hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="px-6 py-2.5 bg-airbnb hover:bg-airbnb-hover text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition cursor-pointer"
                >
                  {submittingReview ? 'Saving to PostgreSQL...' : 'Submit Review'}
                </button>
              </div>
            </form>
          )}

          {/* Rating Breakdown Bars */}
          {property.ratingBreakdown && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-3 text-xs sm:text-sm">
              {Object.entries(property.ratingBreakdown).map(([key, val]) => (
                <div key={key} className="flex items-center justify-between gap-4">
                  <span className="capitalize text-secondary">{key}</span>
                  <div className="flex items-center gap-3 w-1/2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        style={{ width: `${(val / 5) * 100}%` }}
                        className="h-full bg-dark rounded-full"
                      />
                    </div>
                    <span className="font-bold text-dark w-6 text-right">{val.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Reviews Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
            {property.reviews.map((rev) => (
              <ReviewCard key={rev.id} review={rev} />
            ))}
          </div>
        </section>

        {/* 4.1.1 Location, Coordinates, Nearby Points of Interest (POIs) & Map Section */}
        <section className="pt-12 border-t border-gray-200 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-xl font-bold text-dark">Where you'll be</h3>
              <p className="text-sm text-secondary flex items-center gap-1.5 mt-0.5">
                <MapPin className="w-4 h-4 text-airbnb" />
                <span>{property.location}</span>
                {property.coordinates && (
                  <span className="font-mono text-xs bg-gray-100 text-dark px-2 py-0.5 rounded-md ml-1">
                    {property.coordinates.lat.toFixed(4)}° N, {property.coordinates.lng.toFixed(4)}° E
                  </span>
                )}
              </p>
            </div>

            {property.coordinates && (
              <a
                href={`https://www.google.com/maps?q=${property.coordinates.lat},${property.coordinates.lng}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl border border-borderLight hover:border-dark text-xs font-bold text-dark transition"
              >
                <Compass className="w-4 h-4 text-airbnb" />
                <span>Open in Google Maps</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>

          <div className="h-96 rounded-3xl overflow-hidden border border-borderLight shadow-xs">
            <MapPlaceholder properties={[property]} />
          </div>

          {/* Nearby Points of Interest (POIs) Grid */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <h4 className="text-base font-extrabold text-dark flex items-center gap-2">
                <Navigation className="w-4 h-4 text-airbnb" />
                <span>Nearby Points of Interest & Landmarks</span>
              </h4>
              <span className="text-xs text-secondary">Geospatial Proximity Data</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {getPropertyPOIs(property).map((poi, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-gray-50 border border-borderLight hover:border-dark transition space-y-1.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded-full bg-airbnb/10 text-airbnb text-[10px] font-extrabold uppercase">
                      {poi.category}
                    </span>
                    <span className="text-xs font-extrabold text-dark">
                      {poi.distanceKm} km
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-dark">{poi.name}</p>
                  <p className="text-[11px] text-secondary">
                    Approx. {poi.walkMins} mins walk from property
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Similar Listings Carousel / Grid */}
        <section className="pt-12 border-t border-gray-200 space-y-6">
          <h3 className="text-xl sm:text-2xl font-bold text-dark">
            Similar places to stay
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {similarListings.map((simProp) => (
              <PropertyCard key={simProp.id} property={simProp} />
            ))}
          </div>
        </section>
      </main>

      {/* Amenities Full Modal */}
      <AmenitiesModal
        isOpen={amenitiesModalOpen}
        onClose={() => setAmenitiesModalOpen(false)}
        amenities={property.amenities}
      />
    </div>
  );
};
