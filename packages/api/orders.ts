/**
 * Order API queries for Supabase
 * Shared between Next.js web app and future React Native app
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  Order,
  OrderInsert,
  OrderUpdate,
  OrderWithItems,
  OrderItem,
  OrderItemInsert,
  OrderFilters,
  OrderStats,
  DailyOrderStats,
  OrderStatus,
} from '../types';

/**
 * Get orders with filters and pagination
 */
export async function getOrders(
  supabase: SupabaseClient,
  params: {
    filters?: OrderFilters;
    page?: number;
    limit?: number;
  } = {}
): Promise<{ orders: Order[]; total: number; total_pages: number }> {
  const { filters = {}, page = 1, limit = 20 } = params;

  let query = supabase
    .from('orders')
    .select('*', { count: 'exact' });

  // Apply filters
  if (filters.status) {
    query = query.eq('status', filters.status);
  }

  if (filters.user_id) {
    query = query.eq('user_id', filters.user_id);
  }

  if (filters.date_from) {
    query = query.gte('created_at', filters.date_from);
  }

  if (filters.date_to) {
    query = query.lte('created_at', filters.date_to);
  }

  if (filters.search) {
    query = query.or(
      `id.ilike.%${filters.search}%,tracking_number.ilike.%${filters.search}%`
    );
  }

  // Apply pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order('created_at', { ascending: false });

  const { data, error, count } = await query;

  if (error) {
    throw new Error(`Failed to fetch orders: ${error.message}`);
  }

  return {
    orders: (data || []) as Order[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Get a single order by ID with items
 */
export async function getOrderById(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderWithItems | null> {
  const { data, error } = await supabase
    .from('orders')
    .select(
      `
      *,
      items:order_items(*),
      user:profiles(id, email, full_name, phone)
    `
    )
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch order: ${error.message}`);
  }

  return data as unknown as OrderWithItems;
}

/**
 * Get orders for a specific user
 */
export async function getUserOrders(
  supabase: SupabaseClient,
  userId: string,
  params: { page?: number; limit?: number } = {}
): Promise<{ orders: Order[]; total: number; total_pages: number }> {
  const { page = 1, limit = 10 } = params;

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await supabase
    .from('orders')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) {
    throw new Error(`Failed to fetch user orders: ${error.message}`);
  }

  return {
    orders: (data || []) as Order[],
    total: count || 0,
    total_pages: Math.ceil((count || 0) / limit),
  };
}

/**
 * Create a new order
 */
export async function createOrder(
  supabase: SupabaseClient,
  order: OrderInsert
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create order: ${error.message}`);
  }

  return data as Order;
}

/**
 * Update an order
 */
export async function updateOrder(
  supabase: SupabaseClient,
  orderId: string,
  order: OrderUpdate
): Promise<Order> {
  const { data, error } = await supabase
    .from('orders')
    .update(order)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to update order: ${error.message}`);
  }

  return data as Order;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  supabase: SupabaseClient,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  const updateData: OrderUpdate = { status };

  // Set timestamps based on status
  const now = new Date().toISOString();
  switch (status) {
    case 'paid':
      updateData.paid_at = now;
      break;
    case 'shipped':
      updateData.shipped_at = now;
      break;
    case 'delivered':
      updateData.delivered_at = now;
      break;
  }

  return updateOrder(supabase, orderId, updateData);
}

/**
 * Add tracking number to order
 */
export async function addTrackingNumber(
  supabase: SupabaseClient,
  orderId: string,
  trackingNumber: string
): Promise<Order> {
  return updateOrder(supabase, orderId, {
    tracking_number: trackingNumber,
    status: 'shipped',
    shipped_at: new Date().toISOString(),
  });
}

/**
 * Delete an order (admin only)
 */
export async function deleteOrder(
  supabase: SupabaseClient,
  orderId: string
): Promise<void> {
  const { error } = await supabase.from('orders').delete().eq('id', orderId);

  if (error) {
    throw new Error(`Failed to delete order: ${error.message}`);
  }
}

// ============================================================================
// Order Item Queries
// ============================================================================

/**
 * Get order items
 */
export async function getOrderItems(
  supabase: SupabaseClient,
  orderId: string
): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .select('*')
    .eq('order_id', orderId);

  if (error) {
    throw new Error(`Failed to fetch order items: ${error.message}`);
  }

  return (data || []) as OrderItem[];
}

/**
 * Create order items
 */
export async function createOrderItems(
  supabase: SupabaseClient,
  items: OrderItemInsert[]
): Promise<OrderItem[]> {
  const { data, error } = await supabase
    .from('order_items')
    .insert(items)
    .select();

  if (error) {
    throw new Error(`Failed to create order items: ${error.message}`);
  }

  return (data || []) as OrderItem[];
}

// ============================================================================
// Order Statistics (Admin)
// ============================================================================

/**
 * Get order statistics
 */
export async function getOrderStats(
  supabase: SupabaseClient,
  params: { date_from?: string; date_to?: string } = {}
): Promise<OrderStats> {
  const { date_from, date_to } = params;

  let query = supabase.from('orders').select('status, total_rub');

  if (date_from) {
    query = query.gte('created_at', date_from);
  }

  if (date_to) {
    query = query.lte('created_at', date_to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch order stats: ${error.message}`);
  }

  const orders = (data || []) as { status: OrderStatus; total_rub: number }[];

  const stats: OrderStats = {
    total_orders: orders.length,
    total_revenue: orders.reduce((sum, o) => sum + (o.total_rub || 0), 0),
    average_order_value: orders.length > 0
      ? orders.reduce((sum, o) => sum + (o.total_rub || 0), 0) / orders.length
      : 0,
    pending_orders: orders.filter((o) => o.status === 'pending').length,
    processing_orders: orders.filter((o) => o.status === 'processing').length,
    shipped_orders: orders.filter((o) => o.status === 'shipped').length,
    delivered_orders: orders.filter((o) => o.status === 'delivered').length,
    cancelled_orders: orders.filter((o) => o.status === 'cancelled').length,
  };

  return stats;
}

/**
 * Get daily order statistics
 */
export async function getDailyOrderStats(
  supabase: SupabaseClient,
  days: number = 30
): Promise<DailyOrderStats[]> {
  const fromDate = new Date();
  fromDate.setDate(fromDate.getDate() - days);

  const { data, error } = await supabase
    .from('orders')
    .select('created_at, total_rub')
    .gte('created_at', fromDate.toISOString())
    .order('created_at', { ascending: true });

  if (error) {
    throw new Error(`Failed to fetch daily stats: ${error.message}`);
  }

  // Group by date
  const grouped = new Map<string, { orders: number; revenue: number }>();

  (data || []).forEach((order: { created_at: string; total_rub: number }) => {
    const date = order.created_at.split('T')[0];
    const current = grouped.get(date) || { orders: 0, revenue: 0 };
    grouped.set(date, {
      orders: current.orders + 1,
      revenue: current.revenue + (order.total_rub || 0),
    });
  });

  // Fill in missing dates
  const result: DailyOrderStats[] = [];
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - (days - 1 - i));
    const dateStr = date.toISOString().split('T')[0];
    const stats = grouped.get(dateStr) || { orders: 0, revenue: 0 };
    result.push({
      date: dateStr,
      orders: stats.orders,
      revenue: stats.revenue,
    });
  }

  return result;
}

/**
 * Get top selling products
 */
export async function getTopProducts(
  supabase: SupabaseClient,
  limit: number = 10,
  params: { date_from?: string; date_to?: string } = {}
): Promise<{ product_id: string; product_name: string; total_sold: number; revenue: number }[]> {
  const { date_from, date_to } = params;

  let query = supabase
    .from('order_items')
    .select('product_snapshot, quantity, price_rub_at_purchase, order:orders(created_at)');

  if (date_from) {
    query = query.gte('order.created_at', date_from);
  }

  if (date_to) {
    query = query.lte('order.created_at', date_to);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to fetch top products: ${error.message}`);
  }

  // Aggregate by product
  const productMap = new Map<
    string,
    { product_name: string; total_sold: number; revenue: number }
  >();

  (data || []).forEach((item: { product_snapshot: { product_id: string; product_name_ru: string }; quantity: number; price_rub_at_purchase: number }) => {
    const snapshot = item.product_snapshot;
    const current = productMap.get(snapshot.product_id) || {
      product_name: snapshot.product_name_ru,
      total_sold: 0,
      revenue: 0,
    };
    productMap.set(snapshot.product_id, {
      product_name: snapshot.product_name_ru,
      total_sold: current.total_sold + item.quantity,
      revenue: current.revenue + item.quantity * item.price_rub_at_purchase,
    });
  });

  return Array.from(productMap.entries())
    .map(([product_id, stats]) => ({
      product_id,
      ...stats,
    }))
    .sort((a, b) => b.total_sold - a.total_sold)
    .slice(0, limit);
}
