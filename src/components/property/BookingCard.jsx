import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Star,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  CheckCircle,
  ShieldCheck,
  AlertTriangle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';
import {
  validateBookingDates,
  checkDateRangeOverlap,
} from '../../utils/stayfinderAlgorithms';

export const BookingCard = ({ property }) => {
  const navigate = useNavigate();
  const { addReservation, token, refreshUser } = useAuth();
  const { checkIn: searchCheckIn, checkOut: searchCheckOut, refreshProperties } = useSearch();
  const { showToast } = useToast();

  const [checkInDate, setCheckInDate] = useState(searchCheckIn || '2026-10-20');
  const [checkOutDate, setCheckOutDate] = useState(searchCheckOut || '2026-10-25');
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0, pets: 0 });
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [isReservedModalOpen, setIsReservedModalOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [serverAvailability, setServerAvailability] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync with global search dates if user selected them
  useEffect(() => {
    if (searchCheckIn) setCheckInDate(searchCheckIn);
    if (searchCheckOut) setCheckOutDate(searchCheckOut);
  }, [searchCheckIn, searchCheckOut]);

  const totalGuests = guests.adults + guests.children;
  const maxGuests = property.guests || 6;

  // Active reservations for this property from PostgreSQL
  const bookedRanges = useMemo(() => {
    return (property.bookedDates || []).filter(
      (b) => (b.status || 'Confirmed').toUpperCase() !== 'CANCELLED'
    );
  }, [property.bookedDates]);

  // 4.1.4 Instant Client-Side Date Validation & Overlap Check [checkIn, checkOut)
  const dateEvaluation = useMemo(() => {
    const validation = validateBookingDates(checkInDate, checkOutDate);
    if (!validation.valid) {
      return {
        valid: false,
        hasConflict: true,
        nights: 0,
        reason: validation.error,
        conflictingBookings: [],
      };
    }

    const overlap = checkDateRangeOverlap(checkInDate, checkOutDate, bookedRanges);
    return {
      valid: true,
      hasConflict: overlap.hasConflict,
      nights: validation.nights,
      reason: overlap.reason,
      conflictingBookings: overlap.conflictingBookings,
    };
  }, [checkInDate, checkOutDate, bookedRanges]);

  // 4.1.4 Live Server-Side PostgreSQL Availability Verification
  useEffect(() => {
    let active = true;
    const verifyOnServer = async () => {
      if (!dateEvaluation.valid) {
        setServerAvailability(null);
        return;
      }
      try {
        const res = await axios.post('/api/bookings/check-availability', {
          propertyId: property.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
        });
        if (active) {
          setServerAvailability(res.data);
        }
      } catch {
        // Keep client-side evaluation if offline
      }
    };
    verifyOnServer();
    return () => {
      active = false;
    };
  }, [property.id, checkInDate, checkOutDate, dateEvaluation.valid]);

  const nights = dateEvaluation.nights > 0 ? dateEvaluation.nights : 1;
  const basePrice = property.price * nights;
  const cleaningFee = property.cleaningFee || 120;
  const serviceFee = property.serviceFee || 65;
  const grandTotal = basePrice + cleaningFee + serviceFee;

  const hasConflict =
    dateEvaluation.hasConflict || (serverAvailability && !serverAvailability.available);
  const conflictMessage =
    dateEvaluation.reason || serverAvailability?.reason || 'Selected dates are unavailable.';

  const updateGuestCount = (type, delta) => {
    const current = guests[type];
    const newTotal = totalGuests + delta;

    if (type === 'adults' && current + delta < 1) return;
    if (type !== 'adults' && current + delta < 0) return;
    if ((type === 'adults' || type === 'children') && newTotal > maxGuests) return;

    setGuests((prev) => ({
      ...prev,
      [type]: prev[type] + delta,
    }));
  };

  // Helper to automatically pick the next available 5-night window after any booked dates
  const pickNextAvailableDates = () => {
    if (bookedRanges.length === 0) {
      setCheckInDate('2026-10-20');
      setCheckOutDate('2026-10-25');
      return;
    }
    const latestEnd = bookedRanges.reduce((maxDate, b) => {
      return b.checkOut > maxDate ? b.checkOut : maxDate;
    }, '2026-10-19');

    const start = new Date(latestEnd);
    start.setDate(start.getDate() + 1);
    const end = new Date(start);
    end.setDate(end.getDate() + 5);

    setCheckInDate(start.toISOString().split('T')[0]);
    setCheckOutDate(end.toISOString().split('T')[0]);
    showToast('Selected next conflict-free 5-night window!', 'info');
  };

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!dateEvaluation.valid || hasConflict) {
      showToast(conflictMessage, 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        '/api/bookings',
        {
          propertyId: property.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          guests: totalGuests,
        },
        { headers }
      );

      const savedBooking = res.data;
      setConfirmationCode(savedBooking.confirmationCode);
      addReservation(savedBooking);
      await refreshProperties();
      await refreshUser();
      setIsReservedModalOpen(true);
      showToast('Reservation verified and saved to PostgreSQL!', 'success');
    } catch (err) {
      if (err.response?.status === 409) {
        showToast(err.response.data.error || 'Booking conflict detected!', 'error');
        await refreshProperties();
        return;
      }
      showToast('Failed to complete booking. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-borderLight p-6 shadow-search sticky top-28 space-y-5">
        {/* Header: Price & Rating */}
        <div className="flex items-baseline justify-between">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-extrabold text-dark">${property.price}</span>
            <span className="text-secondary text-sm">night</span>
          </div>

          <div className="flex items-center gap-1 text-xs font-semibold text-dark">
            <Star className="w-3.5 h-3.5 fill-dark text-dark" />
            <span>{property.rating.toFixed(2)}</span>
            <span className="text-secondary font-normal">· {property.reviewCount} reviews</span>
          </div>
        </div>

        {/* Date and Guest Box */}
        <div
          className={`border rounded-2xl overflow-hidden transition ${
            hasConflict
              ? 'border-red-400 ring-1 ring-red-200'
              : 'border-borderLight focus-within:border-dark'
          }`}
        >
          <div className="grid grid-cols-2 divide-x divide-borderLight border-b border-borderLight">
            <div className="p-3 bg-white hover:bg-gray-50/70 transition">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-dark">
                Check-in
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-dark focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
            <div className="p-3 bg-white hover:bg-gray-50/70 transition">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-dark">
                Checkout
              </label>
              <input
                type="date"
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full bg-transparent text-xs font-medium text-dark focus:outline-none cursor-pointer mt-0.5"
              />
            </div>
          </div>

          {/* Guest Selector Trigger */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsGuestOpen(!isGuestOpen)}
              className="w-full p-3 bg-white hover:bg-gray-50/70 text-left flex items-center justify-between transition"
            >
              <div>
                <span className="block text-[10px] font-extrabold uppercase tracking-wider text-dark">
                  Guests
                </span>
                <span className="text-xs font-medium text-dark">
                  {totalGuests} {totalGuests === 1 ? 'guest' : 'guests'}
                  {guests.infants > 0 ? `, ${guests.infants} infant` : ''}
                </span>
              </div>
              {isGuestOpen ? (
                <ChevronUp className="w-4 h-4 text-dark" />
              ) : (
                <ChevronDown className="w-4 h-4 text-dark" />
              )}
            </button>

            {/* Guest Dropdown */}
            {isGuestOpen && (
              <div className="absolute top-full left-0 right-0 bg-white border border-borderLight rounded-2xl p-4 shadow-modal z-30 mt-1 divide-y divide-gray-100 text-xs">
                {/* Adults */}
                <div className="flex items-center justify-between pb-3">
                  <div>
                    <p className="font-bold text-dark">Adults</p>
                    <p className="text-secondary text-[11px]">Age 13+</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={guests.adults <= 1}
                      onClick={() => updateGuestCount('adults', -1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold text-dark">{guests.adults}</span>
                    <button
                      type="button"
                      disabled={totalGuests >= maxGuests}
                      onClick={() => updateGuestCount('adults', 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Children */}
                <div className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-bold text-dark">Children</p>
                    <p className="text-secondary text-[11px]">Ages 2–12</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={guests.children <= 0}
                      onClick={() => updateGuestCount('children', -1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold text-dark">{guests.children}</span>
                    <button
                      type="button"
                      disabled={totalGuests >= maxGuests}
                      onClick={() => updateGuestCount('children', 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark disabled:opacity-30"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Infants */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="font-bold text-dark">Infants</p>
                    <p className="text-secondary text-[11px]">Under 2</p>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      disabled={guests.infants <= 0}
                      onClick={() => updateGuestCount('infants', -1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark disabled:opacity-30"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-4 text-center font-bold text-dark">{guests.infants}</span>
                    <button
                      type="button"
                      onClick={() => updateGuestCount('infants', 1)}
                      className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center text-dark"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                <div className="pt-3 text-right">
                  <button
                    type="button"
                    onClick={() => setIsGuestOpen(false)}
                    className="font-bold underline text-dark text-xs"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4.1.4 Live Date Availability & Conflict Status Banner */}
        {hasConflict ? (
          <div className="rounded-2xl bg-red-50 border border-red-200 p-3.5 space-y-2 text-xs">
            <div className="flex items-start gap-2 text-red-700 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>Date Conflict / Unavailable</span>
            </div>
            <p className="text-red-600 leading-relaxed text-[11px]">{conflictMessage}</p>
            <button
              type="button"
              onClick={pickNextAvailableDates}
              className="inline-flex items-center gap-1.5 text-[11px] font-bold text-dark bg-white hover:bg-gray-100 border border-red-200 px-3 py-1.5 rounded-xl transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-airbnb" />
              <span>Auto-pick next available dates</span>
            </button>
          </div>
        ) : (
          <div className="rounded-2xl bg-emerald-50/80 border border-emerald-200 px-3.5 py-2.5 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-emerald-800 font-semibold">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>
                Dates available · {nights} {nights === 1 ? 'night' : 'nights'}
              </span>
            </div>
            <span className="text-[10px] font-mono bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-md font-bold">
              [a, b) Verified
            </span>
          </div>
        )}

        {/* Existing Booked Date Ranges (from PostgreSQL) */}
        <div className="rounded-2xl bg-gray-50 border border-gray-200/80 p-3.5 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-dark flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-airbnb" />
              Reserved Dates ({bookedRanges.length})
            </span>
            <span className="text-[10px] text-secondary">PostgreSQL Live</span>
          </div>

          {bookedRanges.length > 0 ? (
            <div className="space-y-1.5 max-h-28 overflow-y-auto">
              {bookedRanges.map((b, idx) => (
                <div
                  key={b.id || idx}
                  className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-gray-200 text-[11px]"
                >
                  <span className="font-mono font-semibold text-dark">
                    {b.checkIn} → {b.checkOut}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckInDate(b.checkIn);
                      setCheckOutDate(b.checkOut);
                    }}
                    className="text-[10px] font-bold text-airbnb hover:underline"
                    title="Click to test overlap detection with this booked range"
                  >
                    Test conflict
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[11px] text-secondary">
              No conflicting reservations — all upcoming dates are open!
            </p>
          )}
        </div>

        {/* Reserve Button */}
        <button
          type="button"
          disabled={hasConflict || isSubmitting}
          onClick={handleReserve}
          className={`w-full py-3.5 px-6 rounded-2xl font-bold text-base shadow-md transition transform flex items-center justify-center gap-2 ${
            hasConflict
              ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-[#FF385C] via-[#E00B41] to-[#D70466] hover:opacity-95 text-white active:scale-[0.98] cursor-pointer'
          }`}
        >
          {isSubmitting
            ? 'Checking & Saving to PostgreSQL...'
            : hasConflict
            ? 'Dates Unavailable'
            : 'Reserve'}
        </button>

        <p className="text-center text-xs text-secondary font-medium">
          Protected by server-side Prisma transaction conflict detection
        </p>

        {/* Price Breakdown */}
        <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center justify-between text-secondary">
            <span className="underline">
              ${property.price} x {nights} {nights === 1 ? 'night' : 'nights'}
            </span>
            <span>${basePrice}</span>
          </div>
          <div className="flex items-center justify-between text-secondary">
            <span className="underline">Cleaning fee</span>
            <span>${cleaningFee}</span>
          </div>
          <div className="flex items-center justify-between text-secondary">
            <span className="underline">AbodeX service fee</span>
            <span>${serviceFee}</span>
          </div>

          <div className="pt-3 border-t border-gray-100 flex items-center justify-between font-bold text-dark text-base">
            <span>Total before taxes</span>
            <span>${grandTotal}</span>
          </div>
        </div>

        {/* Security badge */}
        <div className="pt-2 flex items-center gap-3 text-xs text-secondary">
          <ShieldCheck className="w-5 h-5 text-airbnb shrink-0" />
          <span>Every booking includes complimentary protection from Host cancellations.</span>
        </div>
      </div>

      {/* Booking Confirmation Modal */}
      {isReservedModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-modal border border-borderLight text-center space-y-5">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h3 className="text-2xl font-extrabold text-dark">
                You're going to {property.city}!
              </h3>
              <p className="text-xs text-secondary">
                Confirmation code:{' '}
                <span className="font-mono font-bold text-dark">{confirmationCode}</span>
              </p>
            </div>

            {/* Trip Details Card */}
            <div className="bg-bgLight rounded-2xl p-4 text-left space-y-3 border border-borderLight">
              <div className="flex items-center gap-3">
                <img
                  src={property.images[0]}
                  alt="Property"
                  className="w-16 h-16 rounded-xl object-cover shrink-0"
                />
                <div>
                  <h4 className="font-bold text-dark text-sm leading-tight truncate max-w-[200px]">
                    {property.title}
                  </h4>
                  <p className="text-xs text-secondary mt-0.5">Hosted by {property.host.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-gray-200">
                <div>
                  <span className="text-secondary block">Dates ({nights} nights)</span>
                  <span className="font-semibold text-dark">
                    {checkInDate} to {checkOutDate}
                  </span>
                </div>
                <div>
                  <span className="text-secondary block">Guests</span>
                  <span className="font-semibold text-dark">{totalGuests} guests</span>
                </div>
              </div>

              <div className="pt-2 border-t border-gray-200 flex justify-between items-center text-xs">
                <span className="text-secondary">Amount Paid</span>
                <span className="font-extrabold text-dark text-sm">${grandTotal}</span>
              </div>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsReservedModalOpen(false);
                  navigate('/profile?tab=trips');
                }}
                className="w-full py-3 bg-dark hover:bg-black text-white font-bold rounded-xl text-sm transition"
              >
                View Trips in Profile
              </button>
              <button
                type="button"
                onClick={() => setIsReservedModalOpen(false)}
                className="w-full py-2.5 text-secondary hover:text-dark font-semibold text-xs transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
