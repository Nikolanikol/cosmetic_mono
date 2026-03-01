/**
 * Cart API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  CartItem,
  CartItemInsert,
  CartItemUpdate,
  CartItemWithDetails,
  Cart,
  CartMergeResult,
} from '../types';

/**
 * Get cart items for a user
 */
export async function getUserCart(
  supabase: SupabaseClient,
  userId: string
): Promise<CartItemWithDetails[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      *,
      variant:product_variants!inner(
        *,
        product:products!inner(
          id,
          name_ru,
          name_en,
          slug,
          brand:brands(name, slug),
          images:product_images(url, is_primary)
        )
      )
    `
    )
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch cart: ${error.message}`);
  }

  return (data || []) as unknown as CartItemWithDetails[];
}

/**
 * Get cart items for a guest session
 */
export async function getGuestCart(
  supabase: SupabaseClient,
  sessionId: string
): Promise<CartItemWithDetails[]> {
  const { data, error } = await supabase
    .from('cart_items')
    .select(
      `
      *,
      variant:product_variants!inner(
        *,
        product:products!inner(
          id,
          name_ru,
          name_en,
          slug,
          brand:brands(name, slug),
          images:product_images(url, is_primary)
        )
      )
    `
    )
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to fetch guest cart: ${error.message}`);
  }

  return (data || []) as unknown as CartItemWithDetails[];
}

/**
 * Get cart item count for a user
 */
export async function getCartItemCount(
  supabase: SupabaseClient,
  userId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to fetch cart count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Get cart item count for a guest session
 */
export async function getGuestCartItemCount(
  supabase: SupabaseClient,
  sessionId: string
): Promise<number> {
  const { count, error } = await supabase
    .from('cart_items')
    .select('*', { count: 'exact', head: true })
    .eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to fetch guest cart count: ${error.message}`);
  }

  return count || 0;
}

/**
 * Add item to cart
 */
export async function addToCart(
  supabase: SupabaseClient,
  item: CartItemInsert
): Promise<CartItem> {
  // Check if item already exists
  const { data: existing } = await supabase
    .from('cart_items')
    .select('*')
    .eq('variant_id', item.variant_id)
    .eq(item.user_id ? 'user_id' : 'session_id', item.user_id || item.session_id)
    .maybeSingle();

  if (existing) {
    // Update quantity
    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity: existing.quantity + item.quantity })
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update cart item: ${error.message}`);
    }

    return data as CartItem;
  }

  // Insert new item
  const { data, error } = await supabase
    .from('cart_items')
    .insert(item)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to add to cart: ${error.message}`);
  }

  return data as CartItem;
}

/**
 * Update cart item quantity
 */
export async function updateCartItemQuantity(
  supabase: SupabaseClient,
  cartItemId: string,
  quantity: number
): Promise<CartItem> {
  if (quantity <= 0) {
    await removeFromCart(supabase, cartItemId);
    throw new Error('Item removed from cart');
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('id', cartItemId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update cart item: ${error.message}`);
  }

  return data as CartItem;
}

/**
 * Remove item from cart
 */
export async function removeFromCart(
  supabase: SupabaseClient,
  cartItemId: string
): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('id', cartItemId);

  if (error) {
    throw new Error(`Failed to remove from cart: ${error.message}`);
  }
}

/**
 * Clear cart for a user
 */
export async function clearUserCart(
  supabase: SupabaseClient,
  userId: string
): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('user_id', userId);

  if (error) {
    throw new Error(`Failed to clear cart: ${error.message}`);
  }
}

/**
 * Clear cart for a guest session
 */
export async function clearGuestCart(
  supabase: SupabaseClient,
  sessionId: string
): Promise<void> {
  const { error } = await supabase.from('cart_items').delete().eq('session_id', sessionId);

  if (error) {
    throw new Error(`Failed to clear guest cart: ${error.message}`);
  }
}

/**
 * Merge guest cart into user cart
 */
export async function mergeGuestCart(
  supabase: SupabaseClient,
  userId: string,
  sessionId: string
): Promise<CartMergeResult> {
  // Get guest cart items
  const { data: guestItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('session_id', sessionId);

  if (!guestItems || guestItems.length === 0) {
    return { merged_items: 0, conflicts_resolved: 0 };
  }

  // Get user cart items
  const { data: userItems } = await supabase
    .from('cart_items')
    .select('*')
    .eq('user_id', userId);

  const userCartMap = new Map(
    (userItems || []).map((item) => [item.variant_id, item])
  );

  let mergedItems = 0;
  let conflictsResolved = 0;

  for (const guestItem of guestItems) {
    const existingItem = userCartMap.get(guestItem.variant_id);

    if (existingItem) {
      // Merge quantities
      await supabase
        .from('cart_items')
        .update({ quantity: existingItem.quantity + guestItem.quantity })
        .eq('id', existingItem.id);
      conflictsResolved++;
    } else {
      // Transfer item to user
      await supabase
        .from('cart_items')
        .update({ user_id: userId, session_id: null })
        .eq('id', guestItem.id);
      mergedItems++;
    }
  }

  // Clean up remaining guest items
  await supabase.from('cart_items').delete().eq('session_id', sessionId);

  return {
    merged_items: mergedItems,
    conflicts_resolved: conflictsResolved,
  };
}

/**
 * Calculate cart totals
 */
export function calculateCartTotals(items: CartItemWithDetails[]): {
  total_items: number;
  subtotal_rub: number;
  discount_rub: number;
  total_rub: number;
} {
  let total_items = 0;
  let subtotal_rub = 0;
  let discount_rub = 0;

  for (const item of items) {
    const variant = item.variant;
    const price = variant.sale_price_rub ?? variant.price_rub;
    const originalPrice = variant.price_rub;

    total_items += item.quantity;
    subtotal_rub += originalPrice * item.quantity;
    discount_rub += (originalPrice - price) * item.quantity;
  }

  return {
    total_items,
    subtotal_rub,
    discount_rub,
    total_rub: subtotal_rub - discount_rub,
  };
}

/**
 * Build cart object from items
 */
export function buildCart(items: CartItemWithDetails[]): Cart {
  const totals = calculateCartTotals(items);

  return {
    items,
    ...totals,
  };
}
