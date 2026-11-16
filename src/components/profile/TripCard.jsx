import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, ChevronRight, XCircle, Trash2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';

export const TripCard = ({ trip, isPast = false }) => {
  const { cancelReservation, deleteReservation } = useAuth();
  const { refreshProperties } = useSearch();
  const { showToast } = useToast();
  const [busy, setBusy] = useState(false);

  const isCancelled = (trip.status || '').toUpperCase() === 'CANCELLED';

  const handleCancel = async () => {
    setBusy(true);
    const ok = await cancelReservation(trip.id);
    await refreshProperties();
    setBusy(false);
    if (ok) {
      showToast(
        `Cancelled reservation ${trip.confirmationCode || ''}. Dates (${trip.checkIn} to ${trip.checkOut}) are now available again!`,
        'info'
      );
    } else {
      showToast('Failed to cancel reservation', 'error');
    }
  };

  const handleDelete = async () => {
    setBusy(true);
    const ok = await deleteReservation(trip.id);
    await refreshProperties();
    setBusy(false);
    if (ok) {
      showToast('Removed reservation record from PostgreSQL', 'info');
    }
  };

  return (
    <div
      className={`bg-white rounded-3xl border overflow-hidden hover:shadow-md transition flex flex-col sm:flex-row group ${
        isCancelled ? 'border-red-200 opacity-80' : 'border-borderLight'
      }`}
    >
      {/* Property Thumbnail */}
      <div className="sm:w-1/3 aspect-4/3 sm:aspect-auto overflow-hidden bg-gray-100 relative shrink-0">
        <img
          src={trip.image}
          alt={trip.title}
          className={`w-full h-full object-cover group-hover:scale-105 transition duration-500 ${
            isCancelled ? 'grayscale' : ''
          }`}
        />
        <div
          className={`absolute top-3 left-3 px-2.5 py-1 rounded-full text-xs font-bold shadow-xs ${
            isCancelled
              ? 'bg-red-600 text-white'
              : isPast
              ? 'bg-gray-800 text-white'
              : 'bg-emerald-600 text-white'
          }`}
        >
          {trip.status || (isPast ? 'Completed' : 'Confirmed')}
        </div>
      </div>

      {/* Trip Information */}
      <div className="p-5 sm:p-6 flex-1 flex flex-col justify-between">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-secondary flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-airbnb" />
              {trip.location}
            </span>
            {trip.confirmationCode && (
              <span className="text-[11px] font-mono text-secondary bg-gray-100 px-2 py-0.5 rounded-md">
                {trip.confirmationCode}
              </span>
            )}
          </div>

          <h3 className="text-base sm:text-lg font-bold text-dark line-clamp-1">
            {trip.title}
          </h3>

          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary pt-1">
            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-gray-500" />
              <span className={isCancelled ? 'line-through text-red-500' : ''}>
                {trip.checkIn} — {trip.checkOut}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-gray-500" />
              <span>{trip.guests} guests</span>
            </div>
          </div>

          {trip.hostName && (
            <p className="text-xs text-secondary">
              Hosted by <span className="font-semibold text-dark">{trip.hostName}</span>
            </p>
          )}
        </div>

        <div className="pt-4 mt-4 border-t border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs text-secondary block">
              {isCancelled ? 'Refunded / Cancelled' : 'Total Paid'}
            </span>
            <span
              className={`text-base font-extrabold ${
                isCancelled ? 'line-through text-secondary' : 'text-dark'
              }`}
            >
              ${trip.totalPrice}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {!isPast && !isCancelled && (
              <button
                type="button"
                disabled={busy}
                onClick={handleCancel}
                className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-xs font-semibold text-red-600 transition cursor-pointer disabled:opacity-50"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>{busy ? 'Cancelling...' : 'Cancel booking'}</span>
              </button>
            )}

            {isCancelled && (
              <button
                type="button"
                disabled={busy}
                onClick={handleDelete}
                className="flex items-center gap-1.5 px-3 py-2 border border-gray-200 hover:bg-red-50 hover:text-red-600 rounded-xl text-xs font-semibold text-secondary transition cursor-pointer"
                title="Delete cancelled booking from database"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}

            <Link
              to={`/rooms/${trip.propertyId}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-dark hover:text-white rounded-xl text-xs font-semibold text-dark transition"
            >
              <span>View listing</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
