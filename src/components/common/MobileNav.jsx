import React from 'react';
import { NavLink } from 'react-router-dom';
import { Compass, Heart, Search, User, Briefcase } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useAuth } from '../../context/AuthContext';

export const MobileNav = () => {
  const { wishlistCount } = useWishlist();
  const { isAuthenticated } = useAuth();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-borderLight py-2 px-6 flex items-center justify-around shadow-lg">
      <NavLink
        to="/"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? 'text-airbnb font-bold' : 'text-secondary hover:text-dark'
          }`
        }
      >
        <Compass className="w-5 h-5" />
        <span>Explore</span>
      </NavLink>

      <NavLink
        to="/search"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? 'text-airbnb font-bold' : 'text-secondary hover:text-dark'
          }`
        }
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </NavLink>

      <NavLink
        to="/wishlists"
        className={({ isActive }) =>
          `relative flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? 'text-airbnb font-bold' : 'text-secondary hover:text-dark'
          }`
        }
      >
        <div className="relative">
          <Heart className="w-5 h-5" />
          {wishlistCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-airbnb text-white text-[9px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold">
              {wishlistCount}
            </span>
          )}
        </div>
        <span>Wishlists</span>
      </NavLink>

      <NavLink
        to="/profile?tab=trips"
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? 'text-airbnb font-bold' : 'text-secondary hover:text-dark'
          }`
        }
      >
        <Briefcase className="w-5 h-5" />
        <span>Trips</span>
      </NavLink>

      <NavLink
        to={isAuthenticated ? '/profile' : '/login'}
        className={({ isActive }) =>
          `flex flex-col items-center gap-1 text-[10px] font-medium transition ${
            isActive ? 'text-airbnb font-bold' : 'text-secondary hover:text-dark'
          }`
        }
      >
        <User className="w-5 h-5" />
        <span>{isAuthenticated ? 'Profile' : 'Log in'}</span>
      </NavLink>
    </nav>
  );
};
