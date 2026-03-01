'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { useCartStore } from '@/features/cart/model/useCartStore';

interface CartItemProps {
  variantId: string;
  name: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
  imageUrl?: string;
  slug: string;
  className?: string;
}

export function CartItem({
  variantId,
  name,
  price,
  salePrice,
  quantity,
  imageUrl,
  slug,
  className,
}: CartItemProps) {
  const { removeItem, updateQuantity } = useCartStore();
  const displayPrice = salePrice ?? price;

  return (
    <div className={cn('flex gap-3 py-4 border-b border-brand-black-600', className)}>
      {/* Image */}
      <Link href={`/product/${slug}`} className="flex-shrink-0">
        <div className="w-20 h-24 bg-brand-black-700 rounded-[2px] overflow-hidden relative">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-brand-charcoal-600 text-xs">
              Нет фото
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <Link href={`/product/${slug}`}>
          <p className="text-sm text-white hover:text-brand-pink-500 transition-colors line-clamp-2 mb-2">
            {name}
          </p>
        </Link>

        <div className="flex items-center gap-2 mb-3">
          <span className={cn('text-sm font-medium', salePrice ? 'text-brand-pink-500' : 'text-white')}>
            {formatPrice(displayPrice)}
          </span>
          {salePrice && (
            <span className="text-xs text-brand-charcoal-500 line-through">
              {formatPrice(price)}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => updateQuantity(variantId, quantity - 1)}
              className="w-7 h-7 flex items-center justify-center border border-brand-black-600 text-brand-charcoal-300 hover:text-white hover:border-brand-pink-500 rounded-[2px] transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-white text-sm w-6 text-center">{quantity}</span>
            <button
              onClick={() => updateQuantity(variantId, quantity + 1)}
              className="w-7 h-7 flex items-center justify-center border border-brand-black-600 text-brand-charcoal-300 hover:text-white hover:border-brand-pink-500 rounded-[2px] transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
          </div>
          <button
            onClick={() => removeItem(variantId)}
            className="text-brand-charcoal-500 hover:text-red-400 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
