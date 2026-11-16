import React from 'react';
import { Link } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-[calc(100vh-200px)] flex flex-col items-center justify-center p-6 text-center bg-white space-y-6">
      <div className="text-8xl font-black text-gray-200">404</div>
      <div className="space-y-2 max-w-md">
        <h1 className="text-2xl sm:text-3xl font-extrabold text-dark">
          We can't seem to find the page you're looking for.
        </h1>
        <p className="text-sm text-secondary">
          Here are some helpful links instead to get you back to discovering great places:
        </p>
      </div>

      <div className="flex flex-wrap gap-4 justify-center pt-2">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-dark hover:bg-black text-white font-bold rounded-2xl text-sm transition shadow-sm"
        >
          <Home className="w-4 h-4" />
          <span>Home</span>
        </Link>
        <Link
          to="/search"
          className="inline-flex items-center gap-2 px-6 py-3 border border-borderLight hover:border-dark text-dark font-bold rounded-2xl text-sm transition bg-white"
        >
          <span>Search Stays</span>
        </Link>
      </div>
    </div>
  );
};
