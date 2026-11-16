import React from 'react';
import { Globe, Heart, Shield, DollarSign } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Footer = () => {
  return (
    <footer className="bg-bgLight border-t border-borderLight mt-auto text-dark text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-8 border-b border-borderLight">
          {/* Support */}
          <div>
            <h4 className="font-bold text-dark text-sm mb-4">Support</h4>
            <ul className="space-y-3 text-secondary">
              <li><Link to="/" className="hover:underline">Help Center</Link></li>
              <li><Link to="/" className="hover:underline">AirCover protection</Link></li>
              <li><Link to="/" className="hover:underline">Anti-discrimination</Link></li>
              <li><Link to="/" className="hover:underline">Disability support</Link></li>
              <li><Link to="/" className="hover:underline">Cancellation options</Link></li>
            </ul>
          </div>

          {/* Hosting */}
          <div>
            <h4 className="font-bold text-dark text-sm mb-4">Hosting</h4>
            <ul className="space-y-3 text-secondary">
              <li><Link to="/profile" className="hover:underline">AbodeX your home</Link></li>
              <li><Link to="/" className="hover:underline">AirCover for Hosts</Link></li>
              <li><Link to="/" className="hover:underline">Hosting resources</Link></li>
              <li><Link to="/" className="hover:underline">Community forum</Link></li>
              <li><Link to="/" className="hover:underline">Hosting responsibly</Link></li>
            </ul>
          </div>

          {/* AbodeX */}
          <div>
            <h4 className="font-bold text-dark text-sm mb-4">AbodeX</h4>
            <ul className="space-y-3 text-secondary">
              <li><Link to="/" className="hover:underline">Newsroom</Link></li>
              <li><Link to="/" className="hover:underline">New features</Link></li>
              <li><Link to="/" className="hover:underline">Careers</Link></li>
              <li><Link to="/" className="hover:underline">Investors</Link></li>
              <li><Link to="/" className="hover:underline">Gift cards</Link></li>
            </ul>
          </div>

          {/* About / Tech */}
          <div>
            <h4 className="font-bold text-dark text-sm mb-4">Stay Inspired</h4>
            <p className="text-secondary mb-4 leading-relaxed">
              Discover dream stays around the world with our curated vacation rental collection.
            </p>
            <div className="p-4 bg-white rounded-2xl border border-borderLight shadow-xs space-y-2">
              <div className="flex items-center gap-2 font-semibold text-dark">
                <Shield className="w-4 h-4 text-airbnb" />
                <span>AbodeX Guest Guarantee</span>
              </div>
              <p className="text-[11px] text-secondary">
                100% verified listings, premium host standards & 24/7 guest support.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-secondary">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
            <span>© {new Date().getFullYear()} AbodeX, Inc.</span>
            <span>·</span>
            <Link to="/" className="hover:underline">Privacy</Link>
            <span>·</span>
            <Link to="/" className="hover:underline">Terms</Link>
            <span>·</span>
            <Link to="/" className="hover:underline">Sitemap</Link>
            <span>·</span>
            <Link to="/" className="hover:underline">Company details</Link>
          </div>

          <div className="flex items-center gap-6 font-semibold text-dark">
            <div className="flex items-center gap-2 cursor-pointer hover:underline">
              <Globe className="w-4 h-4" />
              <span>English (US)</span>
            </div>
            <div className="flex items-center gap-1 cursor-pointer hover:underline">
              <span>$ USD</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
