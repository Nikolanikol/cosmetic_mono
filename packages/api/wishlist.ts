/**
 * Wishlist API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ProductWithDefaultVariant,
  ProductVariant,
  ProductImage,
  Category,
  Brand,
  ProductTag,
} from '../types';
import type { SkinType } from '../types/user';

const WISHLIST_PRODUCT_SELECT = `
  product:products!inner(
    id,
    name,
    slug,
    description,
    category_id,
    brand_id,
    is_active,
    is_featured,
    routine_step,
    skin_types,
    tags,
    meta_title,
    meta_description,
    created_at,
    brand:brands!inner(id, name, slug, origin_country),
    category:categories!inner(id, name, slug, parent_id, image_url, sort_order, created_at),
    variants:product_variants(id, sku, name, price_rub, sale_price_rub, stock, attributes),
    images:product_images(id, url, alt, is_primary, sort_order)
  )
`;

/**
 * Get all wishlist products for the authenticated user
 */
export async function getWishlistProducts(
  supabase: SupabaseClient,
  userId: string
): Promise<ProductWithDefaultVariant[]> {
  const { data, error } = await supabase
    .from('wishlists')
    .select(WISHLIST_PRODUCT_SELECT)
    .eq('user_id', userId);

  if (error) throw error;
  if (!data) return [];

  return data.map((row) => {
    const item = row.product as unknown as Record<string, unknown>;
    const variants = (item.variants as ProductVariant[]) || [];
    const images = (item.images as ProductImage[]) || [];

    return {
      id: item.id as string,
      name: item.name as string,
      slug: item.slug as string,
      description: (item.description as string | null) ?? null,
      category_id: item.category_id as string,
      brand_id: item.brand_id as string,
      is_active: item.is_active as boolean,
      is_featured: item.is_featured as boolean,
      routine_step: item.routine_step as number | null,
      skin_types: (item.skin_types as SkinType[]) || [],
      tags: (item.tags as ProductTag[]) || [],
      meta_title: (item.meta_title as string | null) ?? null,
      meta_description: (item.meta_description as string | null) ?? null,
      created_at: item.created_at as string,
      brand: item.brand as Brand,
      category: item.category as Category,
      default_variant: variants[0] || null,
      primary_image: images.find((img) => img.is_primary) || images[0] || null,
      average_rating: 0,
      review_count: 0,
    } as unknown as ProductWithDefaultVariant;
  });
}
