/**
 * Rating Component
 * Star rating display and input
 */

'use client';

import { useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/shared/lib/cn';

interface RatingProps {
  value: number;
  max?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  readOnly?: boolean;
  onChange?: (value: number) => void;
  className?: string;
}

export function Rating({
  value,
  max = 5,
  size = 'md',
  readOnly = false,
  onChange,
  className,
}: RatingProps) {
  const [hoverValue, setHoverValue] = useState<number | null>(null);

  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
  };

  const displayValue = hoverValue ?? value;

  return (
    <div
      className={cn('flex items-center gap-0.5', className)}
      role={readOnly ? 'img' : 'radiogroup'}
      aria-label={readOnly ? `Рейтинг: ${value} из ${max}` : 'Выберите рейтинг'}
    >
      {Array.from({ length: max }, (_, index) => {
        const starValue = index + 1;
        const isFilled = starValue <= displayValue;
        const isHalf =
          !isFilled && starValue - 0.5 <= displayValue && starValue > displayValue;

        return (
          <button
            key={index}
            type="button"
            disabled={readOnly}
            className={cn(
              'relative transition-colors',
              !readOnly && 'cursor-pointer hover:scale-110',
              readOnly && 'cursor-default'
            )}
            onMouseEnter={() => !readOnly && setHoverValue(starValue)}
            onMouseLeave={() => !readOnly && setHoverValue(null)}
            onClick={() => !readOnly && onChange?.(starValue)}
            aria-label={`${starValue} звезд`}
          >
            {/* Background star (empty) */}
            <Star
              className={cn(
                sizeClasses[size],
                'text-brand-charcoal-700'
              )}
            />

            {/* Filled star overlay */}
            <div
              className={cn(
                'absolute inset-0 overflow-hidden',
                isHalf && 'w-1/2'
              )}
              style={{ width: isHalf ? '50%' : isFilled ? '100%' : '0%' }}
            >
              <Star
                className={cn(
                  sizeClasses[size],
                  'fill-brand-pink-500 text-brand-pink-500'
                )}
              />
            </div>
          </button>
        );
      })}
    </div>
  );
}

/**
 * Rating Display Component (read-only with text)
 */
interface RatingDisplayProps {
  value: number;
  count?: number;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showValue?: boolean;
  className?: string;
}

export function RatingDisplay({
  value,
  count,
  size = 'sm',
  showValue = true,
  className,
}: RatingDisplayProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <Rating value={value} size={size} readOnly />
      {showValue && (
        <span className="text-sm text-brand-charcoal-300">
          {value.toFixed(1)}
          {count !== undefined && (
            <span className="text-brand-charcoal-500 ml-1">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
