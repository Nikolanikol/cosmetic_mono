/**
 * Promo code API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  PromoCode,
  PromoCodeInsert,
  PromoCodeUpdate,
  PromoCodeValidationResult,
} from '../types';

/**
 * Get all promo codes (admin)
 */
export async function getPromoCodes(
  supabase: SupabaseClient,
  params: { page?: number; limit?: number; isActive?: boolean } = {}
): Promise<{ promoCodes: PromoCode[]; total: number; total_pages: number }> {
  const { page = 1, limit = 20, isActive } = params;

  let query = supabase.from('promo_codes').select('*', { count: 'exact' });

  if (isActive !== undefined) {
    query = query.eq('is_active', isActive);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch promo codes: ${error.message}`);
  }

  return {
    promoCodes: (data || []) as PromoCode[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get promo code by ID
 */
export async function getPromoCodeById(
  supabase: SupabaseClient,
  id: string
): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch promo code: ${error.message}`);
  }

  return data as PromoCode;
}

/**
 * Get promo code by code string
 */
export async function getPromoCodeByCode(
  supabase: SupabaseClient,
  code: string
): Promise<PromoCode | null> {
  const { data, error } = await supabase
    .from('promo_codes')
    .select('*')
    .eq('code', code.toUpperCase())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch promo code: ${error.message}`);
  }

  return data as PromoCode;
}

/**
 * Validate a promo code
 */
export async function validatePromoCode(
  supabase: SupabaseClient,
  code: string,
  cartTotal: number
): Promise<PromoCodeValidationResult> {
  const promoCode = await getPromoCodeByCode(supabase, code);

  if (!promoCode) {
    return {
      valid: false,
      error: 'Промокод не найден',
    };
  }

  if (!promoCode.is_active) {
    return {
      valid: false,
      error: 'Промокод неактивен',
    };
  }

  if (promoCode.expires_at && new Date(promoCode.expires_at) < new Date()) {
    return {
      valid: false,
      error: 'Срок действия промокода истек',
    };
  }

  if (
    promoCode.usage_limit !== null &&
    promoCode.used_count >= promoCode.usage_limit
  ) {
    return {
      valid: false,
      error: 'Лимит использования промокода исчерпан',
    };
  }

  if (
    promoCode.min_order_rub !== null &&
    cartTotal < promoCode.min_order_rub
  ) {
    return {
      valid: false,
      error: `Минимальная сумма заказа для этого промокода: ${promoCode.min_order_rub} ₽`,
    };
  }

  // Calculate discount
  let discountAmount = 0;
  if (promoCode.discount_type === 'percent') {
    discountAmount = Math.round((cartTotal * promoCode.discount_value) / 100);
  } else {
    discountAmount = promoCode.discount_value;
  }

  // Ensure discount doesn't exceed cart total
  discountAmount = Math.min(discountAmount, cartTotal);

  return {
    valid: true,
    promo_code: promoCode,
    discount_amount: discountAmount,
    final_total: cartTotal - discountAmount,
  };
}

/**
 * Create a new promo code
 */
export async function createPromoCode(
  supabase: SupabaseClient,
  promoCode: PromoCodeInsert
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .insert({
      ...promoCode,
      code: promoCode.code.toUpperCase(),
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create promo code: ${error.message}`);
  }

  return data as PromoCode;
}

/**
 * Update a promo code
 */
export async function updatePromoCode(
  supabase: SupabaseClient,
  id: string,
  promoCode: PromoCodeUpdate
): Promise<PromoCode> {
  const { data, error } = await supabase
    .from('promo_codes')
    .update(promoCode)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update promo code: ${error.message}`);
  }

  return data as PromoCode;
}

/**
 * Delete a promo code
 */
export async function deletePromoCode(
  supabase: SupabaseClient,
  id: string
): Promise<void> {
  const { error } = await supabase.from('promo_codes').delete().eq('id', id);

  if (error) {
    throw new Error(`Failed to delete promo code: ${error.message}`);
  }
}

/**
 * Increment promo code usage count
 */
export async function incrementPromoCodeUsage(
  supabase: SupabaseClient,
  promoCodeId: string
): Promise<void> {
  const { error } = await supabase.rpc('increment_promo_code_usage', {
    promo_code_id: promoCodeId,
  });

  if (error) {
    // Fallback: update directly
    const { data: promoCode } = await supabase
      .from('promo_codes')
      .select('used_count')
      .eq('id', promoCodeId)
      .single();

    if (promoCode) {
      await supabase
        .from('promo_codes')
        .update({ used_count: (promoCode.used_count || 0) + 1 })
        .eq('id', promoCodeId);
    }
  }
}

/**
 * Generate a random promo code
 */
export function generatePromoCode(length: number = 8): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}
