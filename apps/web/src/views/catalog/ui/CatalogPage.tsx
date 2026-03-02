/**
 * Catalog Page
 * Full implementation with filters, sorting, and product grid
 */

'use client';

import { useState, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { SlidersHorizontal, Grid3X3, LayoutList, ChevronDown } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Button } from '@/shared/ui/Button';
import { Skeleton } from '@/shared/ui/Skeleton';
import { ProductCard, ProductCardSkeleton, ProductCardGridSkeleton } from '@/widgets/product-card/ui/ProductCard';
import { FiltersSidebar } from '@/widgets/filters-sidebar/ui/FiltersSidebar';
import { getProducts, getCategories } from '@packages/api/products';
import { getBrands } from '@packages/api/brands';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { queryKeys } from '@/shared/api/queryClient';
import type { ProductFilters, ProductSortOption } from '@packages/types';

// ============================================================================
// Constants
// ============================================================================

const SORT_OPTIONS: { value: ProductSortOption; label: string }[] = [
  { value: 'popular', label: 'Популярное' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
  { value: 'newest', label: 'Новинки' },
  { value: 'rating', label: 'По рейтингу' },
];

const PRODUCTS_PER_PAGE = 24;

// ============================================================================
// Main Component
// ============================================================================

export function CatalogPage() {
  return (
    <Suspense fallback={<CatalogPageSkeleton />}>
      <CatalogPageContent />
    </Suspense>
  );
}

// ============================================================================
// Content Component
// ============================================================================

function CatalogPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams() ?? new URLSearchParams();

  // UI State
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Parse filters from URL
  const filters = parseFiltersFromURL(searchParams);
  const sort = (searchParams.get('sort') as ProductSortOption) || 'popular';
  const page = parseInt(searchParams.get('page') || '1', 10);

  // Fetch data
  const { data: productsData, isLoading: isProductsLoading } = useQuery({
    queryKey: queryKeys.products.lists({ filters, sort, page }),
    queryFn: () =>
      getProducts(supabaseBrowser, {
        filters,
        sort,
        page,
        limit: PRODUCTS_PER_PAGE,
      }),
  });

  const { data: categories } = useQuery({
    queryKey: queryKeys.categories.lists(),
    queryFn: () => getCategories(supabaseBrowser),
  });

  const { data: brands } = useQuery({
    queryKey: queryKeys.brands.lists(),
    queryFn: () => getBrands(supabaseBrowser),
  });

  // Update URL with filters
  const updateFilters = useCallback(
    (newFilters: ProductFilters) => {
      const params = new URLSearchParams(searchParams);

      // Update filter params
      Object.entries(newFilters).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') {
          params.delete(key);
        } else if (Array.isArray(value)) {
          if (value.length === 0) {
            params.delete(key);
          } else {
            params.set(key, value.join(','));
          }
        } else {
          params.set(key, String(value));
        }
      });

      // Reset to page 1 when filters change
      params.delete('page');

      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Update sort
  const updateSort = useCallback(
    (newSort: ProductSortOption) => {
      const params = new URLSearchParams(searchParams);
      params.set('sort', newSort);
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Update page
  const updatePage = useCallback(
    (newPage: number) => {
      const params = new URLSearchParams(searchParams);
      if (newPage === 1) {
        params.delete('page');
      } else {
        params.set('page', String(newPage));
      }
      router.push(`${pathname}?${params.toString()}`);
    },
    [router, pathname, searchParams]
  );

  // Clear all filters
  const clearFilters = useCallback(() => {
    const params = new URLSearchParams();
    if (sort !== 'popular') {
      params.set('sort', sort);
    }
    router.push(`${pathname}${params.toString() ? `?${params.toString()}` : ''}`);
  }, [router, pathname, sort]);

  // Active filters count
  const activeFiltersCount = Object.values(filters).filter((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== undefined && v !== null && v !== '';
  }).length;

  const products = productsData?.products || [];
  const totalProducts = productsData?.total || 0;
  const totalPages = productsData?.total_pages || 1;

  return (
    <div className="min-h-screen bg-brand-black-900">
      {/* Header */}
      <div className="border-b border-brand-black-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <h1 className="text-2xl sm:text-3xl font-heading text-white mb-2">
            Каталог
          </h1>
          <p className="text-brand-charcoal-300">
            {totalProducts} {pluralizeProducts(totalProducts)}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Filters Sidebar - Desktop */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <FiltersSidebar
              filters={filters}
              categories={categories || []}
              brands={brands || []}
              onFilterChange={updateFilters}
              onClearFilters={clearFilters}
            />
          </aside>

          {/* Mobile Filters Drawer */}
          {isFiltersOpen && (
            <div className="lg:hidden fixed inset-0 z-50">
              <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsFiltersOpen(false)}
              />
              <div className="absolute left-0 top-0 bottom-0 w-80 bg-brand-black-800 overflow-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-medium text-white">Фильтры</h2>
                    <button
                      onClick={() => setIsFiltersOpen(false)}
                      className="text-brand-charcoal-300 hover:text-white"
                    >
                      ✕
                    </button>
                  </div>
                  <FiltersSidebar
                    filters={filters}
                    categories={categories || []}
                    brands={brands || []}
                    onFilterChange={(newFilters) => {
                      updateFilters(newFilters);
                      setIsFiltersOpen(false);
                    }}
                    onClearFilters={clearFilters}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Main Content */}
          <main className="flex-1">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 p-4 bg-brand-black-700 rounded-[2px]">
              {/* Filter Button (Mobile) */}
              <Button
                variant="outline"
                size="sm"
                className="lg:hidden"
                onClick={() => setIsFiltersOpen(true)}
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Фильтры
                {activeFiltersCount > 0 && (
                  <span className="ml-2 px-1.5 py-0.5 bg-brand-pink-500 text-white text-xs rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-2 ml-auto">
                <span className="text-sm text-brand-charcoal-300 hidden sm:inline">
                  Сортировка:
                </span>
                <div className="relative">
                  <select
                    value={sort}
                    onChange={(e) => updateSort(e.target.value as ProductSortOption)}
                    className={cn(
                      'appearance-none bg-brand-black-800 border border-brand-black-600',
                      'text-white text-sm rounded-[2px] pl-3 pr-10 py-2',
                      'focus:outline-none focus:border-brand-pink-500',
                      'cursor-pointer'
                    )}
                  >
                    {SORT_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal-500 pointer-events-none" />
                </div>

                {/* View Mode Toggle */}
                <div className="hidden sm:flex items-center border border-brand-black-600 rounded-[2px]">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'grid'
                        ? 'bg-brand-pink-500 text-white'
                        : 'text-brand-charcoal-300 hover:text-white'
                    )}
                  >
                    <Grid3X3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={cn(
                      'p-2 transition-colors',
                      viewMode === 'list'
                        ? 'bg-brand-pink-500 text-white'
                        : 'text-brand-charcoal-300 hover:text-white'
                    )}
                  >
                    <LayoutList className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters */}
            {activeFiltersCount > 0 && (
              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="text-sm text-brand-charcoal-300">Активные фильтры:</span>
                {filters.category && (
                  <FilterTag
                    label={`Категория: ${filters.category}`}
                    onRemove={() =>
                      updateFilters({ ...filters, category: undefined })
                    }
                  />
                )}
                {filters.brand && filters.brand.length > 0 && (
                  <FilterTag
                    label={`Бренды: ${filters.brand.length}`}
                    onRemove={() =>
                      updateFilters({ ...filters, brand: undefined })
                    }
                  />
                )}
                {(filters.price_min !== undefined || filters.price_max !== undefined) && (
                  <FilterTag
                    label={`Цена: ${formatPrice(filters.price_min || 0)} - ${formatPrice(
                      filters.price_max || 100000
                    )}`}
                    onRemove={() =>
                      updateFilters({
                        ...filters,
                        price_min: undefined,
                        price_max: undefined,
                      })
                    }
                  />
                )}
                <button
                  onClick={clearFilters}
                  className="text-sm text-brand-pink-500 hover:text-brand-pink-400"
                >
                  Сбросить все
                </button>
              </div>
            )}

            {/* Products Grid */}
            {isProductsLoading ? (
              <ProductCardGridSkeleton count={PRODUCTS_PER_PAGE} columns={viewMode === 'grid' ? 4 : 2} />
            ) : products.length === 0 ? (
              <EmptyState onClearFilters={clearFilters} />
            ) : (
              <>
                <div
                  className={cn(
                    'grid gap-4',
                    viewMode === 'grid'
                      ? 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-2'
                  )}
                >
                  {products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      variant="default"
                    />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Pagination
                    currentPage={page}
                    totalPages={totalPages}
                    onPageChange={updatePage}
                  />
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Helper Components
// ============================================================================

function FilterTag({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-brand-black-600 text-white text-sm rounded-[2px]">
      {label}
      <button
        onClick={onRemove}
        className="ml-1 text-brand-charcoal-300 hover:text-white"
      >
        ✕
      </button>
    </span>
  );
}

function EmptyState({ onClearFilters }: { onClearFilters: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-24 h-24 mb-6 bg-brand-black-700 rounded-full flex items-center justify-center">
        <span className="text-4xl">🔍</span>
      </div>
      <h3 className="text-xl font-medium text-white mb-2">
        Товары не найдены
      </h3>
      <p className="text-brand-charcoal-300 mb-6 max-w-md">
        Попробуйте изменить параметры фильтрации или воспользуйтесь поиском
      </p>
      <div className="flex gap-3">
        <Button onClick={onClearFilters}>Сбросить фильтры</Button>
        <Button variant="outline" href="/quiz">
          Пройти тест на тип кожи
        </Button>
      </div>
    </div>
  );
}

function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}) {
  const pages = getPaginationPages(currentPage, totalPages);

  return (
    <div className="flex items-center justify-center gap-2 mt-8">
      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        ← Назад
      </Button>

      <div className="flex items-center gap-1">
        {pages.map((page, index) =>
          page === '...' ? (
            <span key={index} className="px-3 py-2 text-brand-charcoal-500">
              ...
            </span>
          ) : (
            <button
              key={index}
              onClick={() => onPageChange(page as number)}
              className={cn(
                'px-3 py-2 text-sm rounded-[2px] transition-colors',
                currentPage === page
                  ? 'bg-brand-pink-500 text-white'
                  : 'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-700'
              )}
            >
              {page}
            </button>
          )
        )}
      </div>

      <Button
        variant="outline"
        size="sm"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Вперед →
      </Button>
    </div>
  );
}

// ============================================================================
// Skeleton
// ============================================================================

function CatalogPageSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="border-b border-brand-black-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <Skeleton className="h-10 w-48 mb-2" />
          <Skeleton className="h-5 w-32" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <div className="hidden lg:block w-64">
            <Skeleton className="h-96" />
          </div>
          <div className="flex-1">
            <Skeleton className="h-14 mb-6" />
            <ProductCardGridSkeleton count={PRODUCTS_PER_PAGE} columns={4} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Utilities
// ============================================================================

function parseFiltersFromURL(searchParams: URLSearchParams): ProductFilters {
  const filters: ProductFilters = {};

  const category = searchParams.get('category');
  if (category) filters.category = category;

  const brand = searchParams.get('brand');
  if (brand) filters.brand = brand.split(',');

  const priceMin = searchParams.get('price_min');
  if (priceMin) filters.price_min = parseInt(priceMin, 10);

  const priceMax = searchParams.get('price_max');
  if (priceMax) filters.price_max = parseInt(priceMax, 10);

  const skinType = searchParams.get('skin_type');
  if (skinType) filters.skin_type = skinType as ProductFilters['skin_type'];

  const rating = searchParams.get('rating');
  if (rating) filters.rating = parseInt(rating, 10);

  const saleOnly = searchParams.get('sale_only');
  if (saleOnly) filters.sale_only = saleOnly === 'true';

  const originCountry = searchParams.get('origin_country');
  if (originCountry) filters.origin_country = originCountry.split(',') as ProductFilters['origin_country'];

  const tags = searchParams.get('tags');
  if (tags) filters.tags = tags.split(',') as ProductFilters['tags'];

  const search = searchParams.get('search');
  if (search) filters.search = search;

  return filters;
}

function pluralizeProducts(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;

  if (mod10 === 1 && mod100 !== 11) return 'товар';
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return 'товара';
  return 'товаров';
}

function getPaginationPages(
  currentPage: number,
  totalPages: number
): (number | string)[] {
  const pages: (number | string)[] = [];

  if (totalPages <= 7) {
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }
  } else {
    pages.push(1);

    if (currentPage > 3) {
      pages.push('...');
    }

    const start = Math.max(2, currentPage - 1);
    const end = Math.min(totalPages - 1, currentPage + 1);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (currentPage < totalPages - 2) {
      pages.push('...');
    }

    pages.push(totalPages);
  }

  return pages;
}
