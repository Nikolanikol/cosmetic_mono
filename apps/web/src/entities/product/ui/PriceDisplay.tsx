/**
 * Price Display Component
 * Shows formatted prices with sale styling
 */

'use client';

import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';

interface PriceDisplayProps {
  price: number;
  salePrice?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showCurrency?: boolean;
  className?: string;
}

export function PriceDisplay({
  price,
  salePrice,
  size = 'md',
  showCurrency = true,
  className,
}: PriceDisplayProps) {
  const hasDiscount = salePrice !== null && salePrice !== undefined && salePrice < price;
  const displayPrice = hasDiscount ? salePrice : price;

  const sizeClasses = {
    sm: {
      price: 'text-sm',
      original: 'text-xs',
    },
    md: {
      price: 'text-base font-semibold',
      original: 'text-sm',
    },
    lg: {
      price: 'text-xl font-bold',
      original: 'text-base',
    },
  };

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Current price */}
      <span
        className={cn(
          sizeClasses[size].price,
          hasDiscount ? 'text-brand-pink-500' : 'text-white'
        )}
      >
        {formatPrice(displayPrice, showCurrency)}
      </span>

      {/* Original price (if on sale) */}
      {hasDiscount && (
        <span
          className={cn(
            sizeClasses[size].original,
            'text-brand-charcoal-500 line-through'
          )}
        >
          {formatPrice(price, showCurrency)}
        </span>
      )}

    </div>
  );
}
