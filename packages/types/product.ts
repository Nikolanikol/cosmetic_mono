/**
 * Product-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

import type { Brand, OriginCountry } from './brand';
import type { SkinType } from './user';

export interface Category {
  id: string;
  name_ru: string;
  name_en: string;
  slug: string;
  parent_id: string | null;
  image_url: string | null;
  sort_order: number;
  created_at: string;
}

export interface CategoryInsert {
  id?: string;
  name_ru: string;
  name_en: string;
  slug: string;
  parent_id?: string | null;
  image_url?: string | null;
  sort_order?: number;
  created_at?: string;
}

export interface CategoryWithChildren extends Category {
  children: Category[];
}

export type ProductTag = 
  | 'антивозрастной'
  | 'увлажнение'
  | 'SPF'
  | 'осветление'
  | 'питание'
  | 'очищение'
  | 'акне'
  | 'чувствительная'
  | 'сияние'
  | 'лифтинг';

export interface Product {
  id: string;
  name_ru: string;
  name_en: string;
  slug: string;
  description_ru: string | null;
  category_id: string;
  brand_id: string;
  is_active: boolean;
  is_featured: boolean;
  routine_step: number | null; // 1-10 for K-beauty routine
  skin_types: SkinType[];
  tags: ProductTag[];
  meta_title_ru: string | null;
  meta_description_ru: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ProductInsert {
  id?: string;
  name_ru: string;
  name_en: string;
  slug: string;
  description_ru?: string | null;
  category_id: string;
  brand_id: string;
  is_active?: boolean;
  is_featured?: boolean;
  routine_step?: number | null;
  skin_types?: SkinType[];
  tags?: ProductTag[];
  meta_title_ru?: string | null;
  meta_description_ru?: string | null;
  created_at?: string;
}

export interface ProductUpdate {
  name_ru?: string;
  name_en?: string;
  slug?: string;
  description_ru?: string | null;
  category_id?: string;
  brand_id?: string;
  is_active?: boolean;
  is_featured?: boolean;
  routine_step?: number | null;
  skin_types?: SkinType[];
  tags?: ProductTag[];
  meta_title_ru?: string | null;
  meta_description_ru?: string | null;
  updated_at?: string;
}

export interface ProductVariantAttribute {
  volume?: string;
  shade?: string;
  shade_hex?: string;
  [key: string]: string | undefined;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  name_ru: string;
  price_rub: number;
  sale_price_rub: number | null;
  stock: number;
  attributes: ProductVariantAttribute;
  weight_g: number | null;
  created_at: string;
}

export interface ProductVariantInsert {
  id?: string;
  product_id: string;
  sku: string;
  name_ru: string;
  price_rub: number;
  sale_price_rub?: number | null;
  stock?: number;
  attributes?: ProductVariantAttribute;
  weight_g?: number | null;
  created_at?: string;
}

export interface ProductVariantUpdate {
  sku?: string;
  name_ru?: string;
  price_rub?: number;
  sale_price_rub?: number | null;
  stock?: number;
  attributes?: ProductVariantAttribute;
  weight_g?: number | null;
}

export interface ProductImage {
  id: string;
  product_id: string;
  url: string;
  alt_ru: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductIngredient {
  id: string;
  product_id: string;
  inci_name: string;
  name_ru: string;
  purpose_ru: string | null;
  is_highlighted: boolean;
  safety_rating: number | null; // 1-10 EWG-style
  created_at: string;
}

export interface ProductWithRelations extends Product {
  brand: Brand;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  ingredients: ProductIngredient[];
  average_rating?: number;
  review_count?: number;
}

export interface ProductWithDefaultVariant extends Product {
  brand: Brand;
  category: Category;
  default_variant: ProductVariant;
  primary_image: ProductImage | null;
  average_rating: number;
  review_count: number;
}

export interface ProductFilters {
  category?: string;
  brand?: string[];
  price_min?: number;
  price_max?: number;
  skin_type?: SkinType;
  rating?: number;
  sale_only?: boolean;
  origin_country?: OriginCountry[];
  tags?: ProductTag[];
  search?: string;
}

export type ProductSortOption = 
  | 'popular' 
  | 'price_asc' 
  | 'price_desc' 
  | 'newest' 
  | 'rating';

export interface ProductListParams {
  filters?: ProductFilters;
  sort?: ProductSortOption;
  page?: number;
  limit?: number;
}

export interface PaginatedProducts {
  products: ProductWithDefaultVariant[];
  total: number;
  page: number;
  total_pages: number;
}

export const KBEAUTY_ROUTINE_STEPS: Record<number, { name: string; description: string }> = {
  1: { name: 'Очищение маслом', description: 'Первый шаг двойного очищения' },
  2: { name: 'Пенное очищение', description: 'Второй шаг двойного очищения' },
  3: { name: 'Пилинг/Скраб', description: 'Отшелушивание 1-2 раза в неделю' },
  4: { name: 'Тонер', description: 'Баланс pH и подготовка кожи' },
  5: { name: 'Эссенция', description: 'Увлажнение и питание' },
  6: { name: 'Сыворотка/Ампула', description: 'Концентрированный уход' },
  7: { name: 'Листовая маска', description: 'Интенсивный уход 2-3 раза в неделю' },
  8: { name: 'Крем для глаз', description: 'Нежный уход за кожей вокруг глаз' },
  9: { name: 'Увлажняющий крем', description: 'Защитный барьер и увлажнение' },
  10: { name: 'SPF/Ночная маска', description: 'Дневная защита или ночной уход' },
};
