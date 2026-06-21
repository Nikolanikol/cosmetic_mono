import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductWithDefaultVariant,
  ProductWithDetails,
  ProductVariant,
  ProductImage,
  Category,
  ProductFilters,
  ProductSortOption,
  PaginatedProducts,
  Brand,
} from '../types';

const PRODUCT_LIST_SELECT = `
  *,
  brand:brands!inner(*),
  category:categories!inner(*),
  variants:product_variants(*),
  images:product_images(*)
`;

const PRODUCT_DETAIL_SELECT = `
  *,
  brand:brands!inner(*),
  category:categories!inner(*),
  variants:product_variants(*),
  images:product_images(*),
  tags:product_tags(tag)
`;

function transformProductItem(item: Record<string, unknown>): ProductWithDefaultVariant {
  const variants = (item.variants as ProductVariant[]) || [];
  const images = (item.images as ProductImage[]) || [];
  return {
    id: item.id as number,
    name: item.name as string,
    slug: item.slug as string,
    description: (item.description as string | null) ?? null,
    category_id: item.category_id as number,
    brand_id: item.brand_id as number,
    is_active: item.is_active as boolean,
    created_at: item.created_at as string,
    updated_at: item.updated_at as string,
    brand: item.brand as Brand,
    category: item.category as Category,
    default_variant: variants[0] || null,
    primary_image: images.find((img) => img.is_primary) || images[0] || null,
  };
}

export async function getProducts(
  supabase: SupabaseClient,
  params: {
    filters?: ProductFilters;
    sort?: ProductSortOption;
    page?: number;
    limit?: number;
  } = {}
): Promise<PaginatedProducts> {
  const { filters = {}, sort = 'popular', page = 1, limit = 24 } = params;

  let query = supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT, { count: 'exact' })
    .eq('is_active', true);

  if (filters.category) {
    query = query.eq('category.slug', filters.category);
  }

  if (filters.brand && filters.brand.length > 0) {
    query = query.in('brand.slug', filters.brand);
  }

  if (filters.search) {
    query = query.or(
      `name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`
    );
  }

  switch (sort) {
    case 'price_asc':
      query = query.order('created_at', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('created_at', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('created_at', { ascending: false });
      break;
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  const products: ProductWithDefaultVariant[] = (data || []).map(
    (item: Record<string, unknown>) => transformProductItem(item)
  );

  let filteredProducts = products;
  if (filters.price_min !== undefined || filters.price_max !== undefined) {
    filteredProducts = products.filter((p) => {
      const price = p.default_variant?.price ?? 0;
      if (filters.price_min !== undefined && price < filters.price_min) return false;
      if (filters.price_max !== undefined && price > filters.price_max) return false;
      return true;
    });
  }

  return {
    products: filteredProducts,
    total: count || 0,
    page,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

export async function getProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ProductWithDetails | null> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_DETAIL_SELECT)
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  const raw = data as Record<string, unknown>;
  const tagRows = (raw.tags as { tag: string }[]) || [];
  return {
    ...raw,
    tags: tagRows.map((t) => t.tag),
  } as unknown as ProductWithDetails;
}

export async function getRelatedProducts(
  supabase: SupabaseClient,
  productId: number,
  categoryId: number,
  limit: number = 4
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .eq('category_id', categoryId)
    .neq('id', productId)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch related products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

export async function getCategories(supabase: SupabaseClient): Promise<Category[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  return (data || []) as Category[];
}

export async function getFeaturedProducts(
  supabase: SupabaseClient,
  limit: number = 8
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

export async function searchProducts(
  supabase: SupabaseClient,
  query: string,
  limit: number = 10
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

export async function createProductImage(_supabase: SupabaseClient, _productId: number, _image: Record<string, unknown>) { return null; }
export async function createProductIngredient(_supabase: SupabaseClient, _productId: number, _ingredient: Record<string, unknown>) { return null; }
export async function deleteProduct(_supabase: SupabaseClient, _id: number) { return null; }
