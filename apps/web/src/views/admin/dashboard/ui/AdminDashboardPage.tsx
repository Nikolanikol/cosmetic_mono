/**
 * Admin Dashboard
 * Real-time stats: orders, revenue, products, top sellers
 */

'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { ShoppingBag, TrendingUp, Package, Clock } from 'lucide-react';
import { getOrderStats, getOrders, getTopProducts } from '@packages/api/orders';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Badge } from '@/shared/ui/Badge';
import { ORDER_STATUS_LABELS_RU } from '@packages/types';
import type { OrderStatus } from '@packages/types';

// ── Status badge variant map ──────────────────────────────────────────────────

const STATUS_VARIANT: Record<OrderStatus, 'default' | 'pink' | 'outline' | 'muted'> = {
  pending:    'muted',
  paid:       'outline',
  processing: 'outline',
  shipped:    'pink',
  delivered:  'default',
  cancelled:  'muted',
  refunded:   'muted',
};

// ── Dashboard ─────────────────────────────────────────────────────────────────

export function AdminDashboardPage() {
  const today = new Date().toISOString().slice(0, 10);

  // All-time order stats
  const { data: stats } = useQuery({
    queryKey: ['admin', 'orderStats'],
    queryFn:  () => getOrderStats(supabaseBrowser),
  });

  // Today's new orders count
  const { data: todayData } = useQuery({
    queryKey: ['admin', 'todayOrders'],
    queryFn:  () => getOrders(supabaseBrowser, {
      filters: { date_from: `${today}T00:00:00` },
      limit: 1,
    }),
  });

  // Active products count
  const { data: activeProducts } = useQuery({
    queryKey: ['admin', 'activeProducts'],
    queryFn:  async () => {
      const { count } = await supabaseBrowser
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);
      return count ?? 0;
    },
  });

  // Recent 5 orders
  const { data: recentData } = useQuery({
    queryKey: ['admin', 'recentOrders'],
    queryFn:  () => getOrders(supabaseBrowser, { limit: 5 }),
  });

  // Top 5 products
  const { data: topProducts } = useQuery({
    queryKey: ['admin', 'topProducts'],
    queryFn:  () => getTopProducts(supabaseBrowser, 5),
  });

  const statCards = [
    {
      label:   'Всего заказов',
      value:   stats?.total_orders ?? '—',
      icon:    ShoppingBag,
      color:   'text-brand-pink-400',
      bg:      'bg-brand-pink-500/10',
    },
    {
      label:   'Выручка всего',
      value:   stats ? formatPrice(stats.total_revenue) : '—',
      icon:    TrendingUp,
      color:   'text-green-400',
      bg:      'bg-green-500/10',
    },
    {
      label:   'Активных товаров',
      value:   activeProducts ?? '—',
      icon:    Package,
      color:   'text-blue-400',
      bg:      'bg-blue-500/10',
    },
    {
      label:   'Новых сегодня',
      value:   todayData?.total ?? '—',
      icon:    Clock,
      color:   'text-yellow-400',
      bg:      'bg-yellow-500/10',
    },
  ];

  return (
    <div className="p-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Дашборд</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, color, bg }) => (
          <div
            key={label}
            className="bg-brand-black-800 border border-brand-black-600 rounded-xl p-5"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-brand-charcoal-400 text-xs mb-1">{label}</p>
                <p className="text-2xl font-bold text-white">{value}</p>
              </div>
              <div className={`w-9 h-9 rounded-lg ${bg} flex items-center justify-center flex-shrink-0`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-black-600">
            <h2 className="text-white font-semibold text-sm">Последние заказы</h2>
            <Link
              href="/admin/orders"
              className="text-xs text-brand-pink-400 hover:text-brand-pink-300 transition-colors"
            >
              Все заказы →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-600">
                <th className="px-5 py-2.5 text-left text-brand-charcoal-400 text-xs font-medium">ID</th>
                <th className="px-5 py-2.5 text-left text-brand-charcoal-400 text-xs font-medium">Сумма</th>
                <th className="px-5 py-2.5 text-left text-brand-charcoal-400 text-xs font-medium">Статус</th>
                <th className="px-5 py-2.5 text-left text-brand-charcoal-400 text-xs font-medium">Дата</th>
              </tr>
            </thead>
            <tbody>
              {!recentData
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-brand-black-600/50">
                      <td colSpan={4} className="px-5 py-3">
                        <div className="h-3 bg-brand-black-700 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : recentData.orders.length === 0
                ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-6 text-center text-brand-charcoal-500 text-xs">
                      Заказов пока нет
                    </td>
                  </tr>
                )
                : recentData.orders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                    >
                      <td className="px-5 py-3">
                        <Link
                          href={`/admin/orders/${order.id}`}
                          className="text-brand-pink-400 hover:text-brand-pink-300 font-mono text-xs"
                        >
                          #{order.id.slice(0, 8)}
                        </Link>
                      </td>
                      <td className="px-5 py-3 text-white text-xs">{formatPrice(order.total_rub)}</td>
                      <td className="px-5 py-3">
                        <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                          {ORDER_STATUS_LABELS_RU[order.status]}
                        </Badge>
                      </td>
                      <td className="px-5 py-3 text-brand-charcoal-400 text-xs">
                        {new Date(order.created_at).toLocaleDateString('ru-RU')}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>

        {/* Top products */}
        <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-brand-black-600">
            <h2 className="text-white font-semibold text-sm">Топ товаров</h2>
            <Link
              href="/admin/products"
              className="text-xs text-brand-pink-400 hover:text-brand-pink-300 transition-colors"
            >
              Все товары →
            </Link>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-brand-black-600">
                <th className="px-5 py-2.5 text-left text-brand-charcoal-400 text-xs font-medium">Товар</th>
                <th className="px-5 py-2.5 text-right text-brand-charcoal-400 text-xs font-medium">Продано</th>
                <th className="px-5 py-2.5 text-right text-brand-charcoal-400 text-xs font-medium">Выручка</th>
              </tr>
            </thead>
            <tbody>
              {!topProducts
                ? Array.from({ length: 4 }).map((_, i) => (
                    <tr key={i} className="border-b border-brand-black-600/50">
                      <td colSpan={3} className="px-5 py-3">
                        <div className="h-3 bg-brand-black-700 rounded animate-pulse" />
                      </td>
                    </tr>
                  ))
                : topProducts.length === 0
                ? (
                  <tr>
                    <td colSpan={3} className="px-5 py-6 text-center text-brand-charcoal-500 text-xs">
                      Данных о продажах пока нет
                    </td>
                  </tr>
                )
                : topProducts.map((p) => (
                    <tr key={p.product_id} className="border-b border-brand-black-600/50">
                      <td className="px-5 py-3 text-white text-xs truncate max-w-[160px]">
                        {p.product_name}
                      </td>
                      <td className="px-5 py-3 text-brand-charcoal-300 text-xs text-right">
                        {p.total_sold} шт.
                      </td>
                      <td className="px-5 py-3 text-white text-xs text-right">
                        {formatPrice(p.revenue)}
                      </td>
                    </tr>
                  ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Stats summary row */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ожидают оплаты',  value: stats.pending_orders,    color: 'text-yellow-400' },
            { label: 'В обработке',      value: stats.processing_orders, color: 'text-blue-400'   },
            { label: 'Отправлено',        value: stats.shipped_orders,    color: 'text-purple-400' },
            { label: 'Доставлено',        value: stats.delivered_orders,  color: 'text-green-400'  },
          ].map(({ label, value, color }) => (
            <div
              key={label}
              className="bg-brand-black-800 border border-brand-black-600 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <span className="text-brand-charcoal-400 text-xs">{label}</span>
              <span className={`text-lg font-bold ${color}`}>{value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
