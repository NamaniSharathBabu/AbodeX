import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, ChevronLeft, ChevronRight, Award } from 'lucide-react';
import { useWishlist } from '../../context/WishlistContext';
import { useToast } from '../../context/ToastContext';

export const PropertyCard = ({ property, showTotal = false }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const { isWishlisted, toggleWishlist } = useWishlist();
  const { showToast } = useToast();

  const wishlisted = isWishlisted(property.id);

  const handlePrevImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const handleNextImage = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setCurrentImageIndex((prev) =>
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const handleWishlistClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(property.id);
    if (!wishlisted) {
      showToast(`Added "${property.city}" to your wishlist!`, 'success');
    } else {
      showToast(`Removed from your wishlist`, 'info');
    }
  };

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="group flex flex-col relative"
    >
      <Link to={`/rooms/${property.id}`} className="block">
        {/* Image Carousel Container */}
        <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-gray-200">
          <img
            src={property.images[currentImageIndex]}
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />

          {/* Guest Favorite / Superhost Badge */}
          {property.isSuperhost && (
            <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-xs text-dark px-2.5 py-1 rounded-full text-xs font-bold shadow-xs flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-airbnb fill-airbnb" />
              <span>Guest favorite</span>
            </div>
          )}

          {/* Wishlist Heart Button */}
          <button
            type="button"
            onClick={handleWishlistClick}
            className="absolute top-3 right-3 p-2 rounded-full transition transform active:scale-75 hover:scale-110 z-10"
            aria-label="Save to wishlist"
          >
            <Heart
              className={`w-6 h-6 stroke-white stroke-[2] drop-shadow-md transition-colors ${
                wishlisted ? 'fill-[#FF385C] text-[#FF385C] animate-heart' : 'fill-black/30 text-white'
              }`}
            />
          </button>

          {/* Carousel Arrows */}
          {property.images.length > 1 && isHovered && (
            <>
              <button
                type="button"
                onClick={handlePrevImage}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md text-dark hover:scale-110 transition z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextImage}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow-md text-dark hover:scale-110 transition z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </>
          )}

          {/* Carousel Pagination Dots */}
          {property.images.length > 1 && (
            <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5 z-10">
              {property.images.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    idx === currentImageIndex
                      ? 'w-4 bg-white shadow-xs'
                      : 'w-1.5 bg-white/60'
                  }`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Content Details */}
        <div className="mt-3 flex flex-col gap-1">
          {/* Title & Rating */}
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-dark text-sm leading-snug truncate">
              {property.city}, {property.country}
            </h3>
            <div className="flex items-center gap-1 text-xs font-semibold text-dark shrink-0">
              <Star className="w-3.5 h-3.5 fill-dark text-dark" />
              <span>{property.rating.toFixed(2)}</span>
              <span className="text-secondary font-normal">({property.reviewCount})</span>
            </div>
          </div>

          {/* Subtitle / Type */}
          <p className="text-xs text-secondary truncate">
            {property.type} · {property.bedrooms} {property.bedrooms === 1 ? 'bed' : 'beds'}
          </p>

          {/* Availability / Dates placeholder */}
          <p className="text-xs text-secondary truncate">
            Available next week
          </p>

          {/* Price */}
          <div className="mt-1 flex items-baseline gap-1.5 text-sm">
            <span className="font-bold text-dark">${property.price}</span>
            <span className="text-secondary text-xs">night</span>
            {showTotal && (
              <span className="text-xs text-secondary underline ml-auto">
                ${property.price * 5 + property.cleaningFee + property.serviceFee} total
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
};
