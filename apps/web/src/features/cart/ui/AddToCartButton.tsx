'use client';

import { ShoppingBag, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/shared/lib/cn';
import { useCartStore } from '@/features/cart/model/useCartStore';

interface AddToCartButtonProps {
  productId: string;
  variantId: string;
  name: string;
  price: number;
  salePrice?: number | null;
  imageUrl?: string;
  slug: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function AddToCartButton({
  productId,
  variantId,
  name,
  price,
  salePrice,
  imageUrl,
  slug,
  className,
  size = 'md',
}: AddToCartButtonProps) {
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const handleClick = () => {
    addItem({ id: variantId, productId, variantId, name, price, salePrice, quantity: 1, imageUrl, slug });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium rounded-[2px] transition-all duration-200',
        'bg-brand-pink-500 text-white hover:bg-brand-pink-400 active:bg-brand-pink-600',
        'focus:outline-none focus:ring-2 focus:ring-brand-pink-500 focus:ring-offset-2 focus:ring-offset-brand-black-900',
        {
          'px-3 py-1.5 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
        },
        added && 'bg-green-600 hover:bg-green-600',
        className
      )}
    >
      {added ? (
        <>
          <Check className="w-4 h-4" />
          Добавлено
        </>
      ) : (
        <>
          <ShoppingBag className="w-4 h-4" />
          В корзину
        </>
      )}
    </button>
  );
}
