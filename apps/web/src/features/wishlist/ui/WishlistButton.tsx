'use client';

import { Heart } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useWishlistStore } from '@/features/wishlist/model/useWishlistStore';

interface WishlistButtonProps {
  productId: string;
  className?: string;
}

export function WishlistButton({ productId, className }: WishlistButtonProps) {
  const { toggle, isInWishlist } = useWishlistStore();
  const inWishlist = isInWishlist(productId);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggle(productId);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={cn(
        'transition-all duration-200',
        'focus:outline-none focus:ring-2 focus:ring-brand-pink-500',
        inWishlist ? 'text-brand-pink-500' : 'text-brand-charcoal-400 hover:text-brand-pink-500',
        className
      )}
      aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Heart className={cn('w-4 h-4', inWishlist && 'fill-current')} />
    </button>
  );
}
