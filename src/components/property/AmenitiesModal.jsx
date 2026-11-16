import React from 'react';
import {
  X,
  Wifi,
  Waves,
  Flame,
  Utensils,
  Car,
  Wind,
  Zap,
  Laptop,
  Tv,
  Coffee,
  Sparkles,
  ShieldCheck,
  Palmtree,
  Trees,
} from 'lucide-react';

export const AmenitiesModal = ({ isOpen, onClose, amenities = [] }) => {
  if (!isOpen) return null;

  const amenityIconMap = {
    wifi: Wifi,
    pool: Waves,
    hot: Flame,
    kitchen: Utensils,
    parking: Car,
    conditioning: Wind,
    ev: Zap,
    workspace: Laptop,
    tv: Tv,
    coffee: Coffee,
    sauna: Sparkles,
    beach: Palmtree,
    forest: Trees,
  };

  const getIconForAmenity = (name) => {
    const lower = name.toLowerCase();
    for (const [key, IconComp] of Object.entries(amenityIconMap)) {
      if (lower.includes(key)) {
        return IconComp;
      }
    }
    return Sparkles;
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[85vh] flex flex-col shadow-modal border border-borderLight overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="text-base font-bold text-dark">What this place offers</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500 hover:text-dark transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Amenity list */}
        <div className="p-6 overflow-y-auto divide-y divide-gray-100 space-y-4">
          <div className="space-y-4">
            <h4 className="font-bold text-dark text-sm uppercase tracking-wider text-secondary">
              Included Amenities ({amenities.length})
            </h4>
            <div className="grid grid-cols-1 gap-4">
              {amenities.map((item, idx) => {
                const IconComp = getIconForAmenity(item);
                return (
                  <div key={idx} className="flex items-center gap-4 py-2">
                    <div className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center text-dark shrink-0">
                      <IconComp className="w-4 h-4 text-dark" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-dark">{item}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-100 bg-white flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 bg-dark hover:bg-black text-white font-semibold rounded-xl text-sm transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
