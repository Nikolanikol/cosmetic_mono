'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Truck, RotateCcw, Shield, Package, ExternalLink } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { PriceDisplay } from '@/entities/product/ui/PriceDisplay';
import { ProductCard, ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCard';
import { WishlistButton } from '@/features/wishlist';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { getProductBySlug, getRelatedProducts } from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/api/queryClient';
import type { ProductVariant, ProductWithDetails, ProductImage } from '@packages/types';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  const { data: product, isLoading, isError } = useQuery({
    queryKey: queryKeys.products.details(slug),
    queryFn: () => getProductBySlug(supabaseBrowser, slug),
  });

  if (isLoading) return <ProductDetailSkeleton />;
  if (isError || !product) return <ProductNotFound />;

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb product={product} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
          <ProductGallery images={product.images} productName={product.name} />
          <ProductInfo product={product} />
        </div>
        <ProductDescription product={product} />
        <RelatedProducts productId={product.id} categoryId={product.category_id} />
      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ product }: { product: ProductWithDetails }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-brand-charcoal-400 flex-wrap">
      <Link href="/" className="hover:text-white transition-colors">Главная</Link>
      <span className="text-brand-charcoal-600">/</span>
      <Link href="/en/catalog" className="hover:text-white transition-colors">Каталог</Link>
      <span className="text-brand-charcoal-600">/</span>
      <Link
        href={`/catalog?category=${product.category.slug}`}
        className="hover:text-white transition-colors"
      >
        {product.category.name}
      </Link>
      <span className="text-brand-charcoal-600">/</span>
      <span className="text-white truncate max-w-[200px]">{product.name}</span>
    </nav>
  );
}

// ── Gallery ───────────────────────────────────────────────────────────────────

function ProductGallery({
  images,
  productName,
}: {
  images: ProductImage[];
  productName: string;
}) {
  const sorted = [...images].sort((a, b) => a.sort_order - b.sort_order);
  const primary = sorted.find((img) => img.is_primary) ?? sorted[0] ?? null;
  const [selected, setSelected] = useState<ProductImage | null>(null);
  const active = selected ?? primary;

  return (
    <div className="space-y-3">
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-black-800 border border-brand-black-600">
        {active ? (
          <img
            src={active.url}
            alt={active.alt ?? productName}
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-sm">Нет фото</span>
          </div>
        )}
      </div>

      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img) => (
            <button
              key={img.id}
              onClick={() => setSelected(img)}
              className={cn(
                'relative flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all duration-200',
                active?.id === img.id
                  ? 'border-brand-pink-500'
                  : 'border-brand-black-600 hover:border-brand-black-400'
              )}
            >
              <img
                src={img.url}
                alt={img.alt ?? productName}
                className="absolute inset-0 w-full h-full object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product info (right column) ───────────────────────────────────────────────

function ProductInfo({ product }: { product: ProductWithDetails }) {
  const addItem = useCartStore((s) => s.addItem);
  const { brand, variants, images } = product;
  const primaryImage = images.find((img) => img.is_primary) ?? images[0] ?? null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );

  const v = selectedVariant;
  const hasDiscount = !!v?.compare_at_price && v.compare_at_price > v.price;
  const discountPercent = hasDiscount
    ? Math.round((1 - v!.price / v!.compare_at_price!) * 100)
    : 0;

  const handleAddToCart = () => {
    if (!v || !v.in_stock) return;
    addItem({
      id:        String(v.id),
      productId: String(product.id),
      variantId: String(v.id),
      name:      product.name,
      price:     hasDiscount ? v.compare_at_price! : v.price,
      salePrice: hasDiscount ? v.price : null,
      quantity:  1,
      imageUrl:  primaryImage?.url,
      slug:      product.slug,
    });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Brand */}
      <Link
        href={`/catalog?brand=${brand.slug}`}
        className="flex items-center gap-2 text-brand-charcoal-400 hover:text-brand-pink-400 transition-colors text-sm font-medium w-fit"
      >
        {brand.logo_url && (
          <img src={brand.logo_url} alt={brand.name} className="h-5 w-auto object-contain" />
        )}
        {brand.name}
      </Link>

      {/* Name */}
      <h1 className="text-2xl sm:text-3xl font-heading text-white leading-tight">
        {product.name}
      </h1>

      {/* Discount badge */}
      {hasDiscount && (
        <div className="flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-lg bg-brand-pink-500 text-white text-sm font-semibold">
            −{discountPercent}%
          </span>
        </div>
      )}

      {/* Price */}
      <PriceDisplay
        price={hasDiscount ? v!.compare_at_price! : (v?.price ?? 0)}
        salePrice={hasDiscount ? v!.price : undefined}
        size="lg"
      />

      {/* Variant selector */}
      {variants.length > 1 && (() => {
        const hasColors = variants.some((vr) => vr.color_hex);

        if (hasColors) {
          const isLight = (hex: string) => {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return (r * 299 + g * 587 + b * 114) / 1000 > 200;
          };

          const sorted = [...variants].sort((a, b) => {
            const numA = parseFloat(a.name.match(/^[\d.]+/)?.[0] ?? '0');
            const numB = parseFloat(b.name.match(/^[\d.]+/)?.[0] ?? '0');
            return numA - numB;
          });

          return (
            <div>
              <p className="text-brand-charcoal-400 text-xs mb-1 font-medium uppercase tracking-wider">
                Оттенок
              </p>
              <p className="text-white text-sm mb-3">{v?.name}</p>
              <div className="flex flex-wrap gap-1.5">
                {sorted.map((variant) => (
                  <button
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    title={variant.name}
                    className={cn(
                      'w-7 h-7 rounded-full transition-all duration-150 flex-shrink-0',
                      v?.id === variant.id
                        ? 'ring-2 ring-offset-2 ring-brand-pink-500 ring-offset-brand-black-900 scale-110'
                        : 'hover:scale-110',
                      variant.color_hex && isLight(variant.color_hex) && 'border border-brand-black-500'
                    )}
                    style={{ backgroundColor: variant.color_hex ?? undefined }}
                  />
                ))}
              </div>
            </div>
          );
        }

        return (
          <div>
            <p className="text-brand-charcoal-400 text-xs mb-2 font-medium uppercase tracking-wider">
              Вариант
            </p>
            <div className="flex flex-wrap gap-2">
              {variants.map((variant) => (
                <button
                  key={variant.id}
                  onClick={() => setSelectedVariant(variant)}
                  className={cn(
                    'px-3 py-1.5 rounded-xl text-sm transition-all duration-200 border',
                    v?.id === variant.id
                      ? 'bg-brand-pink-500 text-white border-brand-pink-500'
                      : 'bg-brand-black-700 text-brand-charcoal-300 border-brand-black-500 hover:border-brand-charcoal-400'
                  )}
                >
                  {variant.name}
                </button>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Stock + Weight */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div className={cn('w-2 h-2 rounded-full flex-shrink-0', v?.in_stock ? 'bg-green-500' : 'bg-red-500')} />
          <span className={cn('text-sm', v?.in_stock ? 'text-green-400' : 'text-red-400')}>
            {v ? (v.in_stock ? 'В наличии' : 'Нет в наличии') : 'Нет вариантов'}
          </span>
        </div>
        {v && v.weight_g > 0 && (
          <>
            <span className="text-brand-charcoal-600">·</span>
            <span className="text-brand-charcoal-400 text-sm flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {v.weight_g} г
            </span>
          </>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!v?.in_stock}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5',
            'py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            v?.in_stock
              ? 'bg-brand-pink-500 hover:bg-brand-pink-400 active:bg-brand-pink-600 text-white'
              : 'bg-brand-black-700 text-brand-charcoal-500 cursor-not-allowed'
          )}
        >
          <ShoppingBag className="w-5 h-5 flex-shrink-0" />
          В корзину
        </button>
        <WishlistButton
          productId={String(product.id)}
          className={cn(
            'w-14 flex items-center justify-center rounded-xl',
            'bg-brand-black-700 border border-brand-black-500',
            'hover:bg-brand-pink-500/10 hover:border-brand-pink-500/40',
            'transition-all duration-200'
          )}
        />
      </div>

      {/* Delivery perks */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-brand-black-600">
        {[
          { icon: Truck,      label: 'Доставка',  sub: 'по всему миру' },
          { icon: RotateCcw,  label: 'Возврат',   sub: '14 дней' },
          { icon: Shield,     label: 'Оригинал',  sub: 'гарантия' },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon className="w-5 h-5 text-brand-charcoal-400" />
            <span className="text-white text-xs font-medium">{label}</span>
            <span className="text-brand-charcoal-500 text-xs">{sub}</span>
          </div>
        ))}
      </div>

      {/* SKU */}
      {v?.sku && (
        <p className="text-brand-charcoal-500 text-xs">
          Артикул: {v.sku}
        </p>
      )}

      {/* Admin: source link */}
      {process.env.NEXT_PUBLIC_IS_ADMIN === 'true' && product.source_url && (
        <a
          href={product.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-900/20 border border-amber-700/30 text-amber-400 text-xs hover:bg-amber-900/30 transition-colors w-fit"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Источник: {brand.name}
        </a>
      )}
    </div>
  );
}

// ── Description + Tags ───────────────────────────────────────────────────────

function ProductDescription({ product }: { product: ProductWithDetails }) {
  if (!product.description && product.tags.length === 0) return null;

  return (
    <section className="mt-12 border-t border-brand-black-600 pt-10">
      {product.description && (
        <>
          <h2 className="text-lg font-semibold text-white mb-6">Описание</h2>
          <div
            className="max-w-2xl text-brand-charcoal-300 leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_strong]:text-white [&_h2]:text-white [&_h2]:text-base [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-white [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_a]:text-brand-pink-400 [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </>
      )}

      {product.tags.length > 0 && (
        <div className={cn('flex flex-wrap gap-2', product.description && 'mt-8')}>
          {product.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-lg bg-brand-black-700 border border-brand-black-500 text-brand-charcoal-400 text-xs"
            >
              #{tag}
            </span>
          ))}
        </div>
      )}
    </section>
  );
}

// ── Related products ──────────────────────────────────────────────────────────

function RelatedProducts({ productId, categoryId }: { productId: number; categoryId: number }) {
  const { data: related, isLoading } = useQuery({
    queryKey: queryKeys.products.related(String(productId)),
    queryFn: () => getRelatedProducts(supabaseBrowser, productId, categoryId, 4),
    enabled: !!productId,
  });

  if (!isLoading && (!related || related.length === 0)) return null;

  return (
    <section className="mt-16 pt-10 border-t border-brand-black-600">
      <h2 className="text-xl font-heading text-white mb-6">Похожие товары</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : (related ?? []).map((p) => <ProductCard key={p.id} product={p} />)}
      </div>
    </section>
  );
}

// ── Skeleton ──────────────────────────────────────────────────────────────────

function ProductDetailSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="h-4 w-72 bg-brand-black-700 rounded animate-pulse mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <div className="aspect-square bg-brand-black-800 rounded-2xl animate-pulse" />
          <div className="space-y-4 pt-2">
            <div className="h-3 w-24 bg-brand-black-700 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-brand-black-700 rounded animate-pulse" />
            <div className="h-4 w-48 bg-brand-black-700 rounded animate-pulse" />
            <div className="h-10 w-32 bg-brand-black-700 rounded animate-pulse" />
            <div className="h-14 w-full bg-brand-black-700 rounded-xl animate-pulse" />
            <div className="h-12 w-full bg-brand-black-700 rounded animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Not found ─────────────────────────────────────────────────────────────────

function ProductNotFound() {
  return (
    <div className="min-h-screen bg-brand-black-900 flex items-center justify-center">
      <div className="text-center px-4">
        <h1 className="text-2xl font-heading text-white mb-2">Товар не найден</h1>
        <p className="text-brand-charcoal-400 mb-6">
          Возможно, он был удалён или ссылка неверная
        </p>
        <Button href="/en/catalog">Перейти в каталог</Button>
      </div>
    </div>
  );
}
