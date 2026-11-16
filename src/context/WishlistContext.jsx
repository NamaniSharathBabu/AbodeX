import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const API_BASE = 'http://localhost:5000';
const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loadingWishlist, setLoadingWishlist] = useState(true);

  // Always fetch directly from PostgreSQL (Single Source of Truth)
  const fetchWishlistFromDb = useCallback(async () => {
    try {
      setLoadingWishlist(true);
      const token = localStorage.getItem('abodeX_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.get(`${API_BASE}/api/wishlist`, { headers });
      if (Array.isArray(res.data?.wishlistIds)) {
        setWishlist(res.data.wishlistIds);
      }
    } catch (e) {
      console.error('Failed to load wishlist from PostgreSQL:', e);
    } finally {
      setLoadingWishlist(false);
    }
  }, []);

  useEffect(() => {
    // Clean up any old localStorage cache so DB is always authoritative
    localStorage.removeItem('abodeX_wishlist');
    fetchWishlistFromDb();

    // Also re-fetch when user switches back to the browser tab (e.g. after editing in Prisma Studio)
    const handleFocus = () => fetchWishlistFromDb();
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchWishlistFromDb]);

  const toggleWishlist = async (propertyId) => {
    // Optimistic UI update while DB request completes
    setWishlist((prev) => {
      const exists = prev.includes(propertyId);
      return exists ? prev.filter((id) => id !== propertyId) : [...prev, propertyId];
    });

    try {
      const token = localStorage.getItem('abodeX_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.post(
        `${API_BASE}/api/wishlist/toggle`,
        { propertyId },
        { headers }
      );
      if (Array.isArray(res.data?.wishlistIds)) {
        setWishlist(res.data.wishlistIds);
      }
    } catch (e) {
      console.error('Failed to toggle wishlist in PostgreSQL:', e);
      fetchWishlistFromDb();
    }
  };

  const isWishlisted = (propertyId) => wishlist.includes(propertyId);

  const clearWishlist = async () => {
    setWishlist([]);
    try {
      const token = localStorage.getItem('abodeX_token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const res = await axios.delete(`${API_BASE}/api/wishlist`, { headers });
      if (Array.isArray(res.data?.wishlistIds)) {
        setWishlist(res.data.wishlistIds);
      }
    } catch (e) {
      console.error('Failed to clear wishlist in PostgreSQL:', e);
      fetchWishlistFromDb();
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loadingWishlist,
        refreshWishlist: fetchWishlistFromDb,
        toggleWishlist,
        isWishlisted,
        clearWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error('useWishlist must be used within a WishlistProvider');
  }
  return context;
};
