import type { Metadata } from 'next';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProducts, getCategories } from '@packages/api/products';
import { getBrands } from '@packages/api/brands';
import { CatalogPage } from '@/views/catalog/ui/CatalogPage';
import type { ProductFilters, ProductSortOption, PaginatedProducts } from '@packages/types';
import type { Category, Brand } from '@packages/types';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://axis-beauty.com';

export const metadata: Metadata = {
  title: 'Catalog — Korean & European Skincare',
  description:
    'Browse 500+ authentic Korean and European cosmetics. Filter by brand, category, and price. COSRX, SKIN1004, Torriden, TIRTIR, Medicube and more.',
  openGraph: {
    title: 'Catalog — K&E Beauty',
    description: 'Browse 500+ authentic Korean and European cosmetics.',
    url: `${APP_URL}/en/catalog`,
  },
  alternates: {
    canonical: `${APP_URL}/en/catalog`,
  },
};

interface CatalogRouteProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function parseFilters(params: Record<string, string | string[] | undefined>): ProductFilters {
  const filters: ProductFilters = {};

  const category = typeof params.category === 'string' ? params.category : undefined;
  if (category) filters.category = category;

  const brand = typeof params.brand === 'string' ? params.brand : undefined;
  if (brand) filters.brand = brand.split(',');

  const priceMin = typeof params.price_min === 'string' ? params.price_min : undefined;
  if (priceMin) filters.price_min = parseInt(priceMin, 10);

  const priceMax = typeof params.price_max === 'string' ? params.price_max : undefined;
  if (priceMax) filters.price_max = parseInt(priceMax, 10);

  const search = typeof params.search === 'string' ? params.search : undefined;
  if (search) filters.search = search;

  return filters;
}

export default async function Catalog({ searchParams }: CatalogRouteProps) {
  const params = await searchParams;
  const filters = parseFilters(params);
  const sort = (typeof params.sort === 'string' ? params.sort : 'popular') as ProductSortOption;
  const page = typeof params.page === 'string' ? parseInt(params.page, 10) : 1;

  const supabase = getSupabaseServiceClient();

  const [productsResult, categoriesResult, brandsResult] = await Promise.allSettled([
    getProducts(supabase, { filters, sort, page, limit: 24 }),
    getCategories(supabase),
    getBrands(supabase),
  ]);

  const initialProducts: PaginatedProducts = productsResult.status === 'fulfilled'
    ? productsResult.value
    : { products: [], total: 0, page: 1, total_pages: 1 };

  const initialCategories: Category[] = categoriesResult.status === 'fulfilled'
    ? categoriesResult.value
    : [];

  const initialBrands: Brand[] = brandsResult.status === 'fulfilled'
    ? brandsResult.value
    : [];

  return (
    <CatalogPage
      initialProducts={initialProducts}
      initialCategories={initialCategories}
      initialBrands={initialBrands}
    />
  );
}
