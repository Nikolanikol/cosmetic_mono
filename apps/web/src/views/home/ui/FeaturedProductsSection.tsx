'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { ProductCard, ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCard';
import { getFeaturedProducts } from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/api/queryClient';
import type { ProductWithDefaultVariant } from '@packages/types';

interface FeaturedProductsSectionProps {
  products: ProductWithDefaultVariant[];
}

export function FeaturedProductsSection({ products: initialProducts }: FeaturedProductsSectionProps) {
  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => getFeaturedProducts(supabaseBrowser, 8),
    initialData: initialProducts.length > 0 ? initialProducts : undefined,
  });

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="bg-brand-black-800 border-y border-brand-black-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xs text-brand-pink-400 font-medium tracking-widest uppercase mb-1">
              Most popular
            </p>
            <h2 className="text-2xl sm:text-3xl font-heading text-white">Bestsellers</h2>
          </div>
          <Link
            href="/en/catalog?sort=popular"
            className="hidden sm:flex items-center gap-1.5 text-sm text-brand-charcoal-300 hover:text-brand-pink-400 transition-colors"
          >
            View all
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 mt-8">
          {isLoading
            ? Array.from({ length: 8 }).map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))
            : (products || []).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
        </div>
      </div>
    </section>
  );
}
