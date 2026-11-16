import React, { createContext, useContext, useState } from 'react';
import { mockUser } from '../data/mockUser';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(mockUser);
  const [isAuthenticated, setIsAuthenticated] = useState(true);

  const login = (email, password) => {
    setIsAuthenticated(true);
    setUser((prev) => ({
      ...prev,
      email: email || prev.email,
    }));
    return true;
  };

  const register = ({ name, email }) => {
    setIsAuthenticated(true);
    setUser((prev) => ({
      ...prev,
      name: name || 'New Explorer',
      email: email || prev.email,
    }));
    return true;
  };

  const logout = () => {
    setIsAuthenticated(false);
  };

  const updateProfile = (updatedFields) => {
    setUser((prev) => ({
      ...prev,
      ...updatedFields,
    }));
  };

  const addReservation = (reservation) => {
    setUser((prev) => ({
      ...prev,
      upcomingTrips: [reservation, ...(prev.upcomingTrips || [])],
      stats: {
        ...prev.stats,
        tripsCount: (prev.stats?.tripsCount || 0) + 1,
      },
    }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        login,
        register,
        logout,
        updateProfile,
        addReservation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
