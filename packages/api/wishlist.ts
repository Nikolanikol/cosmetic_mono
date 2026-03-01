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
    } as unknown as ProductWithDefaultVariant;
  });
}
