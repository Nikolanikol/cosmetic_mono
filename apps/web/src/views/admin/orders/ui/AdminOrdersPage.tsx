/**
 * Admin Orders List
 * Real data from Supabase — search, status filter, pagination
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { getOrders } from '@packages/api/orders';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Badge } from '@/shared/ui/Badge';
import { ORDER_STATUS_LABELS_RU } from '@packages/types';
import type { OrderStatus } from '@packages/types';

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

export function AdminOrdersPage() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<OrderStatus | ''>('');
  const [page, setPage]     = useState(1);
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'orders', { search, status, page }],
    queryFn: () => getOrders(supabaseBrowser, {
      filters: {
        ...(status ? { status } : {}),
        ...(search ? { search } : {}),
      },
      page,
      limit,
    }),
  });

  const orders     = data?.orders ?? [];
  const totalPages = data?.total_pages ?? 1;
  const total      = data?.total ?? 0;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Заказы</h1>
        {!isLoading && (
          <p className="text-brand-charcoal-400 text-sm mt-0.5">{total} заказов</p>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal-500" />
          <input
            type="text"
            placeholder="Поиск по ID или трек-номеру…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-brand-black-800 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-500 focus:outline-none focus:border-brand-pink-500"
          />
        </div>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value as OrderStatus | ''); setPage(1); }}
          className="px-3 py-2 bg-brand-black-800 border border-brand-black-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand-pink-500 min-w-[160px]"
        >
          <option value="">Все статусы</option>
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>{ORDER_STATUS_LABELS_RU[s]}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">ID</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Сумма</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Статус</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden sm:table-cell">Доставка</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Дата</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-black-600/50">
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-3 bg-brand-black-700 rounded animate-pulse" style={{ width: `${60 + (i % 3) * 10}%` }} />
                    </td>
                  </tr>
                ))
              : orders.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-brand-charcoal-500">
                    Заказов не найдено
                  </td>
                </tr>
              )
              : orders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                  >
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-xs text-brand-charcoal-300">
                        #{order.id.slice(0, 8)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-white font-medium">
                      {formatPrice(order.total_rub)}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge variant={STATUS_VARIANT[order.status]} size="sm">
                        {ORDER_STATUS_LABELS_RU[order.status]}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-brand-charcoal-400 text-xs hidden sm:table-cell">
                      {order.shipping_method === 'sdek'   && 'СДЭК'}
                      {order.shipping_method === 'pochta' && 'Почта России'}
                      {order.shipping_method === 'pickup' && 'Самовывоз'}
                      {!order.shipping_method && '—'}
                    </td>
                    <td className="px-5 py-3.5 text-brand-charcoal-400 text-xs">
                      {new Date(order.created_at).toLocaleDateString('ru-RU')}
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <Link
                        href={`/admin/orders/${order.id}`}
                        className="text-brand-pink-400 hover:text-brand-pink-300 text-xs transition-colors"
                      >
                        Открыть →
                      </Link>
                    </td>
                  </tr>
                ))}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-black-600">
            <span className="text-brand-charcoal-400 text-xs">
              Страница {page} из {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-brand-black-600 text-brand-charcoal-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-brand-black-600 text-brand-charcoal-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
