/**
 * Admin Order Detail
 * Full order info + status change + tracking number
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Check, Truck } from 'lucide-react';
import { getOrderById, updateOrderStatus, addTrackingNumber } from '@packages/api/orders';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Badge } from '@/shared/ui/Badge';
import {
  ORDER_STATUS_LABELS_RU,
  SHIPPING_METHOD_LABELS_RU,
} from '@packages/types';
import type { OrderStatus, OrderWithItems } from '@packages/types';

// ── Status badge map ──────────────────────────────────────────────────────────

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'pink' | 'outline' | 'muted'> = {
  pending:    'muted',
  paid:       'outline',
  processing: 'outline',
  shipped:    'pink',
  delivered:  'default',
  cancelled:  'muted',
  refunded:   'muted',
};

const ALL_STATUSES: OrderStatus[] = [
  'pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded',
];

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminOrderDetailPage({ orderId }: { orderId: string }) {
  const queryClient = useQueryClient();
  const qKey = ['admin', 'order', orderId];

  const { data: order, isLoading, isError } = useQuery({
    queryKey: qKey,
    queryFn:  () => getOrderById(supabaseBrowser, orderId),
  });

  const statusMutation = useMutation({
    mutationFn: (status: OrderStatus) => updateOrderStatus(supabaseBrowser, orderId, status),
    onSuccess:  () => queryClient.invalidateQueries({ queryKey: qKey }),
  });

  const [trackingInput, setTrackingInput] = useState('');
  const trackingMutation = useMutation({
    mutationFn: () => addTrackingNumber(supabaseBrowser, orderId, trackingInput),
    onSuccess:  () => {
      queryClient.invalidateQueries({ queryKey: qKey });
      setTrackingInput('');
    },
  });

  if (isLoading) return <OrderSkeleton />;
  if (isError || !order) return <OrderNotFound />;

  const addr = order.shipping_address;

  return (
    <div className="p-6 space-y-6 max-w-4xl">
      {/* Back */}
      <Link
        href="/admin/orders"
        className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Все заказы
      </Link>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-white">
            Заказ <span className="font-mono text-brand-pink-400">#{order.id.slice(0, 8)}</span>
          </h1>
          <p className="text-brand-charcoal-400 text-sm mt-1">
            {new Date(order.created_at).toLocaleString('ru-RU')}
          </p>
        </div>
        <Badge variant={STATUS_VARIANT[order.status]}>
          {ORDER_STATUS_LABELS_RU[order.status]}
        </Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left: items + totals */}
        <div className="lg:col-span-2 space-y-5">
          {/* Items */}
          <Section title="Состав заказа">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-brand-black-600">
                  <th className="pb-2.5 text-left text-brand-charcoal-400 text-xs font-medium">Товар</th>
                  <th className="pb-2.5 text-center text-brand-charcoal-400 text-xs font-medium">Кол-во</th>
                  <th className="pb-2.5 text-right text-brand-charcoal-400 text-xs font-medium">Цена</th>
                  <th className="pb-2.5 text-right text-brand-charcoal-400 text-xs font-medium">Итого</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => {
                  const snap = item.product_snapshot;
                  return (
                    <tr key={item.id} className="border-b border-brand-black-600/40">
                      <td className="py-3 pr-4">
                        <p className="text-white text-xs font-medium">{snap.product_name_ru}</p>
                        <p className="text-brand-charcoal-500 text-xs mt-0.5">
                          {snap.variant_name_ru}
                          {snap.variant_attributes?.volume ? ` · ${snap.variant_attributes.volume}` : ''}
                        </p>
                        <p className="text-brand-charcoal-600 text-xs">{snap.brand_name}</p>
                      </td>
                      <td className="py-3 text-center text-brand-charcoal-300 text-xs">{item.quantity}</td>
                      <td className="py-3 text-right text-brand-charcoal-300 text-xs">
                        {formatPrice(item.price_rub_at_purchase)}
                      </td>
                      <td className="py-3 text-right text-white text-xs font-medium">
                        {formatPrice(item.price_rub_at_purchase * item.quantity)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div className="pt-3 space-y-1.5 border-t border-brand-black-600/40 mt-1">
              <Row label="Товары" value={formatPrice(order.total_rub - order.delivery_cost_rub + order.discount_rub)} />
              {order.discount_rub > 0 && (
                <Row label="Скидка" value={`−${formatPrice(order.discount_rub)}`} valueClass="text-brand-pink-400" />
              )}
              <Row label="Доставка" value={order.delivery_cost_rub === 0 ? 'Бесплатно' : formatPrice(order.delivery_cost_rub)} />
              <div className="flex justify-between pt-2 border-t border-brand-black-600/40">
                <span className="text-white font-semibold text-sm">Итого</span>
                <span className="text-white font-bold text-sm">{formatPrice(order.total_rub)}</span>
              </div>
            </div>
          </Section>

          {/* Shipping address */}
          {addr && (
            <Section title="Адрес доставки">
              <div className="text-sm space-y-1">
                <p className="text-white font-medium">{addr.recipient_name}</p>
                <p className="text-brand-charcoal-300">{addr.recipient_phone}</p>
                <p className="text-brand-charcoal-400 mt-2">
                  {addr.zip}, {addr.country}, {addr.region}, {addr.city}
                </p>
                <p className="text-brand-charcoal-400">
                  {addr.street}, д. {addr.house}
                  {addr.building   ? `, корп. ${addr.building}`   : ''}
                  {addr.apartment  ? `, кв. ${addr.apartment}`    : ''}
                </p>
                {addr.comment && (
                  <p className="text-brand-charcoal-500 text-xs mt-1">💬 {addr.comment}</p>
                )}
              </div>
              {order.shipping_method && (
                <p className="mt-3 text-xs text-brand-charcoal-400">
                  Метод: <span className="text-white">{SHIPPING_METHOD_LABELS_RU[order.shipping_method]}</span>
                </p>
              )}
            </Section>
          )}
        </div>

        {/* Right: customer + actions */}
        <div className="space-y-5">
          {/* Customer */}
          {order.user && (
            <Section title="Покупатель">
              <div className="text-sm space-y-1">
                <p className="text-white">{order.user.full_name || '—'}</p>
                <p className="text-brand-charcoal-400">{order.user.email}</p>
                {order.user.phone && (
                  <p className="text-brand-charcoal-400">{order.user.phone}</p>
                )}
              </div>
            </Section>
          )}

          {/* Change status */}
          <Section title="Изменить статус">
            <div className="space-y-2">
              {ALL_STATUSES.map((s) => (
                <button
                  key={s}
                  onClick={() => statusMutation.mutate(s)}
                  disabled={order.status === s || statusMutation.isPending}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors border ${
                    order.status === s
                      ? 'bg-brand-pink-500/10 border-brand-pink-500/40 text-brand-pink-400 cursor-default'
                      : 'border-brand-black-600 text-brand-charcoal-300 hover:border-brand-charcoal-400 hover:text-white disabled:opacity-50'
                  }`}
                >
                  <span className="flex items-center justify-between">
                    {ORDER_STATUS_LABELS_RU[s]}
                    {order.status === s && <Check className="w-3.5 h-3.5" />}
                  </span>
                </button>
              ))}
            </div>
            {statusMutation.isError && (
              <p className="text-red-400 text-xs mt-2">Ошибка обновления статуса</p>
            )}
          </Section>

          {/* Tracking number */}
          <Section title="Трек-номер">
            {order.tracking_number && (
              <p className="text-brand-pink-400 font-mono text-sm mb-3">{order.tracking_number}</p>
            )}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Введите трек-номер"
                value={trackingInput}
                onChange={(e) => setTrackingInput(e.target.value)}
                className="flex-1 px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-xs text-white placeholder:text-brand-charcoal-600 focus:outline-none focus:border-brand-pink-500"
              />
              <button
                onClick={() => trackingMutation.mutate()}
                disabled={!trackingInput.trim() || trackingMutation.isPending}
                className="px-3 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
              >
                <Truck className="w-4 h-4 text-white" />
              </button>
            </div>
            {trackingMutation.isError && (
              <p className="text-red-400 text-xs mt-1">Ошибка сохранения</p>
            )}
            {trackingMutation.isSuccess && (
              <p className="text-green-400 text-xs mt-1">Трек-номер сохранён</p>
            )}
          </Section>

          {/* Payment info */}
          {order.yookassa_payment_id && (
            <Section title="Платёж">
              <p className="text-brand-charcoal-400 text-xs">
                YooKassa ID:{' '}
                <span className="font-mono text-brand-charcoal-300">{order.yookassa_payment_id.slice(0, 12)}…</span>
              </p>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl p-5">
      <h2 className="text-white font-semibold text-sm mb-4">{title}</h2>
      {children}
    </div>
  );
}

function Row({
  label,
  value,
  valueClass = 'text-white',
}: {
  label: string;
  value: string;
  valueClass?: string;
}) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-brand-charcoal-400">{label}</span>
      <span className={valueClass}>{value}</span>
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="p-6 space-y-5 max-w-4xl">
      <div className="h-4 w-28 bg-brand-black-700 rounded animate-pulse" />
      <div className="h-7 w-52 bg-brand-black-700 rounded animate-pulse" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-16 bg-brand-black-800 rounded-xl animate-pulse border border-brand-black-600" />
          ))}
        </div>
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-32 bg-brand-black-800 rounded-xl animate-pulse border border-brand-black-600" />
          ))}
        </div>
      </div>
    </div>
  );
}

function OrderNotFound() {
  return (
    <div className="p-6">
      <Link href="/admin/orders" className="inline-flex items-center gap-1.5 text-sm text-brand-charcoal-400 hover:text-white mb-6">
        <ArrowLeft className="w-4 h-4" />
        Все заказы
      </Link>
      <p className="text-brand-charcoal-400">Заказ не найден</p>
    </div>
  );
}
