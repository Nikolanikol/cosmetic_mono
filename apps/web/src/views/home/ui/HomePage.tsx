'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ArrowRight, Sparkles, FlaskConical, Zap } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ProductCard, ProductCardSkeleton } from '@/widgets/product-card/ui/ProductCard';
import { getFeaturedProducts, getCategories } from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/api/queryClient';
import type { Category } from '@packages/types';

// ============================================================================
// Main
// ============================================================================

export function HomePage() {
  return (
    <div className="min-h-screen bg-brand-black-900">
      <HeroSection />
      <CategoriesSection />
      <FeaturedProductsSection />
      <QuizCTASection />
    </div>
  );
}

// ============================================================================
// Hero
// ============================================================================

function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-brand-black-900 via-brand-black-800 to-brand-black-900" />
      <div className="absolute inset-0 bg-gradient-to-r from-brand-pink-500/5 via-transparent to-brand-pink-500/10" />

      {/* Decorative blobs */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-brand-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-brand-pink-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/4" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28 lg:py-36">
        <div className="max-w-2xl">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-brand-pink-500/10 border border-brand-pink-500/20 rounded-full mb-6">
            <Sparkles className="w-3.5 h-3.5 text-brand-pink-400" />
            <span className="text-xs text-brand-pink-300 font-medium tracking-wide">
              Корейская и европейская косметика
            </span>
          </div>

          {/* Heading */}
          <h1 className="font-heading text-4xl sm:text-5xl lg:text-6xl text-white leading-tight mb-6">
            Ваша идеальная
            <br />
            <span className="text-gradient-pink">уходовая рутина</span>
          </h1>

          <p className="text-brand-charcoal-300 text-lg leading-relaxed mb-10 max-w-lg">
            Подбираем косметику под ваш тип кожи. Проверенные бренды, честные составы,
            быстрая доставка по России.
          </p>

          {/* CTAs */}
          <div className="flex flex-wrap gap-4">
            <Button href="/catalog" size="lg">
              Перейти в каталог
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <Button href="/quiz" variant="outline" size="lg">
              <FlaskConical className="w-4 h-4 mr-2" />
              Определить тип кожи
            </Button>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12 pt-8 border-t border-brand-black-600">
            {[
              { value: '500+', label: 'Товаров' },
              { value: '50+', label: 'Брендов' },
              { value: '10K+', label: 'Довольных покупателей' },
            ].map(({ value, label }) => (
              <div key={label}>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-sm text-brand-charcoal-400 mt-0.5">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Categories
// ============================================================================

function CategoriesSection() {
  const { data: categories, isLoading } = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => getCategories(supabaseBrowser),
  });

  // Show only root categories (no parent)
  const rootCategories = (categories || [])
    .filter((c) => !c.parent_id)
    .sort((a, b) => a.sort_order - b.sort_order)
    .slice(0, 6);

  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <SectionHeader
        title="Категории"
        subtitle="Найдите нужный уход"
        href="/catalog"
        linkLabel="Весь каталог"
      />

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mt-8">
        {isLoading
          ? Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-[2px]" />
            ))
          : rootCategories.length > 0
          ? rootCategories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))
          : FALLBACK_CATEGORIES.map((cat) => (
              <FallbackCategoryCard key={cat.slug} {...cat} />
            ))}
      </div>
    </section>
  );
}

function CategoryCard({ category }: { category: Category }) {
  return (
    <Link
      href={`/catalog?category=${category.slug}`}
      className={cn(
        'group flex flex-col items-center justify-center gap-2',
        'h-24 px-3 rounded-[2px] border border-brand-black-600',
        'bg-brand-black-800 hover:bg-brand-black-700',
        'hover:border-brand-pink-500/40 transition-all duration-200',
        'text-center'
      )}
    >
      <span className="text-2xl">{getCategoryEmoji(category.slug)}</span>
      <span className="text-xs text-brand-charcoal-300 group-hover:text-white transition-colors leading-tight">
        {category.name_ru}
      </span>
    </Link>
  );
}

function FallbackCategoryCard({
  emoji,
  label,
  slug,
}: {
  emoji: string;
  label: string;
  slug: string;
}) {
  return (
    <Link
      href={`/catalog?category=${slug}`}
      className={cn(
        'group flex flex-col items-center justify-center gap-2',
        'h-24 px-3 rounded-[2px] border border-brand-black-600',
        'bg-brand-black-800 hover:bg-brand-black-700',
        'hover:border-brand-pink-500/40 transition-all duration-200',
        'text-center'
      )}
    >
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs text-brand-charcoal-300 group-hover:text-white transition-colors leading-tight">
        {label}
      </span>
    </Link>
  );
}

const FALLBACK_CATEGORIES = [
  { slug: 'face-care', emoji: '✨', label: 'Уход за лицом' },
  { slug: 'cleansing', emoji: '🫧', label: 'Очищение' },
  { slug: 'serums', emoji: '💧', label: 'Сыворотки' },
  { slug: 'moisturizers', emoji: '🧴', label: 'Увлажнение' },
  { slug: 'masks', emoji: '🩹', label: 'Маски' },
  { slug: 'spf', emoji: '☀️', label: 'Солнцезащита' },
];

function getCategoryEmoji(slug: string): string {
  const map: Record<string, string> = {
    'face-care': '✨',
    'skin-care': '✨',
    cleansing: '🫧',
    toners: '💦',
    serums: '💧',
    moisturizers: '🧴',
    masks: '🩹',
    'eye-care': '👁️',
    spf: '☀️',
    'sun-care': '☀️',
    'body-care': '🛁',
    makeup: '💄',
    'lip-care': '💋',
    hair: '💆',
  };
  return map[slug] ?? '🌿';
}

// ============================================================================
// Featured Products
// ============================================================================

function FeaturedProductsSection() {
  const { data: products, isLoading } = useQuery({
    queryKey: queryKeys.products.featured(),
    queryFn: () => getFeaturedProducts(supabaseBrowser, 8),
  });

  if (!isLoading && (!products || products.length === 0)) {
    return null;
  }

  return (
    <section className="bg-brand-black-800 border-y border-brand-black-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <SectionHeader
          title="Хиты продаж"
          subtitle="Самые популярные товары"
          href="/catalog?sort=popular"
          linkLabel="Смотреть все"
        />

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

// ============================================================================
// Quiz CTA
// ============================================================================

function QuizCTASection() {
  return (
    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
      <div className="relative overflow-hidden rounded-[2px] bg-gradient-to-r from-brand-black-700 to-brand-black-800 border border-brand-black-600 p-8 sm:p-12">
        {/* Decorative */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-pink-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-pink-500/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/4" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 flex-shrink-0 rounded-full bg-brand-pink-500/10 border border-brand-pink-500/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-brand-pink-400" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-heading text-white mb-2">
                Не знаете свой тип кожи?
              </h2>
              <p className="text-brand-charcoal-300 text-sm sm:text-base max-w-md">
                Пройдите быстрый тест — и мы подберём уходовую рутину именно для вас.
                Займёт меньше 2 минут.
              </p>
            </div>
          </div>
          <Button href="/quiz" size="lg" className="flex-shrink-0">
            Пройти тест
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function SectionHeader({
  title,
  subtitle,
  href,
  linkLabel,
}: {
  title: string;
  subtitle: string;
  href: string;
  linkLabel: string;
}) {
  return (
    <div className="flex items-end justify-between">
      <div>
        <p className="text-xs text-brand-pink-400 font-medium tracking-widest uppercase mb-1">
          {subtitle}
        </p>
        <h2 className="text-2xl sm:text-3xl font-heading text-white">{title}</h2>
      </div>
      <Link
        href={href}
        className="hidden sm:flex items-center gap-1.5 text-sm text-brand-charcoal-300 hover:text-brand-pink-400 transition-colors"
      >
        {linkLabel}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
