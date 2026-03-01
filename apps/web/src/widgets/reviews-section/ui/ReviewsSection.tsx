'use client';

import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatDate } from '@/shared/lib/formatDate';

interface Review {
  id: string;
  author: string;
  rating: number;
  text: string;
  createdAt: string;
}

interface ReviewsSectionProps {
  reviews?: Review[];
  averageRating?: number;
  totalReviews?: number;
  className?: string;
}

export function ReviewsSection({
  reviews = [],
  averageRating = 0,
  totalReviews = 0,
  className,
}: ReviewsSectionProps) {
  return (
    <div className={cn('space-y-6', className)}>
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-medium text-white">Отзывы</h2>
        {totalReviews > 0 && (
          <div className="flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={cn(
                    'w-4 h-4',
                    star <= Math.round(averageRating)
                      ? 'fill-brand-pink-500 text-brand-pink-500'
                      : 'text-brand-black-600'
                  )}
                />
              ))}
            </div>
            <span className="text-white font-medium">{averageRating.toFixed(1)}</span>
            <span className="text-brand-charcoal-500 text-sm">({totalReviews})</span>
          </div>
        )}
      </div>

      {reviews.length === 0 ? (
        <p className="text-brand-charcoal-400 py-8 text-center">Отзывов пока нет</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="p-4 bg-brand-black-700 border border-brand-black-600 rounded-[2px]"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">{review.author}</span>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={cn(
                          'w-3 h-3',
                          star <= review.rating
                            ? 'fill-brand-pink-500 text-brand-pink-500'
                            : 'text-brand-black-600'
                        )}
                      />
                    ))}
                  </div>
                </div>
                <span className="text-xs text-brand-charcoal-500">
                  {formatDate(review.createdAt)}
                </span>
              </div>
              <p className="text-brand-charcoal-300 text-sm leading-relaxed">{review.text}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
