import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Globe,
  Menu,
  User,
  Heart,
  Briefcase,
  LogOut,
  LogIn,
  UserPlus,
  HelpCircle,
  Home,
  X,
  Check,
  Shield,
  Building2,
  Scale,
} from 'lucide-react';
import { SearchBar } from './SearchBar';
import { useWishlist } from '../../context/WishlistContext';
import { useCompare } from '../../context/CompareContext';
import { useAuth } from '../../context/AuthContext';
import { useSearch } from '../../context/SearchContext';
import { useToast } from '../../context/ToastContext';

export const Navbar = ({ forceCompact = false }) => {
  const { wishlistCount } = useWishlist();
  const { compareCount } = useCompare();
  const { user, isAuthenticated, switchUserMode, isHostSessionUnlocked, logout } = useAuth();
  const { searchOpen, setSearchOpen } = useSearch();
  const { showToast } = useToast();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [langModalOpen, setLangModalOpen] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState('USD ($)');
  const [selectedLanguage, setSelectedLanguage] = useState('English (US)');

  const location = useLocation();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const isHomePage = location.pathname === '/';
  const showFullSearch = isHomePage && searchOpen && !forceCompact;

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currencies = ['USD ($)', 'EUR (€)', 'GBP (£)', 'CAD ($)', 'AUD ($)', 'JPY (¥)'];
  const languages = ['English (US)', 'English (UK)', 'Español', 'Français', 'Deutsch', '日本語'];

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-borderLight transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">
          {/* Logo */}
          <Link
            to="/"
            onClick={() => setSearchOpen(false)}
            className="flex items-center gap-2 text-airbnb hover:opacity-90 transition shrink-0"
          >
            <svg
              className="w-8 h-8 fill-current text-airbnb"
              viewBox="0 0 32 32"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M16 1c2.008 0 3.463.963 4.751 3.269l.533 1.025c1.954 3.83 6.114 12.315 7.1 14.544 1.767 4.001.378 8.653-3.13 10.518-1.523.809-3.237 1.077-4.939.771-1.821-.328-3.414-1.39-4.315-2.885-1.077 1.789-3.036 2.977-5.187 2.87-1.884-.093-3.665-.968-4.78-2.348-1.865-2.308-2.001-5.612-.34-8.083.743-1.107 1.942-2.318 3.511-3.619.645-.534 1.341-1.09 2.079-1.666l.72-.562c1.905-1.488 3.242-2.656 4.008-3.504.606-.671.989-1.332 1.148-1.981C17.275 8.441 16.745 7 16 7c-.745 0-1.275 1.441-1.06 2.348.159.649.542 1.31 1.148 1.981.766.848 2.103 2.016 4.008 3.504l.72.562c.738.576 1.434 1.132 2.079 1.666 1.569 1.301 2.768 2.512 3.511 3.619 1.661 2.471 1.525 5.775-.34 8.083-1.115 1.38-2.896 2.255-4.78 2.348-2.151.107-4.11-.081-5.187-1.87-.901 1.495-2.494 2.557-4.315 2.885-1.702.306-3.416.038-4.939-.771C4.819 28.491 3.43 23.839 5.197 19.838c.986-2.229 5.146-10.714 7.1-14.544l.533-1.025C14.118 1.963 15.573 1 17.581 1H16z" />
            </svg>
            <span className="font-extrabold text-xl tracking-tight hidden sm:inline text-airbnb">
              AbodeX
            </span>
          </Link>

          {/* Center Search Pill (Desktop/Tablet) */}
          <div className="hidden md:flex flex-1 max-w-md justify-center">
            <div
              onClick={() => setSearchOpen(true)}
              className="w-full flex justify-center cursor-pointer"
            >
              <SearchBar isCompact={true} onSearchSubmit={() => setSearchOpen(false)} />
            </div>
          </div>

          {/* Right Navigation controls */}
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              to="/compare"
              className="hidden sm:flex items-center gap-1.5 text-xs md:text-sm font-semibold text-dark hover:bg-gray-100 py-2 px-3 rounded-full transition"
            >
              <Scale className="w-4 h-4 text-airbnb" />
              <span>Compare</span>
              {compareCount > 0 && (
                <span className="bg-airbnb text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {compareCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => navigate('/host')}
              className="hidden lg:block text-xs md:text-sm font-semibold text-dark hover:bg-gray-100 py-2.5 px-3.5 rounded-full transition cursor-pointer"
            >
              AbodeX your home
            </button>

            {/* Language / Currency Button */}
            <button
              onClick={() => setLangModalOpen(true)}
              className="p-2.5 text-dark hover:bg-gray-100 rounded-full transition flex items-center justify-center"
              aria-label="Language & Currency"
            >
              <Globe className="w-4 h-4 text-dark" />
            </button>

            {/* User Dropdown Pill */}
            <div ref={menuRef} className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="flex items-center gap-3 border border-borderLight hover:shadow-md p-1.5 pl-3 rounded-full transition cursor-pointer bg-white"
              >
                <Menu className="w-4 h-4 text-dark" />
                <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gray-200 border border-gray-100 flex items-center justify-center">
                  {isAuthenticated && user?.avatar ? (
                    <img
                      src={user.avatar}
                      alt={user.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-gray-500" />
                  )}
                  {wishlistCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-airbnb text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                      {wishlistCount}
                    </span>
                  )}
                </div>
              </button>

              {/* User Menu Dropdown */}
              {userMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-modal border border-borderLight py-2 z-50 animate-fade-in divide-y divide-gray-100 text-sm">
                  {isAuthenticated ? (
                    <>
                      <div className="px-4 py-3 bg-gray-50/70 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-semibold text-dark truncate">{user?.name || 'Guest'}</p>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase ${
                              user?.role === 'ADMIN'
                                ? 'bg-purple-100 text-purple-800'
                                : user?.role === 'HOST'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {user?.role || 'GUEST'}
                          </span>
                        </div>
                        <p className="text-xs text-secondary truncate">{user?.email || ''}</p>

                        {/* Combined Guest <-> Host Mode Toggle (No user can self-switch to Admin) */}
                        {user?.role !== 'ADMIN' && (
                          <div className="pt-1">
                            <span className="block text-[10px] font-bold uppercase text-secondary mb-1">
                              Account Mode {isHostSessionUnlocked() ? '· Host Unlocked' : ''}
                            </span>
                            <div className="grid grid-cols-2 gap-1.5">
                              <button
                                type="button"
                                onClick={async () => {
                                  if ((user?.role || 'GUEST') !== 'GUEST') {
                                    await switchUserMode('GUEST');
                                    showToast('Switched to Guest mode (no password needed)', 'info');
                                  }
                                  setUserMenuOpen(false);
                                }}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  (user?.role || 'GUEST') === 'GUEST'
                                    ? 'bg-dark text-white'
                                    : 'bg-white border border-gray-200 text-secondary hover:text-dark'
                                }`}
                              >
                                Guest Mode
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  setUserMenuOpen(false);
                                  if (user?.role !== 'HOST') {
                                    const switched = await switchUserMode('HOST', () => {
                                      showToast('Host mode unlocked for this session!', 'success');
                                      navigate('/host');
                                    });
                                    if (switched) {
                                      showToast('Switched to Host mode!', 'success');
                                      navigate('/host');
                                    }
                                  } else {
                                    navigate('/host');
                                  }
                                }}
                                className={`py-1.5 px-2 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                                  user?.role === 'HOST'
                                    ? 'bg-amber-600 text-white'
                                    : 'bg-white border border-gray-200 text-secondary hover:text-dark'
                                }`}
                              >
                                Host Mode {isHostSessionUnlocked() ? '✓' : '🔒'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          to="/profile"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <User className="w-4 h-4 text-secondary" />
                          Profile & Support Issues
                        </Link>
                        <Link
                          to="/wishlists"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center justify-between px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <div className="flex items-center gap-3">
                            <Heart className="w-4 h-4 text-secondary" />
                            Wishlists
                          </div>
                          {wishlistCount > 0 && (
                            <span className="bg-airbnb/10 text-airbnb font-bold text-xs px-2 py-0.5 rounded-full">
                              {wishlistCount}
                            </span>
                          )}
                        </Link>
                        <Link
                          to="/profile?tab=trips"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <Briefcase className="w-4 h-4 text-secondary" />
                          Trips & Bookings
                        </Link>
                      </div>
                      <div className="py-1">
                        <button
                          type="button"
                          onClick={async () => {
                            setUserMenuOpen(false);
                            if (user?.role === 'HOST' || user?.role === 'ADMIN') {
                              navigate('/host');
                            } else {
                              const switched = await switchUserMode('HOST', () => {
                                showToast('Host mode unlocked!', 'success');
                                navigate('/host');
                              });
                              if (switched) navigate('/host');
                            }
                          }}
                          className="w-full flex items-center justify-between px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition text-left cursor-pointer"
                        >
                          <div className="flex items-center gap-3">
                            <Building2 className="w-4 h-4 text-airbnb" />
                            <span>Host Listings Console</span>
                          </div>
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                            {user?.role === 'HOST' || isHostSessionUnlocked() ? 'UNLOCKED' : 'KEY REQ'}
                          </span>
                        </button>

                        {user?.role === 'ADMIN' && (
                          <Link
                            to="/admin"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center justify-between px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                          >
                            <div className="flex items-center gap-3">
                              <Shield className="w-4 h-4 text-purple-600" />
                              <span>Admin Authority Console</span>
                            </div>
                            <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                              ADMIN
                            </span>
                          </Link>
                        )}
                      </div>
                      <div className="py-1">
                        <Link
                          to="/search"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <Home className="w-4 h-4 text-secondary" />
                          Explore all homes
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setUserMenuOpen(false);
                          }}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-red-600 hover:bg-red-50 font-medium transition text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          Log out
                        </button>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="py-1">
                        <Link
                          to="/login"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark font-semibold hover:bg-gray-100 transition"
                        >
                          <LogIn className="w-4 h-4 text-secondary" />
                          Log in
                        </Link>
                        <Link
                          to="/register"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 transition font-medium"
                        >
                          <UserPlus className="w-4 h-4 text-secondary" />
                          Sign up
                        </Link>
                      </div>
                      <div className="py-1">
                        <Link
                          to="/wishlists"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <Heart className="w-4 h-4 text-secondary" />
                          Wishlists
                        </Link>
                        <Link
                          to="/search"
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-dark hover:bg-gray-100 font-medium transition"
                        >
                          <HelpCircle className="w-4 h-4 text-secondary" />
                          Help Center
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Expandable full search bar for hero state */}
        {showFullSearch && (
          <div className="pb-6 pt-2 animate-fade-in">
            <SearchBar onSearchSubmit={() => setSearchOpen(false)} />
          </div>
        )}
      </div>

      {/* Language / Currency Modal */}
      {langModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 shadow-modal border border-borderLight relative">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100">
              <h3 className="text-lg font-bold text-dark">Language and Currency</h3>
              <button
                onClick={() => setLangModalOpen(false)}
                className="p-1 rounded-full hover:bg-gray-100 text-gray-500 hover:text-dark transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-6">
              <div>
                <h4 className="text-sm font-bold text-dark mb-3">Choose a language</h4>
                <div className="grid grid-cols-2 gap-2">
                  {languages.map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setSelectedLanguage(lang)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition ${
                        selectedLanguage === lang
                          ? 'border-dark bg-gray-50 text-dark'
                          : 'border-borderLight hover:border-gray-400 text-secondary'
                      }`}
                    >
                      <span>{lang}</span>
                      {selectedLanguage === lang && <Check className="w-4 h-4 text-dark" />}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-dark mb-3">Choose a currency</h4>
                <div className="grid grid-cols-2 gap-2">
                  {currencies.map((curr) => (
                    <button
                      key={curr}
                      onClick={() => setSelectedCurrency(curr)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-sm font-medium transition ${
                        selectedCurrency === curr
                          ? 'border-dark bg-gray-50 text-dark'
                          : 'border-borderLight hover:border-gray-400 text-secondary'
                      }`}
                    >
                      <span>{curr}</span>
                      {selectedCurrency === curr && <Check className="w-4 h-4 text-dark" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setLangModalOpen(false)}
                className="px-6 py-2.5 bg-dark hover:bg-black text-white font-semibold rounded-xl text-sm transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
