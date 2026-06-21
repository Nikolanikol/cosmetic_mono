/**
 * Cart-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

import type { ProductVariant, ProductWithDetails } from './product';

export interface CartItem {
  id: string;
  user_id: string | null;
  session_id: string | null;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at?: string;
}

export interface CartItemInsert {
  id?: string;
  user_id?: string | null;
  session_id?: string | null;
  variant_id: string;
  quantity: number;
  created_at?: string;
}

export interface CartItemUpdate {
  quantity?: number;
  updated_at?: string;
}

export interface CartItemWithVariant extends CartItem {
  variant: ProductVariant & {
    product: Pick<ProductWithDetails, 'id' | 'name' | 'slug' | 'brand' | 'images'>;
  };
}

export interface CartItemWithDetails extends CartItem {
  variant: ProductVariant;
  product: {
    id: number;
    name: string;
    slug: string;
    brand: {
      name: string;
      slug: string;
    };
    images: {
      url: string;
      is_primary: boolean;
    }[];
  };
}

export interface Cart {
  items: CartItemWithDetails[];
  total_items: number;
  subtotal_rub: number;
  discount_rub: number;
  total_rub: number;
}

export interface GuestCart {
  session_id: string;
  items: {
    variant_id: string;
    quantity: number;
  }[];
}

export interface CartMergeResult {
  merged_items: number;
  conflicts_resolved: number;
}
