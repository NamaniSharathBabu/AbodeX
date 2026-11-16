import React, { useRef, useState, useEffect } from 'react';
import {
  Sparkles,
  Palmtree,
  Trees,
  Waves,
  Castle,
  Home,
  Compass,
  Building2,
  Wheat,
  MountainSnow,
  Sun,
  TentTree,
  Flame,
  Crown,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { categories } from '../../data/categories';
import { useSearch } from '../../context/SearchContext';
import { FilterModal } from './FilterModal';

// Mapping icon string names to Lucide icon components
const iconMap = {
  Sparkles,
  Palmtree,
  Trees,
  Waves,
  Castle,
  Home,
  Compass,
  Building2,
  Wheat,
  MountainSnow,
  Sun,
  TentTree,
  Flame,
  Crown,
};

export const FilterBar = () => {
  const { selectedCategory, setSelectedCategory, selectedAmenities, priceRange } = useSearch();
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [showLeftArrow, setShowLeftArrow] = useState(false);
  const [showRightArrow, setShowRightArrow] = useState(true);
  const scrollRef = useRef(null);

  const activeFiltersCount =
    (selectedAmenities.length > 0 ? 1 : 0) +
    (priceRange[0] > 50 || priceRange[1] < 1000 ? 1 : 0);

  const handleScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setShowLeftArrow(scrollLeft > 20);
      setShowRightArrow(scrollLeft < scrollWidth - clientWidth - 20);
    }
  };

  useEffect(() => {
    handleScroll();
    window.addEventListener('resize', handleScroll);
    return () => window.removeEventListener('resize', handleScroll);
  }, []);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <div className="sticky top-20 z-30 bg-white/95 backdrop-blur-md border-b border-borderLight shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center gap-4">
        {/* Scrollable Categories Container */}
        <div className="relative flex-1 overflow-hidden">
          {/* Left arrow */}
          {showLeftArrow && (
            <button
              onClick={() => scroll('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-borderLight rounded-full flex items-center justify-center shadow-md hover:scale-105 transition"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-4 h-4 text-dark" />
            </button>
          )}

          {/* Categories List */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex items-center gap-8 overflow-x-auto no-scrollbar scroll-smooth py-2 px-1"
          >
            {categories.map((cat) => {
              const IconComponent = iconMap[cat.icon] || Sparkles;
              const isSelected = selectedCategory === cat.id;

              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex flex-col items-center gap-2 pb-2 border-b-2 transition group shrink-0 ${
                    isSelected
                      ? 'border-dark text-dark font-bold'
                      : 'border-transparent text-secondary hover:text-dark hover:border-gray-300'
                  }`}
                >
                  <IconComponent
                    className={`w-6 h-6 transition transform group-hover:scale-110 ${
                      isSelected ? 'text-dark' : 'text-secondary group-hover:text-dark'
                    }`}
                  />
                  <span className="text-xs tracking-tight whitespace-nowrap">{cat.label}</span>
                </button>
              );
            })}
          </div>

          {/* Right arrow */}
          {showRightArrow && (
            <button
              onClick={() => scroll('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-white border border-borderLight rounded-full flex items-center justify-center shadow-md hover:scale-105 transition"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-4 h-4 text-dark" />
            </button>
          )}
        </div>

        {/* Filters Action Button */}
        <div className="shrink-0 flex items-center gap-2">
          <button
            onClick={() => setFilterModalOpen(true)}
            className="flex items-center gap-2.5 border border-borderLight rounded-xl py-2.5 px-4 text-xs font-semibold text-dark hover:border-dark hover:shadow-xs transition bg-white"
          >
            <SlidersHorizontal className="w-4 h-4 text-dark" />
            <span className="hidden sm:inline">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="bg-dark text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Filter Modal */}
      <FilterModal isOpen={filterModalOpen} onClose={() => setFilterModalOpen(false)} />
    </div>
  );
};
