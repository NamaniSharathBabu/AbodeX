import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Calendar, Users, Plus, Minus, X } from 'lucide-react';
import { useSearch } from '../../context/SearchContext';

export const SearchBar = ({ isCompact = false, onSearchSubmit }) => {
  const navigate = useNavigate();
  const {
    destination,
    setDestination,
    checkIn,
    setCheckIn,
    checkOut,
    setCheckOut,
    guests,
    updateGuests,
    totalGuests,
  } = useSearch();

  const [activeTab, setActiveTab] = useState(null); // 'where', 'checkin', 'checkout', 'who'
  const [showGuestPopup, setShowGuestPopup] = useState(false);
  const [showDestPopup, setShowDestPopup] = useState(false);
  const containerRef = useRef(null);

  const quickDestinations = [
    { name: "I'm flexible", icon: 'Sparkles', query: '' },
    { name: 'California, US', icon: 'MapPin', query: 'California' },
    { name: 'Santorini, Greece', icon: 'MapPin', query: 'Santorini' },
    { name: 'Tuscany, Italy', icon: 'MapPin', query: 'Tuscany' },
    { name: 'Lapland, Finland', icon: 'MapPin', query: 'Finland' },
    { name: 'Kyoto, Japan', icon: 'MapPin', query: 'Japan' },
    { name: 'Bali, Indonesia', icon: 'MapPin', query: 'Bali' },
  ];

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setActiveTab(null);
        setShowGuestPopup(false);
        setShowDestPopup(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    setActiveTab(null);
    setShowGuestPopup(false);
    setShowDestPopup(false);
    if (onSearchSubmit) onSearchSubmit();
    navigate('/search');
  };

  const clearDestination = (e) => {
    e.stopPropagation();
    setDestination('');
  };

  if (isCompact) {
    return (
      <div
        onClick={() => {
          setActiveTab('where');
          setShowDestPopup(true);
        }}
        className="flex items-center justify-between border border-borderLight rounded-full py-2 px-4 shadow-sm hover:shadow-md transition cursor-pointer text-sm font-medium bg-white divide-x divide-gray-200"
      >
        <span className="px-3 font-semibold text-dark truncate max-w-[120px]">
          {destination || 'Anywhere'}
        </span>
        <span className="px-3 text-secondary truncate max-w-[110px]">
          {checkIn ? `${checkIn} - ${checkOut || 'Dates'}` : 'Any week'}
        </span>
        <div className="pl-3 flex items-center gap-3">
          <span className="text-secondary truncate max-w-[100px]">
            {totalGuests > 1 ? `${totalGuests} guests` : 'Add guests'}
          </span>
          <div className="bg-airbnb p-2 rounded-full text-white shadow-sm flex items-center justify-center">
            <Search className="w-3.5 h-3.5 stroke-[2.5]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-4xl mx-auto">
      <div
        className={`flex flex-col md:flex-row items-center bg-white rounded-3xl md:rounded-full border shadow-search transition-all duration-200 ${
          activeTab ? 'bg-[#f7f7f7] border-gray-300' : 'border-borderLight hover:border-gray-300'
        }`}
      >
        {/* Destination Section */}
        <div
          onClick={() => {
            setActiveTab('where');
            setShowDestPopup(true);
            setShowGuestPopup(false);
          }}
          className={`w-full md:w-1/3 py-3.5 px-6 rounded-full cursor-pointer transition text-left relative ${
            activeTab === 'where' ? 'bg-white shadow-lg z-20 ring-1 ring-black/5' : 'hover:bg-gray-100/60'
          }`}
        >
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-dark">
            Where
          </label>
          <div className="flex items-center justify-between">
            <input
              type="text"
              placeholder="Search destinations"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch(e)}
              className="w-full bg-transparent text-sm text-dark placeholder:text-secondary focus:outline-none font-medium truncate"
            />
            {destination && (
              <button
                onClick={clearDestination}
                className="p-1 hover:bg-gray-200 rounded-full text-gray-500 hover:text-dark transition"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Check-In Section */}
        <div
          onClick={() => {
            setActiveTab('checkin');
            setShowDestPopup(false);
            setShowGuestPopup(false);
          }}
          className={`w-full md:w-1/5 py-3.5 px-6 rounded-full cursor-pointer transition text-left border-t md:border-t-0 md:border-l border-gray-200 ${
            activeTab === 'checkin' ? 'bg-white shadow-lg z-20 ring-1 ring-black/5' : 'hover:bg-gray-100/60'
          }`}
        >
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-dark">
            Check in
          </label>
          <input
            type="text"
            placeholder="Add dates"
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            className="w-full bg-transparent text-sm text-dark placeholder:text-secondary focus:outline-none font-medium truncate cursor-pointer"
          />
        </div>

        {/* Check-Out Section */}
        <div
          onClick={() => {
            setActiveTab('checkout');
            setShowDestPopup(false);
            setShowGuestPopup(false);
          }}
          className={`w-full md:w-1/5 py-3.5 px-6 rounded-full cursor-pointer transition text-left border-t md:border-t-0 md:border-l border-gray-200 ${
            activeTab === 'checkout' ? 'bg-white shadow-lg z-20 ring-1 ring-black/5' : 'hover:bg-gray-100/60'
          }`}
        >
          <label className="block text-[11px] font-extrabold uppercase tracking-wider text-dark">
            Check out
          </label>
          <input
            type="text"
            placeholder="Add dates"
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            className="w-full bg-transparent text-sm text-dark placeholder:text-secondary focus:outline-none font-medium truncate cursor-pointer"
          />
        </div>

        {/* Who / Guests Section + Search Button */}
        <div
          onClick={() => {
            setActiveTab('who');
            setShowGuestPopup(true);
            setShowDestPopup(false);
          }}
          className={`w-full md:w-1/3 py-2 px-6 rounded-full cursor-pointer transition text-left flex items-center justify-between border-t md:border-t-0 md:border-l border-gray-200 relative ${
            activeTab === 'who' ? 'bg-white shadow-lg z-20 ring-1 ring-black/5' : 'hover:bg-gray-100/60'
          }`}
        >
          <div className="flex-1 pr-2">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-dark">
              Who
            </label>
            <span className="text-sm font-medium text-dark truncate block">
              {totalGuests > 1
                ? `${totalGuests} guests${guests.infants ? `, ${guests.infants} infant` : ''}`
                : totalGuests === 1
                ? '1 guest'
                : 'Add guests'}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSearch}
            className="bg-airbnb hover:bg-airbnb-hover text-white px-5 py-3 rounded-full font-semibold flex items-center gap-2 shadow-md transition transform active:scale-95 shrink-0"
          >
            <Search className="w-4 h-4 stroke-[2.5]" />
            <span className="hidden lg:inline text-sm">Search</span>
          </button>
        </div>
      </div>

      {/* Destination Dropdown Popup */}
      {showDestPopup && (
        <div className="absolute top-full left-0 mt-3 w-full md:w-96 bg-white rounded-3xl p-6 shadow-modal border border-borderLight z-50 animate-fade-in">
          <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
            Search by region
          </p>
          <div className="grid grid-cols-2 gap-2">
            {quickDestinations.map((item, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setDestination(item.query);
                  setShowDestPopup(false);
                  setActiveTab('checkin');
                }}
                className={`flex items-center gap-3 p-3 rounded-2xl border text-left text-sm transition hover:border-dark hover:bg-gray-50 ${
                  destination.toLowerCase() === item.query.toLowerCase()
                    ? 'border-dark bg-gray-50 font-semibold'
                    : 'border-borderLight text-dark'
                }`}
              >
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-dark">
                  <MapPin className="w-4 h-4 text-airbnb" />
                </div>
                <span className="truncate">{item.name}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Guest Dropdown Popup */}
      {showGuestPopup && (
        <div className="absolute top-full right-0 mt-3 w-full md:w-96 bg-white rounded-3xl p-6 shadow-modal border border-borderLight z-50 animate-fade-in divide-y divide-gray-100">
          {/* Adults */}
          <div className="flex items-center justify-between pb-4">
            <div>
              <p className="text-sm font-semibold text-dark">Adults</p>
              <p className="text-xs text-secondary">Ages 13 or above</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={guests.adults <= 1}
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('adults', -1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark disabled:opacity-30 disabled:hover:border-gray-300 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-semibold text-sm text-dark">
                {guests.adults}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('adults', 1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Children */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold text-dark">Children</p>
              <p className="text-xs text-secondary">Ages 2–12</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={guests.children <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('children', -1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark disabled:opacity-30 disabled:hover:border-gray-300 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-semibold text-sm text-dark">
                {guests.children}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('children', 1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Infants */}
          <div className="flex items-center justify-between py-4">
            <div>
              <p className="text-sm font-semibold text-dark">Infants</p>
              <p className="text-xs text-secondary">Under 2</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={guests.infants <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('infants', -1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark disabled:opacity-30 disabled:hover:border-gray-300 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-semibold text-sm text-dark">
                {guests.infants}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('infants', 1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Pets */}
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="text-sm font-semibold text-dark">Pets</p>
              <p className="text-xs text-secondary">Bringing a service animal?</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                disabled={guests.pets <= 0}
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('pets', -1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark disabled:opacity-30 disabled:hover:border-gray-300 transition"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-5 text-center font-semibold text-sm text-dark">
                {guests.pets}
              </span>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  updateGuests('pets', 1);
                }}
                className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-600 hover:border-dark transition"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
