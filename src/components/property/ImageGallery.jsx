import React, { useState, useEffect } from 'react';
import { Grid, X, ChevronLeft, ChevronRight, Share2, Heart } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

export const ImageGallery = ({ images = [], propertyId, title }) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const wishlisted = propertyId ? isWishlisted(propertyId) : false;

  const openModalAt = (index) => {
    setActiveIndex(index);
    setModalOpen(true);
  };

  const handlePrev = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const handleNext = (e) => {
    if (e) e.stopPropagation();
    setActiveIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    showToast('Link copied to clipboard!', 'success');
  };

  const handleWishlist = () => {
    if (propertyId) {
      toggleWishlist(propertyId);
      if (!wishlisted) {
        showToast('Saved to your wishlist!', 'success');
      } else {
        showToast('Removed from wishlist', 'info');
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!modalOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setModalOpen(false);
      if (e.key === 'ArrowLeft') handlePrev();
      if (e.key === 'ArrowRight') handleNext();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalOpen]);

  if (!images || images.length === 0) return null;

  return (
    <div className="relative">
      {/* Mobile Single Photo Carousel */}
      <div className="md:hidden relative aspect-4/3 w-full overflow-hidden rounded-2xl bg-gray-200">
        <img
          src={images[0]}
          alt={title}
          onClick={() => openModalAt(0)}
          className="w-full h-full object-cover cursor-pointer"
        />
        <button
          onClick={() => openModalAt(0)}
          className="absolute bottom-3 right-3 bg-dark/80 text-white text-xs px-3 py-1.5 rounded-full font-medium flex items-center gap-1.5 backdrop-blur-xs"
        >
          <Grid className="w-3.5 h-3.5" />
          <span>1 / {images.length}</span>
        </button>
      </div>

      {/* Desktop 5-Image Mosaic */}
      <div className="hidden md:grid grid-cols-4 grid-rows-2 gap-2 h-[420px] rounded-3xl overflow-hidden relative">
        {/* Main Large Image (Left 2 cols, full height) */}
        <div
          onClick={() => openModalAt(0)}
          className="col-span-2 row-span-2 relative group cursor-pointer overflow-hidden bg-gray-200"
        >
          <img
            src={images[0]}
            alt={`${title} - Main`}
            className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-95 transition-all duration-300"
          />
        </div>

        {/* 4 Smaller Images (Right 2 cols) */}
        {images.slice(1, 5).map((imgUrl, idx) => (
          <div
            key={idx}
            onClick={() => openModalAt(idx + 1)}
            className="relative group cursor-pointer overflow-hidden bg-gray-200"
          >
            <img
              src={imgUrl}
              alt={`${title} - View ${idx + 2}`}
              className="w-full h-full object-cover group-hover:scale-105 group-hover:brightness-95 transition-all duration-300"
            />
          </div>
        ))}

        {/* "Show all photos" Button */}
        <button
          type="button"
          onClick={() => openModalAt(0)}
          className="absolute bottom-5 right-5 bg-white/95 hover:bg-white text-dark text-xs sm:text-sm font-semibold px-4 py-2 rounded-xl shadow-md border border-borderLight flex items-center gap-2 transition hover:scale-105 active:scale-95"
        >
          <Grid className="w-4 h-4" />
          <span>Show all {images.length} photos</span>
        </button>
      </div>

      {/* Lightbox Fullscreen Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-black text-white flex flex-col animate-fade-in">
          {/* Top Bar */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-800 bg-black/70 backdrop-blur-md">
            <button
              onClick={() => setModalOpen(false)}
              className="p-2 rounded-full hover:bg-white/10 transition flex items-center gap-2 text-sm font-semibold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>

            <span className="text-sm font-medium">
              {activeIndex + 1} / {images.length}
            </span>

            <div className="flex items-center gap-2">
              <button
                onClick={handleShare}
                className="p-2.5 rounded-full hover:bg-white/10 transition"
                title="Share"
              >
                <Share2 className="w-4 h-4" />
              </button>
              {propertyId && (
                <button
                  onClick={handleWishlist}
                  className="p-2.5 rounded-full hover:bg-white/10 transition"
                  title="Save"
                >
                  <Heart
                    className={`w-4 h-4 ${
                      wishlisted ? 'fill-airbnb text-airbnb' : 'text-white'
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Center Image Container */}
          <div className="flex-1 relative flex items-center justify-center p-4 sm:p-8 select-none">
            {/* Prev button */}
            <button
              onClick={handlePrev}
              className="absolute left-4 sm:left-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-110 active:scale-95 z-20"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <img
              src={images[activeIndex]}
              alt={`${title} - Large view`}
              className="max-h-[75vh] max-w-[90vw] object-contain rounded-xl shadow-2xl transition-transform duration-200"
            />

            {/* Next button */}
            <button
              onClick={handleNext}
              className="absolute right-4 sm:right-8 top-1/2 -translate-y-1/2 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition hover:scale-110 active:scale-95 z-20"
              aria-label="Next image"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>

          {/* Bottom Thumbnails */}
          <div className="py-4 px-6 bg-black/80 border-t border-gray-800 flex justify-center gap-2 overflow-x-auto no-scrollbar">
            {images.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveIndex(idx)}
                className={`w-16 h-12 rounded-lg overflow-hidden shrink-0 border-2 transition ${
                  idx === activeIndex
                    ? 'border-airbnb scale-105 opacity-100'
                    : 'border-transparent opacity-50 hover:opacity-80'
                }`}
              >
                <img src={img} alt="thumb" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
