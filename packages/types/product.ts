import type { Brand } from './brand';

export interface Category {
  id: number;
  name: string;
  slug: string;
  sort_order: number;
  created_at: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  source_url: string | null;
  category_id: number;
  brand_id: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: number;
  product_id: number;
  name: string;
  price: number;
  compare_at_price: number | null;
  sku: string | null;
  in_stock: boolean;
  weight_g: number;
  color_hex: string | null;
  created_at: string;
}

export interface ProductImage {
  id: number;
  product_id: number;
  url: string;
  alt: string | null;
  is_primary: boolean;
  sort_order: number;
  created_at: string;
}

export interface ProductWithDetails extends Product {
  brand: Brand;
  category: Category;
  variants: ProductVariant[];
  images: ProductImage[];
  tags: string[];
}

export interface ProductWithDefaultVariant extends Product {
  brand: Brand;
  category: Category;
  default_variant: ProductVariant | null;
  primary_image: ProductImage | null;
}

export interface ProductFilters {
  category?: string;
  brand?: string[];
  price_min?: number;
  price_max?: number;
  search?: string;
}

export type ProductSortOption =
  | 'popular'
  | 'price_asc'
  | 'price_desc'
  | 'newest';

export interface PaginatedProducts {
  products: ProductWithDefaultVariant[];
  total: number;
  page: number;
  total_pages: number;
}

export const KBEAUTY_ROUTINE_STEPS: Record<string, { name: string }> = {
  cleansing: { name: 'Cleansing' },
  toner: { name: 'Toner' },
  essence: { name: 'Essence' },
  serum: { name: 'Serum' },
  moisturizer: { name: 'Moisturizer' },
  sunscreen: { name: 'Sunscreen' },
};
