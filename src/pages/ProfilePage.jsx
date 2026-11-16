import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { TripCard } from '../components/profile/TripCard';
import { PropertyCard } from '../components/property/PropertyCard';
import { properties } from '../data/properties';
import { useToast } from '../context/ToastContext';
import {
  User,
  ShieldCheck,
  Award,
  Calendar,
  Heart,
  Briefcase,
  Settings,
  Edit3,
  Check,
  Compass,
} from 'lucide-react';

export const ProfilePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'trips';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [isEditing, setIsEditing] = useState(false);

  const { user, updateProfile } = useAuth();
  const { wishlist } = useWishlist();
  const { showToast } = useToast();

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    about: user?.about || '',
  });

  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateProfile(formData);
    setIsEditing(false);
    showToast('Profile updated successfully!', 'success');
  };

  const wishlistedProperties = properties.filter((p) => wishlist.includes(p.id));

  return (
    <div className="bg-bgLight min-h-screen py-10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column: User Card & Stats */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLight shadow-airbnb space-y-6">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <img
                    src={user?.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80'}
                    alt={user?.name}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-md"
                  />
                  <div className="absolute bottom-1 right-1 bg-airbnb text-white p-1.5 rounded-full shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                </div>

                <h2 className="text-2xl font-extrabold text-dark">{user?.name}</h2>
                <span className="text-xs font-semibold text-secondary mt-0.5">
                  {user?.superguest ? 'Superguest · Verified Traveler' : 'Guest'}
                </span>
                <p className="text-xs text-secondary mt-1">{user?.joinedDate}</p>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-3 gap-2 py-4 border-y border-gray-100 text-center">
                <div>
                  <span className="text-lg font-extrabold text-dark block">
                    {user?.upcomingTrips?.length + (user?.pastTrips?.length || 0)}
                  </span>
                  <span className="text-[11px] text-secondary">Trips</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-dark block">
                    {user?.stats?.reviewsGiven || 12}
                  </span>
                  <span className="text-[11px] text-secondary">Reviews</span>
                </div>
                <div>
                  <span className="text-lg font-extrabold text-dark block">
                    {user?.stats?.yearsOnPlatform || 5}
                  </span>
                  <span className="text-[11px] text-secondary">Years</span>
                </div>
              </div>

              {/* About Box */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-secondary">
                  About
                </h4>
                <p className="text-xs sm:text-sm text-dark leading-relaxed">
                  {user?.about}
                </p>
              </div>

              {/* Verified Identity Badge */}
              <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 space-y-2 text-xs">
                <div className="flex items-center gap-2 font-bold text-dark">
                  <ShieldCheck className="w-4 h-4 text-airbnb" />
                  <span>Identity Confirmed</span>
                </div>
                <ul className="text-secondary space-y-1 text-[11px]">
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Email address verified</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Phone number confirmed</span>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Government ID approved</span>
                  </li>
                </ul>
              </div>

              <button
                type="button"
                onClick={() => setIsEditing(!isEditing)}
                className="w-full py-2.5 px-4 border border-dark rounded-xl text-xs font-bold text-dark hover:bg-gray-100 transition flex items-center justify-center gap-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>{isEditing ? 'Cancel editing' : 'Edit profile'}</span>
              </button>
            </div>
          </div>

          {/* Right Column: Tabs (Trips, Wishlists, Settings) */}
          <div className="lg:col-span-2 space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white rounded-2xl p-1.5 border border-borderLight flex items-center shadow-xs">
              <button
                onClick={() => handleTabChange('trips')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  activeTab === 'trips'
                    ? 'bg-dark text-white shadow-xs'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Briefcase className="w-4 h-4" />
                <span>Trips & Bookings</span>
              </button>

              <button
                onClick={() => handleTabChange('wishlist')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  activeTab === 'wishlist'
                    ? 'bg-dark text-white shadow-xs'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Heart className="w-4 h-4" />
                <span>Wishlist ({wishlist.length})</span>
              </button>

              <button
                onClick={() => handleTabChange('settings')}
                className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 transition ${
                  activeTab === 'settings'
                    ? 'bg-dark text-white shadow-xs'
                    : 'text-secondary hover:text-dark'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>
            </div>

            {/* Tab 1: Trips */}
            {activeTab === 'trips' && (
              <div className="space-y-8 animate-fade-in">
                {/* Upcoming Trips */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-dark">Upcoming Trips</h3>
                  {user?.upcomingTrips && user.upcomingTrips.length > 0 ? (
                    <div className="space-y-4">
                      {user.upcomingTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-borderLight text-center space-y-3">
                      <p className="text-sm text-secondary">No upcoming trips planned yet.</p>
                      <Link
                        to="/"
                        className="inline-flex items-center gap-2 text-xs font-bold text-airbnb underline"
                      >
                        Find your next stay
                      </Link>
                    </div>
                  )}
                </div>

                {/* Past Trips */}
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-dark">Where you've been</h3>
                  {user?.pastTrips && user.pastTrips.length > 0 ? (
                    <div className="space-y-4">
                      {user.pastTrips.map((trip) => (
                        <TripCard key={trip.id} trip={trip} isPast={true} />
                      ))}
                    </div>
                  ) : (
                    <div className="bg-white rounded-3xl p-8 border border-borderLight text-center">
                      <p className="text-sm text-secondary">No past trips recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Tab 2: Wishlist */}
            {activeTab === 'wishlist' && (
              <div className="animate-fade-in space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-bold text-dark">Saved homes</h3>
                  <Link
                    to="/wishlists"
                    className="text-xs font-bold text-airbnb underline"
                  >
                    View full wishlist page
                  </Link>
                </div>

                {wishlistedProperties.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {wishlistedProperties.map((property) => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white rounded-3xl p-12 text-center border border-borderLight space-y-4">
                    <Heart className="w-10 h-10 text-secondary mx-auto" />
                    <p className="text-sm text-secondary">No saved stays in your wishlist yet.</p>
                    <Link
                      to="/"
                      className="inline-flex items-center gap-2 px-6 py-2.5 bg-dark text-white rounded-xl text-xs font-bold"
                    >
                      Start searching
                    </Link>
                  </div>
                )}
              </div>
            )}

            {/* Tab 3: Settings / Edit Profile */}
            {(activeTab === 'settings' || isEditing) && (
              <div className="bg-white rounded-3xl p-6 sm:p-8 border border-borderLight shadow-xs space-y-6 animate-fade-in">
                <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                  <h3 className="text-lg font-bold text-dark">Account & Profile Settings</h3>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-dark uppercase mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        className="w-full p-3 rounded-xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-dark uppercase mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full p-3 rounded-xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark uppercase mb-1">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className="w-full p-3 rounded-xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-dark uppercase mb-1">
                      About You
                    </label>
                    <textarea
                      rows="4"
                      value={formData.about}
                      onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                      className="w-full p-3 rounded-xl border border-borderLight text-sm text-dark focus:border-dark focus:outline-none font-medium"
                    />
                  </div>

                  <div className="pt-4 flex justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="px-5 py-2.5 text-secondary hover:text-dark text-xs font-bold transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-6 py-2.5 bg-dark hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};
