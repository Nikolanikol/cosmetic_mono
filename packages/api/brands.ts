import type { SupabaseClient } from '@supabase/supabase-js';
import type { Brand, BrandWithProductCount } from '../types';

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
    if (error.code === 'PGRST116') return null;
    throw new Error(`Failed to fetch brand: ${error.message}`);
  }

  return data as Brand;
}
