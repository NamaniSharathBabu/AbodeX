import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import {
  Plus,
  Home,
  Calendar,
  DollarSign,
  Star,
  Trash2,
  Edit3,
  Check,
  X,
  MapPin,
  Users,
  Bed,
  ShieldCheck,
  Sparkles,
  ExternalLink,
  KeyRound,
  ArrowLeftRight,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useSearch } from '../context/SearchContext';
import { useToast } from '../context/ToastContext';
import { geocodeDestination } from '../utils/stayfinderAlgorithms';

const API_BASE = 'http://localhost:5000';

export const HostDashboardPage = () => {
  const { user, token, switchUserMode, isHostSessionUnlocked } = useAuth();
  const { allProperties, refreshProperties } = useSearch();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('listings'); // 'listings' | 'bookings' | 'create'
  const [bookings, setBookings] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', price: 0, guests: 2, bedrooms: 1 });
  const [submitting, setSubmitting] = useState(false);

  const [newListing, setNewListing] = useState({
    title: '',
    type: 'Entire luxury villa',
    category: 'amazing-pools',
    city: 'Hyderabad',
    country: 'India',
    price: 280,
    guests: 6,
    bedrooms: 3,
    beds: 4,
    bathrooms: 3,
    imageUrl:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=1600&q=80',
    description:
      'Architect-designed contemporary residence with private heated pool, high-speed fiber Wi-Fi, and panoramic views.',
    amenities: [
      'High-Speed Wi-Fi',
      'Private Infinity Pool',
      'Air Conditioning',
      'Chef Kitchen',
      'Free Parking',
      'Dedicated Workspace',
    ],
  });

  const availableAmenities = [
    'High-Speed Wi-Fi',
    'Private Infinity Pool',
    'Hot Tub',
    'Air Conditioning',
    'Chef Kitchen',
    'Free Parking',
    'EV Charger',
    'Dedicated Workspace',
    'Waterfront Access',
    'Wood Fireplace',
    'Washer & Dryer',
    'Pet Friendly',
  ];

  const categories = [
    { id: 'beachfront', label: 'Beachfront' },
    { id: 'cabins', label: 'Cabins' },
    { id: 'amazing-pools', label: 'Amazing Pools' },
    { id: 'mansions', label: 'Mansions' },
    { id: 'tiny-homes', label: 'Tiny Homes' },
    { id: 'lakefront', label: 'Lakefront' },
    { id: 'iconic-cities', label: 'Iconic Cities' },
    { id: 'countryside', label: 'Countryside' },
    { id: 'treehouses', label: 'Treehouses' },
    { id: 'tropical', label: 'Tropical' },
    { id: 'castles', label: 'Castles' },
    { id: 'trending', label: 'Trending' },
  ];

  const fetchHostBookings = async () => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/bookings`, { headers });
      if (Array.isArray(res.data)) {
        setBookings(res.data);
      }
    } catch (e) {
      console.error('Failed to load host bookings:', e);
    }
  };

  useEffect(() => {
    fetchHostBookings();
  }, [token, user?.role]);

  const isAuthorizedHost = user?.role === 'HOST' || user?.role === 'ADMIN';

  // Ensure user is in HOST mode before mutating listings (asks password once per session)
  const requireHostModeAction = async (actionFn) => {
    if (isAuthorizedHost) {
      actionFn();
      return;
    }
    const unlockedImmediately = await switchUserMode('HOST', () => {
      showToast('Host mode unlocked for this session!', 'success');
      actionFn();
    });
    if (unlockedImmediately) {
      showToast('Switched to Host mode!', 'success');
      actionFn();
    }
  };

  const handleSwitchBackToGuest = async () => {
    await switchUserMode('GUEST');
    showToast('Switched back to Guest mode (no password needed)!', 'info');
  };

  const toggleNewAmenity = (amenity) => {
    setNewListing((prev) => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter((a) => a !== amenity)
        : [...prev.amenities, amenity],
    }));
  };

  const handleCreateProperty = async (e) => {
    e.preventDefault();
    if (!isAuthorizedHost) {
      await requireHostModeAction(() => {});
      return;
    }
    if (!newListing.title.trim() || !newListing.city.trim()) {
      showToast('Please enter a property title and city', 'error');
      return;
    }

    try {
      setSubmitting(true);
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const geo = geocodeDestination(newListing.city, allProperties) || {
        lat: 17.385,
        lng: 78.4867,
      };

      await axios.post(
        `${API_BASE}/api/properties`,
        {
          title: newListing.title,
          type: newListing.type,
          category: newListing.category,
          city: newListing.city,
          country: newListing.country,
          location: `${newListing.city}, ${newListing.country}`,
          price: Number(newListing.price),
          guests: Number(newListing.guests),
          bedrooms: Number(newListing.bedrooms),
          beds: Number(newListing.beds),
          bathrooms: Number(newListing.bathrooms),
          description: newListing.description,
          amenities: newListing.amenities,
          images: [
            newListing.imageUrl,
            'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1200&q=80',
            'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
          ],
          coordinates: { lat: geo.lat, lng: geo.lng },
        },
        { headers }
      );

      await refreshProperties();
      showToast('New property listing saved to PostgreSQL!', 'success');
      setNewListing((prev) => ({ ...prev, title: '' }));
      setActiveTab('listings');
    } catch (err) {
      showToast(err.response?.data?.error || 'Failed to create property', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const startEditing = (prop) => {
    requireHostModeAction(() => {
      setEditingId(prop.id);
      setEditForm({
        title: prop.title,
        price: prop.price,
        guests: prop.guests,
        bedrooms: prop.bedrooms,
      });
    });
  };

  const handleSaveEdit = async (propId) => {
    try {
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      await axios.put(`${API_BASE}/api/properties/${propId}`, editForm, { headers });
      setEditingId(null);
      await refreshProperties();
      showToast('Property updated in PostgreSQL!', 'success');
    } catch (err) {
      showToast(err.response?.data?.error || 'Update failed', 'error');
    }
  };

  const handleDeleteProperty = (propId, title) => {
    requireHostModeAction(async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.delete(`${API_BASE}/api/properties/${propId}`, { headers });
        await refreshProperties();
        showToast(`Deleted "${title.substring(0, 24)}..." from PostgreSQL`, 'info');
      } catch (err) {
        showToast(err.response?.data?.error || 'Delete failed', 'error');
      }
    });
  };

  const handleCancelGuestBooking = (bookingId) => {
    requireHostModeAction(async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        await axios.patch(`${API_BASE}/api/bookings/${bookingId}/cancel`, {}, { headers });
        await fetchHostBookings();
        await refreshProperties();
        showToast('Reservation cancelled and dates released in PostgreSQL', 'info');
      } catch {
        showToast('Failed to cancel reservation', 'error');
      }
    });
  };

  const activeBookings = bookings.filter((b) => b.status !== 'Cancelled');
  const totalRevenue = activeBookings.reduce((sum, b) => sum + (b.totalPrice || 0), 0);
  const avgRating =
    allProperties.length > 0
      ? (
          allProperties.reduce((s, p) => s + (p.rating || 5), 0) / allProperties.length
        ).toFixed(2)
      : '4.96';

  return (
    <div className="bg-bgLight min-h-screen py-8">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Banner */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLight shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-airbnb/10 text-airbnb text-xs font-bold">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>
                {user?.name || 'User'} · Active Mode: {user?.role || 'GUEST'}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
              Host Property & Reservation Management
            </h1>
            <p className="text-xs sm:text-sm text-secondary">
              As a combined Guest/Host user, unlock Host Mode once per session with your passkey to add, edit, or delete listings. Switching back to Guest Mode requires no password.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {!isAuthorizedHost ? (
              <button
                type="button"
                onClick={() => requireHostModeAction(() => {})}
                className="flex items-center gap-2 px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>
                  {isHostSessionUnlocked()
                    ? 'Switch to Host Mode (Session Unlocked)'
                    : 'Unlock Host Mode (Passkey)'}
                </span>
              </button>
            ) : (
              user?.role === 'HOST' && (
                <button
                  type="button"
                  onClick={handleSwitchBackToGuest}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-300 hover:border-dark bg-white text-dark rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  <ArrowLeftRight className="w-3.5 h-3.5" />
                  <span>Switch to Guest Mode (No Password)</span>
                </button>
              )
            )}

            <button
              type="button"
              onClick={() => requireHostModeAction(() => setActiveTab('create'))}
              className="flex items-center gap-2 px-5 py-3 bg-airbnb hover:bg-airbnb-hover text-white font-bold rounded-2xl text-xs sm:text-sm shadow-md transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Listing</span>
            </button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Active Listings</span>
              <Home className="w-4 h-4 text-airbnb" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{allProperties.length}</p>
            <p className="text-[11px] text-secondary">Synced with PostgreSQL</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Active Reservations</span>
              <Calendar className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{activeBookings.length}</p>
            <p className="text-[11px] text-secondary">{bookings.length} total bookings</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Host Earnings</span>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-extrabold text-dark">${totalRevenue.toLocaleString()}</p>
            <p className="text-[11px] text-secondary">Confirmed & completed stays</p>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-borderLight space-y-1">
            <div className="flex items-center justify-between text-secondary text-xs font-semibold">
              <span>Average Rating</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <p className="text-2xl font-extrabold text-dark">{avgRating}</p>
            <p className="text-[11px] text-secondary">Superhost status active</p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl p-1.5 border border-borderLight flex items-center gap-2 max-w-xl">
          <button
            type="button"
            onClick={() => setActiveTab('listings')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'listings'
                ? 'bg-dark text-white'
                : 'text-secondary hover:text-dark'
            }`}
          >
            Listings ({allProperties.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bookings')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'bookings'
                ? 'bg-dark text-white'
                : 'text-secondary hover:text-dark'
            }`}
          >
            Guest Bookings ({bookings.length})
          </button>
          <button
            type="button"
            onClick={() => requireHostModeAction(() => setActiveTab('create'))}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
              activeTab === 'create'
                ? 'bg-airbnb text-white'
                : 'text-secondary hover:text-dark'
            }`}
          >
            + Create Listing
          </button>
        </div>

        {/* TAB 1: Manage Listings */}
        {activeTab === 'listings' && (
          <div className="space-y-4">
            {allProperties.map((prop) => {
              const isEditing = editingId === prop.id;
              return (
                <div
                  key={prop.id}
                  className="bg-white rounded-3xl p-5 border border-borderLight shadow-2xs flex flex-col lg:flex-row lg:items-center justify-between gap-5"
                >
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 flex-1">
                    <img
                      src={prop.images?.[0]}
                      alt={prop.title}
                      className="w-full sm:w-28 h-24 rounded-2xl object-cover shrink-0 bg-gray-100"
                    />
                    <div className="space-y-1.5 flex-1 w-full">
                      <div className="flex items-center gap-2 text-xs text-secondary">
                        <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-[11px] font-semibold text-dark">
                          {prop.id}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-airbnb" />
                          {prop.location}
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-1 font-bold text-dark">
                          <Star className="w-3.5 h-3.5 fill-dark" />
                          {prop.rating?.toFixed(2)} ({prop.reviewCount})
                        </span>
                      </div>

                      {isEditing ? (
                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                          <div className="sm:col-span-2">
                            <label className="block text-[10px] font-bold uppercase text-secondary">
                              Title
                            </label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) =>
                                setEditForm({ ...editForm, title: e.target.value })
                              }
                              className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary">
                              Nightly Price ($)
                            </label>
                            <input
                              type="number"
                              value={editForm.price}
                              onChange={(e) =>
                                setEditForm({ ...editForm, price: Number(e.target.value) })
                              }
                              className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold uppercase text-secondary">
                              Max Guests
                            </label>
                            <input
                              type="number"
                              value={editForm.guests}
                              onChange={(e) =>
                                setEditForm({ ...editForm, guests: Number(e.target.value) })
                              }
                              className="w-full p-2 rounded-xl border border-gray-300 text-xs font-semibold text-dark"
                            />
                          </div>
                        </div>
                      ) : (
                        <>
                          <h3 className="text-base font-bold text-dark">{prop.title}</h3>
                          <div className="flex flex-wrap items-center gap-4 text-xs text-secondary">
                            <span className="font-extrabold text-dark text-sm">
                              ${prop.price}{' '}
                              <span className="font-normal text-xs text-secondary">/ night</span>
                            </span>
                            <span className="flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> {prop.guests} guests
                            </span>
                            <span className="flex items-center gap-1">
                              <Bed className="w-3.5 h-3.5" /> {prop.bedrooms} bedrooms
                            </span>
                            <span className="text-emerald-700 font-semibold">
                              {(prop.bookedDates || []).length} active reservations
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2 self-end lg:self-center shrink-0">
                    {isEditing ? (
                      <>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(prop.id)}
                          className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Save to DB</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-2 border border-gray-200 hover:bg-gray-100 rounded-xl text-secondary"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/rooms/${prop.id}`}
                          className="p-2.5 border border-gray-200 hover:border-dark rounded-xl text-dark transition"
                          title="View Public Listing"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => startEditing(prop)}
                          className="flex items-center gap-1.5 px-3.5 py-2 border border-gray-200 hover:border-dark rounded-xl text-xs font-semibold text-dark transition cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteProperty(prop.id, prop.title)}
                          className="flex items-center gap-1.5 px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white rounded-xl text-xs font-semibold text-red-600 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete</span>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TAB 2: Guest Bookings */}
        {activeTab === 'bookings' && (
          <div className="bg-white rounded-3xl border border-borderLight overflow-hidden shadow-2xs">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-dark">Incoming Guest Reservations</h3>
                <p className="text-xs text-secondary">
                  Real-time reservation records stored in PostgreSQL
                </p>
              </div>
            </div>

            <div className="divide-y divide-gray-100">
              {bookings.map((b) => {
                const isCancelled = b.status === 'Cancelled';
                return (
                  <div
                    key={b.id}
                    className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-gray-50/50"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                            isCancelled
                              ? 'bg-red-100 text-red-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {b.status}
                        </span>
                        <span className="font-mono text-xs font-bold text-dark">
                          {b.confirmationCode}
                        </span>
                        <span className="text-xs text-secondary">
                          · Guest: <strong className="text-dark">{b.guestName}</strong>
                        </span>
                      </div>
                      <p className="text-sm font-bold text-dark">{b.title}</p>
                      <p className="text-xs text-secondary">
                        Check-in: <strong>{b.checkIn}</strong> → Check-out:{' '}
                        <strong>{b.checkOut}</strong> · {b.guests} guests
                      </p>
                    </div>

                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <span className="text-xs text-secondary block">Total</span>
                        <span className="text-base font-extrabold text-dark">
                          ${b.totalPrice}
                        </span>
                      </div>

                      {!isCancelled && (
                        <button
                          type="button"
                          onClick={() => handleCancelGuestBooking(b.id)}
                          className="px-3.5 py-2 border border-red-200 bg-red-50 hover:bg-red-600 hover:text-white text-red-600 rounded-xl text-xs font-bold transition cursor-pointer"
                        >
                          Cancel Stay
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: Create New Property Listing */}
        {activeTab === 'create' && (
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLight shadow-xs max-w-3xl">
            <div className="pb-6 border-b border-gray-100 space-y-1">
              <h2 className="text-xl font-extrabold text-dark flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-airbnb" />
                Publish a New Property Listing
              </h2>
              <p className="text-xs text-secondary">
                Saves directly to the PostgreSQL <code>Property</code> table with automatic coordinate geocoding.
              </p>
            </div>

            <form onSubmit={handleCreateProperty} className="space-y-5 pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Property Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Jubilee Hills Sky Villa with Heated Lap Pool"
                    value={newListing.title}
                    onChange={(e) => setNewListing({ ...newListing, title: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Hyderabad, Goa, Malibu, Kyoto"
                    value={newListing.city}
                    onChange={(e) => setNewListing({ ...newListing, city: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Country *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., India, United States"
                    value={newListing.country}
                    onChange={(e) => setNewListing({ ...newListing, country: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Category
                  </label>
                  <select
                    value={newListing.category}
                    onChange={(e) => setNewListing({ ...newListing, category: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark bg-white focus:border-dark focus:outline-none"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Property Type
                  </label>
                  <input
                    type="text"
                    value={newListing.type}
                    onChange={(e) => setNewListing({ ...newListing, type: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Nightly Price (USD $) *
                  </label>
                  <input
                    type="number"
                    min="20"
                    required
                    value={newListing.price}
                    onChange={(e) => setNewListing({ ...newListing, price: e.target.value })}
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-dark mb-1">
                      Guests
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newListing.guests}
                      onChange={(e) => setNewListing({ ...newListing, guests: e.target.value })}
                      className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-dark mb-1">
                      Bedrooms
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newListing.bedrooms}
                      onChange={(e) =>
                        setNewListing({ ...newListing, bedrooms: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-dark mb-1">
                      Baths
                    </label>
                    <input
                      type="number"
                      min="1"
                      step="0.5"
                      value={newListing.bathrooms}
                      onChange={(e) =>
                        setNewListing({ ...newListing, bathrooms: e.target.value })
                      }
                      className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark"
                    />
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Cover Photo URL
                  </label>
                  <input
                    type="url"
                    value={newListing.imageUrl}
                    onChange={(e) =>
                      setNewListing({ ...newListing, imageUrl: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold uppercase text-dark mb-1">
                    Description
                  </label>
                  <textarea
                    rows="3"
                    value={newListing.description}
                    onChange={(e) =>
                      setNewListing({ ...newListing, description: e.target.value })
                    }
                    className="w-full p-3 rounded-xl border border-borderLight text-sm font-medium text-dark focus:border-dark focus:outline-none"
                  />
                </div>
              </div>

              {/* Amenities Checkboxes */}
              <div>
                <label className="block text-xs font-bold uppercase text-dark mb-2">
                  Select Included Amenities
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {availableAmenities.map((amenity) => {
                    const selected = newListing.amenities.includes(amenity);
                    return (
                      <button
                        key={amenity}
                        type="button"
                        onClick={() => toggleNewAmenity(amenity)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold text-left flex items-center gap-2 transition cursor-pointer ${
                          selected
                            ? 'border-dark bg-gray-900 text-white'
                            : 'border-borderLight text-dark hover:border-gray-400'
                        }`}
                      >
                        <Check
                          className={`w-3.5 h-3.5 ${
                            selected ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                        <span className="truncate">{amenity}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('listings')}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-secondary hover:text-dark"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 rounded-xl bg-airbnb hover:bg-airbnb-hover text-white text-xs sm:text-sm font-bold shadow-md transition cursor-pointer"
                >
                  {submitting ? 'Publishing to PostgreSQL...' : 'Publish Listing'}
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
};
