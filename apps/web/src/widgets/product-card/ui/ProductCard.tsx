/**
 * Product Card Component
 * Displays product image, brand, name, price, badges, and wishlist button
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/shared/lib/cn';
import { PriceDisplay } from '@/entities/product/ui/PriceDisplay';
import { ProductBadges } from '@/entities/product/ui/ProductBadge';
import { Rating } from '@/shared/ui/Rating';
import { ROUTES } from '@/shared/config/routes';
import { COUNTRY_FLAGS } from '@packages/types';
import type { ProductWithDefaultVariant } from '@packages/types';
import { WishlistButton } from '@/features/wishlist';
import { useCartStore } from '@/features/cart/model/useCartStore';

interface ProductCardProps {
  product: ProductWithDefaultVariant;
  className?: string;
  showBadges?: boolean;
  showRating?: boolean;
  showOrigin?: boolean;
  variant?: 'default' | 'compact';
}

export function ProductCard({
  product,
  className,
  showBadges = true,
  showRating = true,
  showOrigin = true,
  variant = 'default',
}: ProductCardProps) {
  const { brand, default_variant, primary_image } = product;
  const addItem = useCartStore((s) => s.addItem);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!default_variant) return;
    addItem({
      id:        default_variant.id,
      productId: product.id,
      variantId: default_variant.id,
      name:      product.name_ru,
      price:     default_variant.price_rub,
      salePrice: default_variant.sale_price_rub ?? null,
      quantity:  1,
      imageUrl:  primary_image?.url,
      slug:      product.slug,
    });
  };

  const hasDiscount =
    default_variant?.sale_price_rub !== null &&
    default_variant?.sale_price_rub !== undefined &&
    default_variant.sale_price_rub < default_variant.price_rub;

  const isCompact = variant === 'compact';

  return (
    <article
      className={cn(
        'group relative bg-brand-black-700 border border-brand-black-600',
        'rounded-[2px] overflow-hidden',
        'transition-all duration-300',
        'hover:border-brand-pink-500 hover:shadow-[0_0_20px_rgba(255,26,117,0.15)]',
        className
      )}
    >
      {/* Image Container */}
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className={cn(
          'relative block overflow-hidden',
          isCompact ? 'aspect-[3/4]' : 'aspect-[3/4]'
        )}
      >
        {primary_image ? (
          <Image
            src={primary_image.url}
            alt={primary_image.alt_ru || product.name_ru}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full bg-brand-black-800 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-sm">Нет изображения</span>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black-900/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        {showBadges && (
          <div className="absolute top-2 left-2 right-2">
            <ProductBadges
              isHit={product.is_featured}
              isNew={
                new Date(product.created_at) >
                new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
              }
              isOnSale={hasDiscount}
              isKBeauty={product.brand.origin_country === 'KR'}
            />
          </div>
        )}

        {/* Routine Step Circle — bottom-right corner */}
        {product.routine_step != null && (
          <div
            title={`Шаг ${product.routine_step} рутины`}
            className={cn(
              'absolute bottom-2 right-2',
              'w-7 h-7 rounded-full',
              'bg-brand-black-900/80 backdrop-blur-sm',
              'border border-brand-pink-500/60',
              'flex items-center justify-center',
              'transition-all duration-200',
              'group-hover:border-brand-pink-500 group-hover:bg-brand-pink-500/20',
            )}
          >
            <span className="text-brand-pink-400 text-xs font-bold leading-none group-hover:text-brand-pink-300">
              {product.routine_step}
            </span>
          </div>
        )}

        {/* Wishlist Button — top-right corner */}
        <WishlistButton
          productId={product.id}
          className={cn(
            'absolute top-2 right-2',
            'w-8 h-8 flex items-center justify-center',
            'bg-brand-black-900/80 backdrop-blur-sm rounded-full',
            'hover:bg-brand-pink-500 hover:scale-110 hover:text-white'
          )}
        />

        {/* Quick Add Button (shown on hover) */}
        {!isCompact && default_variant && (
          <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
            <button
              className={cn(
                'w-full py-2 px-4 bg-brand-pink-500 text-white text-sm font-medium',
                'rounded-[2px] transition-colors',
                'hover:bg-brand-pink-400',
                'focus:outline-none focus:ring-2 focus:ring-brand-pink-500 focus:ring-offset-2 focus:ring-offset-brand-black-700'
              )}
              onClick={handleAddToCart}
            >
              В корзину
            </button>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className={cn('p-3', isCompact && 'p-2')}>
        {/* Brand & Origin */}
        <div className="flex items-center justify-between mb-1.5">
          <Link
            href={`/catalog?brand=${brand.slug}`}
            className="text-xs text-brand-charcoal-300 hover:text-brand-pink-500 transition-colors"
          >
            {showOrigin && (
              <span className="mr-1">{COUNTRY_FLAGS[brand.origin_country]}</span>
            )}
            {brand.name}
          </Link>

          {showRating && product.review_count > 0 && (
            <div className="flex items-center gap-1">
              <Rating value={product.average_rating} size="xs" readOnly />
              <span className="text-xs text-brand-charcoal-500">
                ({product.review_count})
              </span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <Link href={ROUTES.PRODUCT(product.slug)}>
          <h3
            className={cn(
              'text-white font-medium line-clamp-2 mb-2',
              'hover:text-brand-pink-500 transition-colors',
              isCompact ? 'text-sm' : 'text-base'
            )}
          >
            {product.name_ru}
          </h3>
        </Link>

        {/* Variant Name */}
        {default_variant?.name_ru && !isCompact && (
          <p className="text-xs text-brand-charcoal-500 mb-2">
            {default_variant.name_ru}
          </p>
        )}

        {/* Price */}
        <PriceDisplay
          price={default_variant?.price_rub || 0}
          salePrice={default_variant?.sale_price_rub}
          size={isCompact ? 'sm' : 'md'}
        />
      </div>
    </article>
  );
}

/**
 * Product Card Skeleton
 */
export function ProductCardSkeleton({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'compact';
}) {
  const isCompact = variant === 'compact';

  return (
    <div
      className={cn(
        'bg-brand-black-700 border border-brand-black-600',
        'rounded-[2px] overflow-hidden',
        className
      )}
    >
      {/* Image Skeleton */}
      <div
        className={cn(
          'aspect-[3/4] bg-brand-black-800 animate-pulse',
          isCompact && 'aspect-[3/4]'
        )}
      />

      {/* Content Skeleton */}
      <div className={cn('p-3 space-y-2', isCompact && 'p-2')}>
        <div className="h-3 w-20 bg-brand-black-600 rounded animate-pulse" />
        <div className="h-4 w-full bg-brand-black-600 rounded animate-pulse" />
        <div className="h-4 w-3/4 bg-brand-black-600 rounded animate-pulse" />
        <div className="h-5 w-24 bg-brand-black-600 rounded animate-pulse" />
      </div>
    </div>
  );
}

/**
 * Product Card Grid
 */
interface ProductCardGridProps {
  products: ProductWithDefaultVariant[];
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
}

export function ProductCardGrid({
  products,
  className,
  columns = 4,
  gap = 'md',
}: ProductCardGridProps) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  const gapSizes = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', gridCols[columns], gapSizes[gap], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

/**
 * Product Card Grid Skeleton
 */
export function ProductCardGridSkeleton({
  count = 8,
  columns = 4,
  gap = 'md',
  className,
}: {
  count?: number;
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gridCols = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 sm:grid-cols-3',
    4: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4',
    5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
  };

  const gapSizes = {
    sm: 'gap-3',
    md: 'gap-4',
    lg: 'gap-6',
  };

  return (
    <div className={cn('grid', gridCols[columns], gapSizes[gap], className)}>
      {Array.from({ length: count }).map((_, index) => (
        <ProductCardSkeleton key={index} />
      ))}
    </div>
  );
}
