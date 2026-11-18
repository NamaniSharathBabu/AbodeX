import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/common/Navbar';
import { Footer } from './components/common/Footer';
import { MobileNav } from './components/common/MobileNav';
import { HomePage } from './pages/HomePage';
import { SearchResultsPage } from './pages/SearchResultsPage';
import { PropertyDetailsPage } from './pages/PropertyDetailsPage';
import { WishlistPage } from './pages/WishlistPage';
import { ProfilePage } from './pages/ProfilePage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { HostDashboardPage } from './pages/HostDashboardPage';
import { AdminDashboardPage } from './pages/AdminDashboardPage';
import { ComparePage } from './pages/ComparePage';
import { MessagesPage } from './pages/MessagesPage';
import { NotFoundPage } from './pages/NotFoundPage';

export function App() {
  return (
    <div className="min-h-screen flex flex-col bg-white text-dark pb-16 md:pb-0 selection:bg-airbnb selection:text-white">
      {/* Top Header Navbar */}
      <Navbar />

      {/* Main Routed Page Content */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/search" element={<SearchResultsPage />} />
          <Route path="/rooms/:id" element={<PropertyDetailsPage />} />
          <Route path="/property/:id" element={<PropertyDetailsPage />} />
          <Route path="/wishlists" element={<WishlistPage />} />
          <Route path="/wishlist" element={<WishlistPage />} />
          <Route path="/compare" element={<ComparePage />} />
          <Route path="/messages" element={<MessagesPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/host" element={<HostDashboardPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </div>

      {/* Footer */}
      <Footer />

      {/* Mobile Bottom Navigation */}
      <MobileNav />
    </div>
  );
}

export default App;
