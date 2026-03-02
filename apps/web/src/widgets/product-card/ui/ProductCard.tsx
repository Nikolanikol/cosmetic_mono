/**
 * Product Card Component
 * Default: full-bleed image with bottom gradient overlay
 * Compact: horizontal layout for list view
 */

'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { PriceDisplay } from '@/entities/product/ui/PriceDisplay';
import { ROUTES } from '@/shared/config/routes';
import { COUNTRY_FLAGS } from '@packages/types';
import type { ProductWithDefaultVariant } from '@packages/types';
import { WishlistButton } from '@/features/wishlist';
import { useCartStore } from '@/features/cart/model/useCartStore';

interface ProductCardProps {
  product: ProductWithDefaultVariant;
  className?: string;
  variant?: 'default' | 'compact';
}

export function ProductCard({
  product,
  className,
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
    !!default_variant?.sale_price_rub &&
    default_variant.sale_price_rub < default_variant.price_rub;

  if (variant === 'compact') {
    return (
      <CompactCard
        product={product}
        brand={brand}
        primary_image={primary_image}
        default_variant={default_variant}
        hasDiscount={hasDiscount}
        handleAddToCart={handleAddToCart}
        className={className}
      />
    );
  }

  // ── Default: full-bleed overlay card ─────────────────────────────────────
  return (
    <article
      className={cn(
        'group relative overflow-hidden rounded-2xl',
        'bg-brand-black-800',
        'transition-all duration-300',
        'hover:shadow-[0_8px_32px_rgba(255,26,117,0.2)]',
        'hover:-translate-y-0.5',
        className
      )}
    >
      <Link href={ROUTES.PRODUCT(product.slug)} className="block relative aspect-[3/4]">

        {/* Image */}
        {primary_image ? (
          <Image
            src={primary_image.url}
            alt={primary_image.alt_ru || product.name_ru}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-black-700 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-sm">Нет фото</span>
          </div>
        )}

        {/* Permanent bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        {/* Top badges — only the most important, max 2 */}
        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hasDiscount && (
            <Badge variant="sale">
              −{Math.round((1 - default_variant!.sale_price_rub! / default_variant!.price_rub) * 100)}%
            </Badge>
          )}
          {product.is_featured && !hasDiscount && (
            <Badge variant="hit">Хит</Badge>
          )}
          {isNew(product.created_at) && !hasDiscount && !product.is_featured && (
            <Badge variant="new">Новинка</Badge>
          )}
        </div>

        {/* Wishlist — top right */}
        <WishlistButton
          productId={product.id}
          className={cn(
            'absolute top-3 right-3',
            'w-9 h-9 flex items-center justify-center rounded-full',
            'bg-black/40 backdrop-blur-sm',
            'hover:bg-brand-pink-500 hover:scale-110 transition-all duration-200'
          )}
        />

        {/* Bottom overlay content */}
        <div className="absolute bottom-0 left-0 right-0 p-3">
          {/* Brand */}
          <p className="text-white/60 text-xs font-medium mb-1 tracking-wide truncate">
            {COUNTRY_FLAGS[brand.origin_country] && (
              <span className="mr-1">{COUNTRY_FLAGS[brand.origin_country]}</span>
            )}
            {brand.name}
          </p>

          {/* Product name */}
          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
            {product.name_ru}
          </h3>

          {/* Price */}
          <PriceDisplay
            price={default_variant?.price_rub || 0}
            salePrice={default_variant?.sale_price_rub}
            size="sm"
          />

          {/* Add to cart — full width */}
          {default_variant && (
            <button
              onClick={handleAddToCart}
              className={cn(
                'mt-2.5 w-full flex items-center justify-center gap-2',
                'py-2 rounded-xl',
                'bg-brand-pink-500 hover:bg-brand-pink-400 active:bg-brand-pink-600',
                'text-white text-sm font-semibold',
                'transition-colors duration-200',
              )}
            >
              <ShoppingBag className="w-4 h-4 flex-shrink-0" />
              В корзину
            </button>
          )}
        </div>
      </Link>
    </article>
  );
}

// ── Compact / List variant ────────────────────────────────────────────────────

function CompactCard({
  product,
  brand,
  primary_image,
  default_variant,
  hasDiscount,
  handleAddToCart,
  className,
}: {
  product: ProductWithDefaultVariant;
  brand: ProductWithDefaultVariant['brand'];
  primary_image: ProductWithDefaultVariant['primary_image'];
  default_variant: ProductWithDefaultVariant['default_variant'];
  hasDiscount: boolean;
  handleAddToCart: (e: React.MouseEvent) => void;
  className?: string;
}) {
  return (
    <article
      className={cn(
        'group flex gap-4 p-3 rounded-2xl',
        'bg-brand-black-800 border border-brand-black-600',
        'hover:border-brand-pink-500/40 transition-all duration-200',
        className
      )}
    >
      {/* Square image */}
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
      >
        {primary_image ? (
          <Image
            src={primary_image.url}
            alt={primary_image.alt_ru || product.name_ru}
            fill
            sizes="96px"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-brand-black-700 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-xs">Нет фото</span>
          </div>
        )}
      </Link>

      {/* Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          {/* Brand */}
          <p className="text-brand-charcoal-400 text-xs mb-1">
            {COUNTRY_FLAGS[brand.origin_country] && (
              <span className="mr-1">{COUNTRY_FLAGS[brand.origin_country]}</span>
            )}
            {brand.name}
          </p>

          {/* Name */}
          <Link href={ROUTES.PRODUCT(product.slug)}>
            <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 hover:text-brand-pink-400 transition-colors">
              {product.name_ru}
            </h3>
          </Link>

          {/* Variant */}
          {default_variant?.name_ru && (
            <p className="text-brand-charcoal-500 text-xs mt-0.5">
              {default_variant.name_ru}
            </p>
          )}
        </div>

        {/* Price + actions */}
        <div className="flex items-center justify-between gap-2 mt-2">
          <PriceDisplay
            price={default_variant?.price_rub || 0}
            salePrice={default_variant?.sale_price_rub}
            size="sm"
          />

          <div className="flex items-center gap-2">
            <WishlistButton
              productId={product.id}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-brand-black-700 hover:bg-brand-pink-500 transition-colors"
            />
            {default_variant && (
              <button
                onClick={handleAddToCart}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-xs font-medium transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                В корзину
              </button>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isNew(createdAt: string) {
  return new Date(createdAt) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
}

function Badge({
  children,
  variant,
}: {
  children: React.ReactNode;
  variant: 'sale' | 'hit' | 'new';
}) {
  return (
    <span
      className={cn(
        'px-2 py-0.5 rounded-lg text-xs font-semibold',
        variant === 'sale' && 'bg-brand-pink-500 text-white',
        variant === 'hit' && 'bg-white/15 backdrop-blur-sm text-white border border-white/20',
        variant === 'new' && 'bg-white/15 backdrop-blur-sm text-white border border-white/20',
      )}
    >
      {children}
    </span>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

export function ProductCardSkeleton({
  className,
  variant = 'default',
}: {
  className?: string;
  variant?: 'default' | 'compact';
}) {
  if (variant === 'compact') {
    return (
      <div className={cn('flex gap-4 p-3 rounded-2xl bg-brand-black-800', className)}>
        <div className="w-24 h-24 rounded-xl bg-brand-black-700 animate-pulse flex-shrink-0" />
        <div className="flex-1 py-0.5 space-y-2">
          <div className="h-3 w-16 bg-brand-black-700 rounded animate-pulse" />
          <div className="h-4 w-full bg-brand-black-700 rounded animate-pulse" />
          <div className="h-4 w-2/3 bg-brand-black-700 rounded animate-pulse" />
          <div className="h-5 w-20 bg-brand-black-700 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className={cn('rounded-2xl overflow-hidden bg-brand-black-800 aspect-[3/4] animate-pulse', className)} />
  );
}

// ── Grid ──────────────────────────────────────────────────────────────────────

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
  const gapSizes = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' };

  return (
    <div className={cn('grid', gridCols[columns], gapSizes[gap], className)}>
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

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
  const gapSizes = { sm: 'gap-3', md: 'gap-4', lg: 'gap-6' };

  return (
    <div className={cn('grid', gridCols[columns], gapSizes[gap], className)}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
