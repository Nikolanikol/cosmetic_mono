/**
 * Product Detail Page
 * Full-screen product view: gallery, info, variants, ingredients, related
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, Truck, RotateCcw, Shield } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { PriceDisplay } from '@/entities/product/ui/PriceDisplay';
import { ProductCard, ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCard';
import { WishlistButton } from '@/features/wishlist';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { getProductBySlug, getRelatedProducts } from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/api/queryClient';
import { COUNTRY_FLAGS, COUNTRY_NAMES_RU, KBEAUTY_ROUTINE_STEPS } from '@packages/types';
import type { ProductVariant, ProductWithRelations, ProductImage } from '@packages/types';
import type { SkinType } from '@packages/types';

// ── Skin type labels ──────────────────────────────────────────────────────────

const SKIN_TYPE_LABELS: Record<SkinType, string> = {
  dry: 'Сухая',
  oily: 'Жирная',
  combination: 'Комбинированная',
  sensitive: 'Чувствительная',
  normal: 'Нормальная',
};

// ── Main page ─────────────────────────────────────────────────────────────────

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

        {/* Breadcrumb */}
        <Breadcrumb product={product} />

        {/* Main 2-col grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-6">
          <ProductGallery images={product.images} productName={product.name_ru} />
          <ProductInfo product={product} />
        </div>

        {/* Description + ingredients */}
        <ProductDetails product={product} />

        {/* Related products */}
        <RelatedProducts productId={product.id} />

      </div>
    </div>
  );
}

// ── Breadcrumb ────────────────────────────────────────────────────────────────

function Breadcrumb({ product }: { product: ProductWithRelations }) {
  return (
    <nav className="flex items-center gap-1.5 text-sm text-brand-charcoal-400 flex-wrap">
      <Link href="/" className="hover:text-white transition-colors">Главная</Link>
      <span className="text-brand-charcoal-600">/</span>
      <Link href="/catalog" className="hover:text-white transition-colors">Каталог</Link>
      <span className="text-brand-charcoal-600">/</span>
      <Link
        href={`/catalog?category=${product.category.slug}`}
        className="hover:text-white transition-colors"
      >
        {product.category.name_ru}
      </Link>
      <span className="text-brand-charcoal-600">/</span>
      <span className="text-white truncate max-w-[200px]">{product.name_ru}</span>
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
      {/* Main image */}
      <div className="relative aspect-square rounded-2xl overflow-hidden bg-brand-black-800 border border-brand-black-600">
        {active ? (
          <Image
            src={active.url}
            alt={active.alt_ru ?? productName}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-brand-charcoal-500 text-sm">Нет фото</span>
          </div>
        )}
      </div>

      {/* Thumbnails */}
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
              <Image
                src={img.url}
                alt={img.alt_ru ?? productName}
                fill
                sizes="64px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Product info (right column) ───────────────────────────────────────────────

function ProductInfo({ product }: { product: ProductWithRelations }) {
  const addItem = useCartStore((s) => s.addItem);
  const { brand, variants, images } = product;

  const primaryImage = images.find((img) => img.is_primary) ?? images[0] ?? null;

  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(
    variants[0] ?? null
  );

  const v = selectedVariant;
  const hasDiscount = !!v?.sale_price_rub && v.sale_price_rub < v.price_rub;
  const discountPercent = hasDiscount
    ? Math.round((1 - v!.sale_price_rub! / v!.price_rub) * 100)
    : 0;
  const inStock = (v?.stock ?? 0) > 0;

  const handleAddToCart = () => {
    if (!v || !inStock) return;
    addItem({
      id:        v.id,
      productId: product.id,
      variantId: v.id,
      name:      product.name_ru,
      price:     v.price_rub,
      salePrice: v.sale_price_rub ?? null,
      quantity:  1,
      imageUrl:  primaryImage?.url,
      slug:      product.slug,
    });
  };

  return (
    <div className="flex flex-col gap-5">

      {/* Brand */}
      <div className="flex items-center gap-2 text-sm">
        <Link
          href={`/catalog?brand=${brand.slug}`}
          className="text-brand-charcoal-400 hover:text-brand-pink-400 transition-colors font-medium"
        >
          {COUNTRY_FLAGS[brand.origin_country] && (
            <span className="mr-1.5">{COUNTRY_FLAGS[brand.origin_country]}</span>
          )}
          {brand.name}
        </Link>
        <span className="text-brand-charcoal-600">·</span>
        <span className="text-brand-charcoal-500 text-xs">
          {COUNTRY_NAMES_RU[brand.origin_country]}
        </span>
      </div>

      {/* Name */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-heading text-white leading-tight">
          {product.name_ru}
        </h1>
        {product.name_en && (
          <p className="text-brand-charcoal-500 text-sm mt-1">{product.name_en}</p>
        )}
      </div>

      {/* Badges */}
      <div className="flex flex-wrap gap-2">
        {hasDiscount && (
          <span className="px-2.5 py-1 rounded-lg bg-brand-pink-500 text-white text-sm font-semibold">
            −{discountPercent}%
          </span>
        )}
        {product.is_featured && (
          <span className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/15 text-white text-sm font-medium">
            🔥 Хит
          </span>
        )}
        {product.routine_step != null && KBEAUTY_ROUTINE_STEPS[product.routine_step] && (
          <span className="px-2.5 py-1 rounded-lg bg-brand-black-700 border border-brand-black-500 text-brand-charcoal-300 text-xs">
            Шаг {product.routine_step}: {KBEAUTY_ROUTINE_STEPS[product.routine_step].name}
          </span>
        )}
      </div>

      {/* Price */}
      <PriceDisplay
        price={v?.price_rub ?? 0}
        salePrice={v?.sale_price_rub}
        size="lg"
      />

      {/* Variant selector */}
      {variants.length > 1 && (
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
                {variant.name_ru}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Stock */}
      <div className="flex items-center gap-2">
        <div className={cn('w-2 h-2 rounded-full flex-shrink-0', inStock ? 'bg-green-500' : 'bg-red-500')} />
        <span className={cn('text-sm', inStock ? 'text-green-400' : 'text-red-400')}>
          {v
            ? inStock
              ? `В наличии${v.stock < 10 ? ` (осталось ${v.stock} шт.)` : ''}`
              : 'Нет в наличии'
            : 'Нет вариантов'}
        </span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleAddToCart}
          disabled={!inStock || !v}
          className={cn(
            'flex-1 flex items-center justify-center gap-2.5',
            'py-3.5 px-6 rounded-xl font-semibold text-base',
            'transition-all duration-200',
            inStock && v
              ? 'bg-brand-pink-500 hover:bg-brand-pink-400 active:bg-brand-pink-600 text-white'
              : 'bg-brand-black-700 text-brand-charcoal-500 cursor-not-allowed'
          )}
        >
          <ShoppingBag className="w-5 h-5 flex-shrink-0" />
          В корзину
        </button>
        <WishlistButton
          productId={product.id}
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
          { icon: RotateCcw,  label: 'Возврат',   sub: '14 дней'   },
          { icon: Shield,     label: 'Оригинал',  sub: 'гарантия'  },
        ].map(({ icon: Icon, label, sub }) => (
          <div key={label} className="flex flex-col items-center gap-1 text-center">
            <Icon className="w-5 h-5 text-brand-charcoal-400" />
            <span className="text-white text-xs font-medium">{label}</span>
            <span className="text-brand-charcoal-500 text-xs">{sub}</span>
          </div>
        ))}
      </div>

      {/* Skin types */}
      {product.skin_types && product.skin_types.length > 0 && (
        <div>
          <p className="text-brand-charcoal-400 text-xs mb-2 font-medium uppercase tracking-wider">
            Тип кожи
          </p>
          <div className="flex flex-wrap gap-1.5">
            {product.skin_types.map((st) => (
              <span
                key={st}
                className="px-2.5 py-1 rounded-lg bg-brand-black-700 border border-brand-black-500 text-brand-charcoal-300 text-xs"
              >
                {SKIN_TYPE_LABELS[st]}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Description + Ingredients tabs ───────────────────────────────────────────

type Tab = 'description' | 'ingredients';

function ProductDetails({ product }: { product: ProductWithRelations }) {
  const hasDescription = !!product.description_ru;
  const hasIngredients = product.ingredients.length > 0;

  const [tab, setTab] = useState<Tab>(hasDescription ? 'description' : 'ingredients');

  if (!hasDescription && !hasIngredients) return null;

  const highlighted = product.ingredients.filter((i) => i.is_highlighted);

  return (
    <section className="mt-12 border-t border-brand-black-600 pt-10">

      {/* Tabs */}
      <div className="flex gap-6 border-b border-brand-black-600 mb-8">
        {hasDescription && (
          <TabButton active={tab === 'description'} onClick={() => setTab('description')}>
            Описание
          </TabButton>
        )}
        {hasIngredients && (
          <TabButton active={tab === 'ingredients'} onClick={() => setTab('ingredients')}>
            Состав ({product.ingredients.length})
          </TabButton>
        )}
      </div>

      {/* Description */}
      {tab === 'description' && hasDescription && (
        <div className="max-w-2xl">
          <p className="text-brand-charcoal-300 leading-relaxed whitespace-pre-line">
            {product.description_ru}
          </p>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-6">
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
        </div>
      )}

      {/* Ingredients */}
      {tab === 'ingredients' && hasIngredients && (
        <div>
          {/* Key (highlighted) ingredients */}
          {highlighted.length > 0 && (
            <div className="mb-8">
              <p className="text-white text-sm font-semibold mb-4">✨ Ключевые ингредиенты</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {highlighted.map((ing) => (
                  <div
                    key={ing.id}
                    className="p-4 rounded-2xl bg-brand-black-800 border border-brand-black-600 hover:border-brand-pink-500/30 transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-white text-sm font-medium truncate">{ing.name_ru}</p>
                        <p className="text-brand-charcoal-500 text-xs mt-0.5 truncate">{ing.inci_name}</p>
                      </div>
                      {ing.safety_rating !== null && (
                        <SafetyBadge rating={ing.safety_rating} />
                      )}
                    </div>
                    {ing.purpose_ru && (
                      <p className="text-brand-charcoal-400 text-xs mt-2 leading-relaxed">
                        {ing.purpose_ru}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Full INCI */}
          <div>
            <p className="text-brand-charcoal-400 text-xs font-medium uppercase tracking-wider mb-3">
              Полный состав (INCI)
            </p>
            <p className="text-brand-charcoal-300 text-sm leading-relaxed">
              {product.ingredients.map((ing) => ing.inci_name).join(', ')}
            </p>
          </div>
        </div>
      )}
    </section>
  );
}

// ── Tab button ────────────────────────────────────────────────────────────────

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'pb-3 text-sm font-medium transition-colors border-b-2 -mb-px',
        active
          ? 'text-white border-brand-pink-500'
          : 'text-brand-charcoal-400 border-transparent hover:text-white'
      )}
    >
      {children}
    </button>
  );
}

// ── Safety badge (EWG-style 1-10) ─────────────────────────────────────────────

function SafetyBadge({ rating }: { rating: number }) {
  const cls =
    rating <= 3
      ? 'bg-green-500/20 text-green-400 border-green-500/30'
      : rating <= 6
      ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
      : 'bg-red-500/20 text-red-400 border-red-500/30';

  return (
    <span className={cn('flex-shrink-0 px-1.5 py-0.5 rounded text-xs font-semibold border', cls)}>
      {rating}/10
    </span>
  );
}

// ── Related products ──────────────────────────────────────────────────────────

function RelatedProducts({ productId }: { productId: string }) {
  const { data: related, isLoading } = useQuery({
    queryKey: queryKeys.products.related(productId),
    queryFn:  () => getRelatedProducts(supabaseBrowser, productId, 4),
    enabled:  !!productId,
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
        <p className="text-6xl mb-4">😕</p>
        <h1 className="text-2xl font-heading text-white mb-2">Товар не найден</h1>
        <p className="text-brand-charcoal-400 mb-6">
          Возможно, он был удалён или ссылка неверная
        </p>
        <Button href="/catalog">Перейти в каталог</Button>
      </div>
    </div>
  );
}
