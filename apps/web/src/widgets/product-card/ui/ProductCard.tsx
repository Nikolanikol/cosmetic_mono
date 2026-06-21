'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { PriceDisplay } from '@/entities/product/ui/PriceDisplay';
import { ROUTES } from '@/shared/config/routes';
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
      id:        String(default_variant.id),
      productId: String(product.id),
      variantId: String(default_variant.id),
      name:      product.name,
      price:     default_variant.price,
      salePrice: default_variant.compare_at_price && default_variant.compare_at_price > default_variant.price
        ? default_variant.price : null,
      quantity:  1,
      imageUrl:  primary_image?.url,
      slug:      product.slug,
    });
  };

  const hasDiscount =
    !!default_variant?.compare_at_price &&
    default_variant.compare_at_price > default_variant.price;

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
        {primary_image ? (
          <img
            src={primary_image.url}
            alt={primary_image.alt || product.name}
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-brand-black-700 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-sm">Нет фото</span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />

        <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
          {hasDiscount && (
            <Badge variant="sale">
              −{Math.round((1 - default_variant!.price / default_variant!.compare_at_price!) * 100)}%
            </Badge>
          )}
        </div>

        <WishlistButton
          productId={String(product.id)}
          className={cn(
            'absolute top-3 right-3',
            'w-9 h-9 flex items-center justify-center rounded-full',
            'bg-black/40 backdrop-blur-sm',
            'hover:bg-brand-pink-500 hover:scale-110 transition-all duration-200'
          )}
        />

        <div className="absolute bottom-0 left-0 right-0 p-3">
          <p className="text-white/60 text-xs font-medium mb-1 tracking-wide truncate">
            {brand.name}
          </p>

          <h3 className="text-white font-semibold text-sm leading-snug line-clamp-2 mb-2">
            {product.name}
          </h3>

          <PriceDisplay
            price={hasDiscount ? default_variant!.compare_at_price! : (default_variant?.price || 0)}
            salePrice={hasDiscount ? default_variant!.price : undefined}
            size="sm"
          />

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
      <Link
        href={ROUTES.PRODUCT(product.slug)}
        className="relative flex-shrink-0 w-24 h-24 rounded-xl overflow-hidden"
      >
        {primary_image ? (
          <img
            src={primary_image.url}
            alt={primary_image.alt || product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-brand-black-700 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-xs">Нет фото</span>
          </div>
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
        <div>
          <p className="text-brand-charcoal-400 text-xs mb-1">{brand.name}</p>
          <Link href={ROUTES.PRODUCT(product.slug)}>
            <h3 className="text-white text-sm font-semibold leading-snug line-clamp-2 hover:text-brand-pink-400 transition-colors">
              {product.name}
            </h3>
          </Link>
          {default_variant?.name && (
            <p className="text-brand-charcoal-500 text-xs mt-0.5">
              {default_variant.name}
            </p>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 mt-2">
          <PriceDisplay
            price={hasDiscount ? default_variant!.compare_at_price! : (default_variant?.price || 0)}
            salePrice={hasDiscount ? default_variant!.price : undefined}
            size="sm"
          />

          <div className="flex items-center gap-2">
            <WishlistButton
              productId={String(product.id)}
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

export function ProductCardGrid({
  products,
  className,
  columns = 4,
  gap = 'md',
}: {
  products: ProductWithDefaultVariant[];
  className?: string;
  columns?: 2 | 3 | 4 | 5;
  gap?: 'sm' | 'md' | 'lg';
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
