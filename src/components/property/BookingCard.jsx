import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, ChevronDown, ChevronUp, Plus, Minus, CheckCircle, ShieldCheck, Flag } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export const BookingCard = ({ property }) => {
  const navigate = useNavigate();
  const { addReservation } = useAuth();
  const { showToast } = useToast();

  const [nights, setNights] = useState(5);
  const [checkInDate, setCheckInDate] = useState('2026-10-12');
  const [checkOutDate, setCheckOutDate] = useState('2026-10-17');
  const [guests, setGuests] = useState({ adults: 2, children: 0, infants: 0, pets: 0 });
  const [isGuestOpen, setIsGuestOpen] = useState(false);
  const [isReservedModalOpen, setIsReservedModalOpen] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');

  const totalGuests = guests.adults + guests.children;
  const maxGuests = property.guests || 6;

  const basePrice = property.price * nights;
  const cleaningFee = property.cleaningFee || 120;
  const serviceFee = property.serviceFee || 65;
  const grandTotal = basePrice + cleaningFee + serviceFee;

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

  const handleDateChange = (type, value) => {
    if (type === 'checkIn') {
      setCheckInDate(value);
    } else {
      setCheckOutDate(value);
    }
  };

  const handleReserve = (e) => {
    e.preventDefault();
    const code = `HM-${Math.floor(10000 + Math.random() * 90000)}-${property.city.substring(0, 2).toUpperCase()}`;
    setConfirmationCode(code);

    const newBooking = {
      id: `trip-${Date.now()}`,
      propertyId: property.id,
      title: property.title,
      location: `${property.city}, ${property.country}`,
      checkIn: checkInDate,
      checkOut: checkOutDate,
      guests: totalGuests,
      totalPrice: grandTotal,
      status: 'Confirmed',
      image: property.images[0],
      hostName: property.host.name,
      confirmationCode: code,
    };

    addReservation(newBooking);
    setIsReservedModalOpen(true);
    showToast('Reservation successfully confirmed!', 'success');
  };

  return (
    <>
      <div className="bg-white rounded-3xl border border-borderLight p-6 shadow-search sticky top-28 space-y-6">
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
        <div className="border border-borderLight rounded-2xl overflow-hidden focus-within:border-dark transition">
          <div className="grid grid-cols-2 divide-x divide-borderLight border-b border-borderLight">
            <div className="p-3 bg-white hover:bg-gray-50/70 transition">
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-dark">
                Check-in
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => handleDateChange('checkIn', e.target.value)}
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
                onChange={(e) => handleDateChange('checkOut', e.target.value)}
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
              {isGuestOpen ? <ChevronUp className="w-4 h-4 text-dark" /> : <ChevronDown className="w-4 h-4 text-dark" />}
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

        {/* Reserve Button */}
        <button
          type="button"
          onClick={handleReserve}
          className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-[#FF385C] via-[#E00B41] to-[#D70466] hover:opacity-95 text-white font-bold text-base shadow-md transition transform active:scale-[0.98] cursor-pointer"
        >
          Reserve
        </button>

        <p className="text-center text-xs text-secondary font-medium">
          You won't be charged yet (Instant simulation)
        </p>

        {/* Price Breakdown */}
        <div className="space-y-3 pt-4 border-t border-gray-100 text-sm">
          <div className="flex items-center justify-between text-secondary">
            <span className="underline">${property.price} x {nights} nights</span>
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
              <h3 className="text-2xl font-extrabold text-dark">You're going to {property.city}!</h3>
              <p className="text-xs text-secondary">
                Confirmation code: <span className="font-mono font-bold text-dark">{confirmationCode}</span>
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
                  <span className="text-secondary block">Dates</span>
                  <span className="font-semibold text-dark">{checkInDate} to {checkOutDate}</span>
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
