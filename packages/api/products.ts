/**
 * Product API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Product,
  ProductInsert,
  ProductUpdate,
  ProductWithRelations,
  ProductWithDefaultVariant,
  ProductVariant,
  ProductVariantInsert,
  ProductVariantUpdate,
  ProductImage,
  ProductIngredient,
  Category,
  CategoryInsert,
  CategoryWithChildren,
  ProductFilters,
  ProductSortOption,
  PaginatedProducts,
  ProductTag,
  Brand,
} from '../types';
import type { SkinType } from '../types/user';

// ============================================================================
// Shared helpers
// ============================================================================

/** Supabase select string for product list queries (includes all required fields) */
const PRODUCT_LIST_SELECT = `
  id,
  name_ru,
  name_en,
  slug,
  description_ru,
  category_id,
  brand_id,
  is_active,
  is_featured,
  routine_step,
  skin_types,
  tags,
  meta_title_ru,
  meta_description_ru,
  created_at,
  brand:brands!inner(id, name, slug, origin_country),
  category:categories!inner(id, name_ru, name_en, slug, parent_id, image_url, sort_order, created_at),
  variants:product_variants(id, sku, name_ru, price_rub, sale_price_rub, stock, attributes),
  images:product_images(id, url, alt_ru, is_primary, sort_order)
`;

/** Transform raw Supabase row into a typed ProductWithDefaultVariant */
function transformProductItem(item: Record<string, unknown>): ProductWithDefaultVariant {
  const variants = (item.variants as ProductVariant[]) || [];
  const images = (item.images as ProductImage[]) || [];
  return {
    id: item.id as string,
    name_ru: item.name_ru as string,
    name_en: item.name_en as string,
    slug: item.slug as string,
    description_ru: (item.description_ru as string | null) ?? null,
    category_id: item.category_id as string,
    brand_id: item.brand_id as string,
    is_active: item.is_active as boolean,
    is_featured: item.is_featured as boolean,
    routine_step: item.routine_step as number | null,
    skin_types: (item.skin_types as SkinType[]) || [],
    tags: (item.tags as ProductTag[]) || [],
    meta_title_ru: (item.meta_title_ru as string | null) ?? null,
    meta_description_ru: (item.meta_description_ru as string | null) ?? null,
    created_at: item.created_at as string,
    brand: item.brand as Brand,
    category: item.category as Category,
    default_variant: variants[0] || null,
    primary_image: images.find((img) => img.is_primary) || images[0] || null,
    average_rating: 0,
    review_count: 0,
  };
}

// ============================================================================
// Product Queries
// ============================================================================

/**
 * Get products with filters, sorting, and pagination
 */
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
    .select(
      `
      id,
      name_ru,
      name_en,
      slug,
      description_ru,
      category_id,
      brand_id,
      is_active,
      is_featured,
      routine_step,
      skin_types,
      tags,
      meta_title_ru,
      meta_description_ru,
      created_at,
      brand:brands!inner(id, name, slug, origin_country),
      category:categories!inner(id, name_ru, name_en, slug, parent_id, image_url, sort_order, created_at),
      variants:product_variants(id, sku, name_ru, price_rub, sale_price_rub, stock, attributes),
      images:product_images(id, url, alt_ru, is_primary, sort_order)
    `,
      { count: 'exact' }
    )
    .eq('is_active', true);

  // Apply filters
  if (filters.category) {
    query = query.eq('category.slug', filters.category);
  }

  if (filters.brand && filters.brand.length > 0) {
    query = query.in('brand.slug', filters.brand);
  }

  if (filters.origin_country && filters.origin_country.length > 0) {
    query = query.in('brand.origin_country', filters.origin_country);
  }

  if (filters.skin_type) {
    query = query.contains('skin_types', [filters.skin_type]);
  }

  if (filters.tags && filters.tags.length > 0) {
    query = query.overlaps('tags', filters.tags);
  }

  if (filters.sale_only) {
    query = query.not('variants.sale_price_rub', 'is', null);
  }

  if (filters.search) {
    query = query.or(
      `name_ru.ilike.%${filters.search}%,name_en.ilike.%${filters.search}%,description_ru.ilike.%${filters.search}%`
    );
  }

  // Apply sorting
  switch (sort) {
    case 'price_asc':
      query = query.order('variants(price_rub)', { ascending: true });
      break;
    case 'price_desc':
      query = query.order('variants(price_rub)', { ascending: false });
      break;
    case 'newest':
      query = query.order('created_at', { ascending: false });
      break;
    case 'rating':
      // Rating sort requires a separate query or materialized view
      query = query.order('created_at', { ascending: false });
      break;
    case 'popular':
    default:
      query = query.order('is_featured', { ascending: false });
      break;
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch products: ${error.message}`);
  }

  // Transform data to ProductWithDefaultVariant format
  const products: ProductWithDefaultVariant[] = (data || []).map((item: Record<string, unknown>) =>
    transformProductItem(item)
  );

  // Post-filter by price if needed
  let filteredProducts = products;
  if (filters.price_min !== undefined || filters.price_max !== undefined) {
    filteredProducts = products.filter((p) => {
      const price = p.default_variant?.sale_price_rub ?? p.default_variant?.price_rub ?? 0;
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

/**
 * Get a single product by slug with all relations
 */
export async function getProductBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*),
      ingredients:product_ingredients(*)
    `
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data as unknown as ProductWithRelations;
}

/**
 * Get a single product by ID
 */
export async function getProductById(
  supabase: SupabaseClient,
  id: string
): Promise<ProductWithRelations | null> {
  const { data, error } = await supabase
    .from('products')
    .select(
      `
      *,
      brand:brands(*),
      category:categories(*),
      variants:product_variants(*),
      images:product_images(*),
      ingredients:product_ingredients(*)
    `
    )
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch product: ${error.message}`);
  }

  return data as unknown as ProductWithRelations;
}

/**
 * Get featured products
 */
export async function getFeaturedProducts(
  supabase: SupabaseClient,
  limit: number = 8
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .eq('is_featured', true)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

/**
 * Get related products (same brand or same category)
 */
export async function getRelatedProducts(
  supabase: SupabaseClient,
  productId: string,
  limit: number = 4
): Promise<ProductWithDefaultVariant[]> {
  // First get the product to find its brand and category
  const { data: product } = await supabase
    .from('products')
    .select('brand_id, category_id')
    .eq('id', productId)
    .single();

  if (!product) {
    return [];
  }

  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .neq('id', productId)
    .or(`brand_id.eq.${product.brand_id},category_id.eq.${product.category_id}`)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch related products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

/**
 * Get products for K-beauty routine step
 */
export async function getProductsByRoutineStep(
  supabase: SupabaseClient,
  step: number,
  limit: number = 8
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .eq('routine_step', step)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch routine products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

/**
 * Search products
 */
export async function searchProducts(
  supabase: SupabaseClient,
  query: string,
  limit: number = 10
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('products')
    .select(PRODUCT_LIST_SELECT)
    .eq('is_active', true)
    .or(
      `name_ru.ilike.%${query}%,name_en.ilike.%${query}%,description_ru.ilike.%${query}%`
    )
    .limit(limit);

  if (error) {
    throw new Error(`Failed to search products: ${error.message}`);
  }

  return (data || []).map((item: Record<string, unknown>) => transformProductItem(item));
}

// ============================================================================
// Product Mutations (Admin)
// ============================================================================

/**
 * Create a new product
 */
export async function createProduct(
  supabase: SupabaseClient,
  product: ProductInsert
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .insert(product)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create product: ${error.message}`);
  }

  return data as Product;
}

/**
 * Update a product
 */
export async function updateProduct(
  supabase: SupabaseClient,
  id: string,
  product: ProductUpdate
): Promise<Product> {
  const { data, error } = await supabase
    .from('products')
    .update(product)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update product: ${error.message}`);
  }

  return data as Product;
}

/**
 * Delete a product
 */
export async function deleteProduct(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('products').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete product: ${error.message}`);
  }
}

// ============================================================================
// Product Variant Queries
// ============================================================================

/**
 * Get product variants
 */
export async function getProductVariants(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductVariant[]> {
  const { data, error } = await supabase
    .from('product_variants')
    .select('*')
    .eq('product_id', productId)
    .order('price_rub', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch variants: ${error.message}`);
  }

  return (data || []) as ProductVariant[];
}

/**
 * Create a product variant
 */
export async function createProductVariant(
  supabase: SupabaseClient,
  variant: ProductVariantInsert
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from('product_variants')
    .insert(variant)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create variant: ${error.message}`);
  }

  return data as ProductVariant;
}

/**
 * Update a product variant
 */
export async function updateProductVariant(
  supabase: SupabaseClient,
  id: string,
  variant: ProductVariantUpdate
): Promise<ProductVariant> {
  const { data, error } = await supabase
    .from('product_variants')
    .update(variant)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update variant: ${error.message}`);
  }

  return data as ProductVariant;
}

/**
 * Delete a product variant
 */
export async function deleteProductVariant(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('product_variants').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete variant: ${error.message}`);
  }
}

// ============================================================================
// Category Queries
// ============================================================================

/**
 * Get all categories
 */
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

/**
 * Get category tree (parent with children)
 */
export async function getCategoryTree(
  supabase: SupabaseClient
): Promise<CategoryWithChildren[]> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch categories: ${error.message}`);
  }

  const categories = (data || []) as Category[];
  const categoryMap = new Map<string, CategoryWithChildren>();

  // Initialize all categories with empty children
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] });
  });

  // Build tree
  const rootCategories: CategoryWithChildren[] = [];
  categories.forEach((cat) => {
    const categoryWithChildren = categoryMap.get(cat.id)!;
    if (cat.parent_id) {
      const parent = categoryMap.get(cat.parent_id);
      if (parent) {
        parent.children.push(categoryWithChildren);
      }
    } else {
      rootCategories.push(categoryWithChildren);
    }
  });

  return rootCategories;
}

/**
 * Get category by slug
 */
export async function getCategoryBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Category | null> {
  const { data, error } = await supabase
    .from('categories')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch category: ${error.message}`);
  }

  return data as Category;
}

/**
 * Create a category
 */
export async function createCategory(
  supabase: SupabaseClient,
  category: CategoryInsert
): Promise<Category> {
  const { data, error } = await supabase
    .from('categories')
    .insert(category)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create category: ${error.message}`);
  }

  return data as Category;
}

// ============================================================================
// Product Image Queries
// ============================================================================

/**
 * Get product images
 */
export async function getProductImages(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductImage[]> {
  const { data, error } = await supabase
    .from('product_images')
    .select('*')
    .eq('product_id', productId)
    .order('sort_order', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch images: ${error.message}`);
  }

  return (data || []) as ProductImage[];
}

/**
 * Create a product image
 */
export async function createProductImage(
  supabase: SupabaseClient,
  image: Omit<ProductImage, 'id' | 'created_at'>
): Promise<ProductImage> {
  const { data, error } = await supabase
    .from('product_images')
    .insert(image)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create image: ${error.message}`);
  }

  return data as ProductImage;
}

// ============================================================================
// Product Ingredient Queries
// ============================================================================

/**
 * Get product ingredients
 */
export async function getProductIngredients(
  supabase: SupabaseClient,
  productId: string
): Promise<ProductIngredient[]> {
  const { data, error } = await supabase
    .from('product_ingredients')
    .select('*')
    .eq('product_id', productId)
    .order('is_highlighted', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch ingredients: ${error.message}`);
  }

  return (data || []) as ProductIngredient[];
}

/**
 * Create a product ingredient
 */
export async function createProductIngredient(
  supabase: SupabaseClient,
  ingredient: Omit<ProductIngredient, 'id' | 'created_at'>
): Promise<ProductIngredient> {
  const { data, error } = await supabase
    .from('product_ingredients')
    .insert(ingredient)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create ingredient: ${error.message}`);
  }

  return data as ProductIngredient;
}
