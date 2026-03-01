'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, ArrowLeft } from 'lucide-react';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { useWishlistStore } from '@/features/wishlist/model/useWishlistStore';
import { ProductCard, ProductCardSkeleton } from '@/widgets/product-card';
import { getWishlistProducts } from '@packages/api';
import type { ProductWithDefaultVariant } from '@packages/types';

export function WishlistPage() {
  const { user } = useAuthStore();
  const { ids } = useWishlistStore();
  const [products, setProducts] = useState<ProductWithDefaultVariant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    getWishlistProducts(supabaseBrowser, user.id)
      .then((data) => setProducts(data))
      .catch(() => setProducts([]))
      .finally(() => setIsLoading(false));
  }, [user, ids]); // re-fetch whenever ids change (toggle)

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link
            href="/profile"
            className="text-brand-charcoal-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Heart className="w-6 h-6 text-brand-pink-500" />
            <h1 className="text-2xl font-bold text-white">Избранное</h1>
          </div>
          {!isLoading && products.length > 0 && (
            <span className="ml-auto text-sm text-brand-charcoal-400">
              {products.length} {pluralizeProducts(products.length)}
            </span>
          )}
        </div>

        {/* Not logged in */}
        {!user && (
          <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-brand-black-600" />
            <p className="text-white font-medium mb-2">Войдите, чтобы видеть избранное</p>
            <p className="text-brand-charcoal-400 text-sm mb-6">
              Сохраняйте понравившиеся товары и возвращайтесь к ним позже
            </p>
            <Link
              href="/login"
              className="inline-block px-6 py-2 bg-brand-pink-500 text-white text-sm font-medium rounded-[2px] hover:bg-brand-pink-400 transition-colors"
            >
              Войти
            </Link>
          </div>
        )}

        {/* Loading skeletons */}
        {user && isLoading && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Empty state */}
        {user && !isLoading && products.length === 0 && (
          <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-12 text-center">
            <Heart className="w-12 h-12 mx-auto mb-4 text-brand-black-600" />
            <p className="text-white font-medium mb-2">Список избранного пуст</p>
            <p className="text-brand-charcoal-400 text-sm mb-6">
              Нажмите ♡ на карточке товара, чтобы добавить его сюда
            </p>
            <Link
              href="/catalog"
              className="inline-flex items-center gap-2 px-6 py-2 bg-brand-pink-500 text-white text-sm font-medium rounded-[2px] hover:bg-brand-pink-400 transition-colors"
            >
              <ShoppingBag className="w-4 h-4" />
              Перейти в каталог
            </Link>
          </div>
        )}

        {/* Product grid */}
        {user && !isLoading && products.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function pluralizeProducts(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара';
  return 'товаров';
}
