/**
 * Order-related TypeScript types
 * Used by both Next.js web app and future React Native app
 */

import type { ProductVariant } from './product';
import type { Profile } from './user';
import type { UserAddress } from './user';

export type OrderStatus = 
  | 'pending' 
  | 'paid' 
  | 'processing' 
  | 'shipped' 
  | 'delivered' 
  | 'cancelled' 
  | 'refunded';

export type ShippingMethod = 'sdek' | 'pochta' | 'pickup';

export interface Order {
  id: string;
  user_id: string | null;
  status: OrderStatus;
  total_rub: number;
  promo_code_id: string | null;
  discount_rub: number;
  yookassa_payment_id: string | null;
  yookassa_payment_url: string | null;
  shipping_address: UserAddress | null;
  shipping_method: ShippingMethod | null;
  tracking_number: string | null;
  created_at: string;
  updated_at?: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderInsert {
  id?: string;
  user_id?: string | null;
  status?: OrderStatus;
  total_rub: number;
  promo_code_id?: string | null;
  discount_rub?: number;
  yookassa_payment_id?: string | null;
  yookassa_payment_url?: string | null;
  shipping_address?: UserAddress | null;
  shipping_method?: ShippingMethod | null;
  tracking_number?: string | null;
  created_at?: string;
}

export interface OrderUpdate {
  status?: OrderStatus;
  total_rub?: number;
  promo_code_id?: string | null;
  discount_rub?: number;
  yookassa_payment_id?: string | null;
  yookassa_payment_url?: string | null;
  shipping_address?: UserAddress | null;
  shipping_method?: ShippingMethod | null;
  tracking_number?: string | null;
  updated_at?: string;
  paid_at?: string | null;
  shipped_at?: string | null;
  delivered_at?: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  price_rub_at_purchase: number;
  product_snapshot: ProductSnapshot;
  created_at: string;
}

export interface ProductSnapshot {
  product_id: string;
  product_name_ru: string;
  product_name_en: string;
  product_slug: string;
  brand_name: string;
  variant_name_ru: string;
  variant_sku: string;
  variant_attributes: Record<string, string>;
  image_url: string | null;
}

export interface OrderItemInsert {
  id?: string;
  order_id: string;
  variant_id: string;
  quantity: number;
  price_rub_at_purchase: number;
  product_snapshot: ProductSnapshot;
  created_at?: string;
}

export interface OrderWithItems extends Order {
  items: OrderItem[];
  user: Profile | null;
}

export interface OrderWithUser extends Order {
  user: Pick<Profile, 'id' | 'email' | 'full_name' | 'phone'> | null;
}

export interface OrderSummary {
  id: string;
  status: OrderStatus;
  total_rub: number;
  item_count: number;
  created_at: string;
}

export interface OrderFilters {
  status?: OrderStatus;
  user_id?: string;
  date_from?: string;
  date_to?: string;
  search?: string;
}

export interface OrderStats {
  total_orders: number;
  total_revenue: number;
  average_order_value: number;
  pending_orders: number;
  processing_orders: number;
  shipped_orders: number;
  delivered_orders: number;
  cancelled_orders: number;
}

export interface DailyOrderStats {
  date: string;
  orders: number;
  revenue: number;
}

export const ORDER_STATUS_LABELS_RU: Record<OrderStatus, string> = {
  pending: 'Ожидает оплаты',
  paid: 'Оплачен',
  processing: 'В обработке',
  shipped: 'Отправлен',
  delivered: 'Доставлен',
  cancelled: 'Отменен',
  refunded: 'Возвращен',
};

export const ORDER_STATUS_COLORS: Record<OrderStatus, string> = {
  pending: '#FFA500',
  paid: '#4CAF50',
  processing: '#2196F3',
  shipped: '#9C27B0',
  delivered: '#00BCD4',
  cancelled: '#F44336',
  refunded: '#795548',
};

export const SHIPPING_METHOD_LABELS_RU: Record<ShippingMethod, string> = {
  sdek: 'СДЭК',
  pochta: 'Почта России',
  pickup: 'Самовывоз',
};
