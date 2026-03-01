/**
 * Promo code-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

export type DiscountType = 'percent' | 'fixed_rub';

export interface PromoCode {
  id: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_rub: number | null;
  usage_limit: number | null;
  used_count: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
  updated_at?: string;
}

export interface PromoCodeInsert {
  id?: string;
  code: string;
  discount_type: DiscountType;
  discount_value: number;
  min_order_rub?: number | null;
  usage_limit?: number | null;
  used_count?: number;
  expires_at?: string | null;
  is_active?: boolean;
  created_at?: string;
}

export interface PromoCodeUpdate {
  code?: string;
  discount_type?: DiscountType;
  discount_value?: number;
  min_order_rub?: number | null;
  usage_limit?: number | null;
  used_count?: number;
  expires_at?: string | null;
  is_active?: boolean;
  updated_at?: string;
}

export interface PromoCodeValidationResult {
  valid: boolean;
  promo_code?: PromoCode;
  error?: string;
  discount_amount?: number;
  final_total?: number;
}

export interface PromoCodeUsage {
  id: string;
  promo_code_id: string;
  order_id: string;
  user_id: string;
  discount_applied: number;
  created_at: string;
}

export interface PromoCodeFilters {
  is_active?: boolean;
  search?: string;
  expires_before?: string;
  expires_after?: string;
}

export interface PromoCodeStats {
  total_usage: number;
  total_discount_given: number;
  average_discount: number;
}
