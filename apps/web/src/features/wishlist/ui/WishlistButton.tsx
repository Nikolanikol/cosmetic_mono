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

  return (
    <button
      onClick={() => toggle(productId)}
      className={cn(
        'p-2 transition-colors',
        inWishlist ? 'text-brand-pink-500' : 'text-brand-charcoal-400 hover:text-brand-pink-500',
        className
      )}
      aria-label={inWishlist ? 'Удалить из избранного' : 'Добавить в избранное'}
    >
      <Heart className={cn('w-5 h-5', inWishlist && 'fill-current')} />
    </button>
  );
}
