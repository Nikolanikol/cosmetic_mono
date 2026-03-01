/**
 * Brand API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Brand, BrandInsert, BrandUpdate, BrandWithProductCount } from '../types';

/**
 * Get all brands
 */
export async function getBrands(supabase: SupabaseClient): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  return (data || []) as Brand[];
}

/**
 * Get featured brands
 */
export async function getFeaturedBrands(
  supabase: SupabaseClient,
  limit: number = 6
): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('is_featured', true)
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch featured brands: ${error.message}`);
  }

  return (data || []) as Brand[];
}

/**
 * Get brands with product count
 */
export async function getBrandsWithProductCount(
  supabase: SupabaseClient
): Promise<BrandWithProductCount[]> {
  const { data: brands, error } = await supabase
    .from('brands')
    .select('*')
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch brands: ${error.message}`);
  }

  // Get product counts
  const { data: productCounts, error: countError } = await supabase
    .from('products')
    .select('brand_id', { count: 'exact' })
    .eq('is_active', true);

  if (countError) {
    throw new Error(`Failed to fetch product counts: ${countError.message}`);
  }

  const countMap = new Map<string, number>();
  (productCounts || []).forEach((item: { brand_id: string }) => {
    countMap.set(item.brand_id, (countMap.get(item.brand_id) || 0) + 1);
  });

  return (brands || []).map((brand) => ({
    ...brand,
    product_count: countMap.get(brand.id) || 0,
  })) as BrandWithProductCount[];
}

/**
 * Get brand by slug
 */
export async function getBrandBySlug(
  supabase: SupabaseClient,
  slug: string
): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch brand: ${error.message}`);
  }

  return data as Brand;
}

/**
 * Get brand by ID
 */
export async function getBrandById(
  supabase: SupabaseClient,
  id: string
): Promise<Brand | null> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch brand: ${error.message}`);
  }

  return data as Brand;
}

/**
 * Create a new brand
 */
export async function createBrand(
  supabase: SupabaseClient,
  brand: BrandInsert
): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .insert(brand)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create brand: ${error.message}`);
  }

  return data as Brand;
}

/**
 * Update a brand
 */
export async function updateBrand(
  supabase: SupabaseClient,
  id: string,
  brand: BrandUpdate
): Promise<Brand> {
  const { data, error } = await supabase
    .from('brands')
    .update(brand)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update brand: ${error.message}`);
  }

  return data as Brand;
}

/**
 * Delete a brand
 */
export async function deleteBrand(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('brands').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete brand: ${error.message}`);
  }
}

/**
 * Get brands by origin country
 */
export async function getBrandsByCountry(
  supabase: SupabaseClient,
  country: string
): Promise<Brand[]> {
  const { data, error } = await supabase
    .from('brands')
    .select('*')
    .eq('origin_country', country)
    .order('name', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch brands by country: ${error.message}`);
  }

  return (data || []) as Brand[];
}
