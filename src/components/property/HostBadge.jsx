import React from 'react';
import { Award, ShieldCheck, Clock, MessageSquare } from 'lucide-react';

export const HostBadge = ({ host }) => {
  if (!host) return null;

  return (
    <div className="border border-borderLight rounded-3xl p-6 bg-gray-50/50 space-y-6">
      <div className="flex items-center gap-4">
        <div className="relative">
          <img
            src={host.avatar}
            alt={host.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-sm"
          />
          {host.superhost && (
            <div className="absolute -bottom-1 -right-1 bg-airbnb text-white p-1 rounded-full shadow-xs">
              <Award className="w-3.5 h-3.5" />
            </div>
          )}
        </div>

        <div>
          <h4 className="text-lg font-bold text-dark flex items-center gap-1.5">
            Hosted by {host.name}
          </h4>
          <p className="text-xs text-secondary">{host.joinedDate}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 py-2 border-y border-gray-200/80 text-xs">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-airbnb" />
          <div>
            <span className="text-secondary block">Response time</span>
            <span className="font-semibold text-dark">{host.responseTime || 'Within an hour'}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-airbnb" />
          <div>
            <span className="text-secondary block">Response rate</span>
            <span className="font-semibold text-dark">{host.responseRate || '100%'}</span>
          </div>
        </div>
      </div>

      <p className="text-xs sm:text-sm text-secondary leading-relaxed">
        {host.bio}
      </p>

      <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-dark">
        <ShieldCheck className="w-4 h-4 text-airbnb" />
        <span>Identity & Host standards verified</span>
      </div>
    </div>
  );
};
