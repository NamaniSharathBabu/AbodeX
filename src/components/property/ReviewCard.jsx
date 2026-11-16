import React, { useState } from 'react';
import { Star } from 'lucide-react';

export const ReviewCard = ({ review }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const isLong = review.comment.length > 180;
  const displayText = isLong && !isExpanded
    ? `${review.comment.substring(0, 180)}...`
    : review.comment;

  return (
    <div className="flex flex-col gap-3">
      {/* Reviewer info */}
      <div className="flex items-center gap-3">
        <img
          src={review.avatar}
          alt={review.author}
          className="w-11 h-11 rounded-full object-cover bg-gray-100"
        />
        <div>
          <h4 className="font-bold text-dark text-sm leading-none">{review.author}</h4>
          <p className="text-xs text-secondary mt-1">{review.date}</p>
        </div>
      </div>

      {/* Star rating */}
      <div className="flex items-center gap-1">
        {[...Array(review.rating || 5)].map((_, i) => (
          <Star key={i} className="w-3 h-3 fill-dark text-dark" />
        ))}
      </div>

      {/* Comment */}
      <p className="text-xs sm:text-sm text-dark leading-relaxed">
        {displayText}
      </p>

      {isLong && (
        <button
          type="button"
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs font-bold underline text-dark text-left hover:text-gray-600 transition"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
};
