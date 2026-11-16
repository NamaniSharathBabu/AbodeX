import React from 'react';
import { Link } from 'react-router-dom';
import { properties } from '../data/properties';
import { PropertyCard } from '../components/property/PropertyCard';
import { useWishlist } from '../context/WishlistContext';
import { useSearch } from '../context/SearchContext';
import { Heart, Compass, Trash2 } from 'lucide-react';
import { useToast } from '../context/ToastContext';

export const WishlistPage = () => {
  const { wishlist, clearWishlist } = useWishlist();
  const { allProperties } = useSearch();
  const { showToast } = useToast();

  const wishlistedProperties = allProperties.filter((p) => wishlist.includes(p.id));

  const handleClear = () => {
    clearWishlist();
    showToast('Wishlist cleared', 'info');
  };

  return (
    <div className="bg-white min-h-[calc(100vh-200px)] py-10">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-6 border-b border-gray-100">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-dark tracking-tight">
              Wishlists
            </h1>
            <p className="text-sm text-secondary mt-1">
              {wishlistedProperties.length} {wishlistedProperties.length === 1 ? 'saved property' : 'saved properties'}
            </p>
          </div>

          {wishlistedProperties.length > 0 && (
            <button
              onClick={handleClear}
              className="flex items-center gap-2 text-xs font-semibold text-secondary hover:text-red-600 transition p-2 rounded-xl hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear all</span>
            </button>
          )}
        </div>

        {/* Wishlist Grid or Empty State */}
        {wishlistedProperties.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {wishlistedProperties.map((property) => (
              <PropertyCard key={property.id} property={property} />
            ))}
          </div>
        ) : (
          <div className="py-24 text-center max-w-md mx-auto space-y-5">
            <div className="w-20 h-20 bg-airbnb/10 text-airbnb rounded-full flex items-center justify-center mx-auto animate-pulse">
              <Heart className="w-10 h-10 fill-airbnb text-airbnb" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl sm:text-2xl font-bold text-dark">
                Your wishlist is empty
              </h2>
              <p className="text-sm text-secondary leading-relaxed">
                As you search, tap the heart icon on properties you love to save your favorite stays and compare them here.
              </p>
            </div>
            <div className="pt-2">
              <Link
                to="/"
                className="inline-flex items-center gap-2 px-8 py-3.5 bg-dark hover:bg-black text-white font-bold rounded-2xl text-sm shadow-md transition transform active:scale-95"
              >
                <Compass className="w-4 h-4" />
                <span>Start exploring</span>
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
