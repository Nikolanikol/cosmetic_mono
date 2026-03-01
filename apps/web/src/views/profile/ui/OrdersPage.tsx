'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getUserOrders } from '@packages/api';
import { ORDER_STATUS_LABELS_RU, type OrderStatus, type Order } from '@packages/types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-orange-900/30 text-orange-400 border-orange-700',
  paid:       'bg-green-900/30 text-green-400 border-green-700',
  processing: 'bg-blue-900/30 text-blue-400 border-blue-700',
  shipped:    'bg-purple-900/30 text-purple-400 border-purple-700',
  delivered:  'bg-cyan-900/30 text-cyan-400 border-cyan-700',
  cancelled:  'bg-red-900/30 text-red-400 border-red-700',
  refunded:   'bg-stone-900/30 text-stone-400 border-stone-700',
};

export function OrdersPage() {
  const { user } = useAuthStore();
  const [orders, setOrders]       = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    getUserOrders(supabaseBrowser, user.id)
      .then(({ orders: data }) => setOrders(data))
      .catch(() => setOrders([]))
      .finally(() => setIsLoading(false));
  }, [user]);

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Link href="/profile" className="text-brand-charcoal-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <ShoppingBag className="w-6 h-6 text-brand-pink-500" />
          <h1 className="text-2xl font-bold text-white">Мои заказы</h1>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-brand-pink-500 animate-spin" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto mb-4 text-brand-black-600" />
            <p className="text-white font-medium mb-2">Заказов пока нет</p>
            <p className="text-brand-charcoal-400 text-sm mb-6">
              Оформите первый заказ в нашем каталоге
            </p>
            <Link
              href="/catalog"
              className="inline-block px-6 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-sm font-medium rounded-[2px] transition-colors"
            >
              Перейти в каталог
            </Link>
          </div>
        )}

        {!isLoading && orders.length > 0 && (
          <div className="space-y-3">
            {orders.map((order) => {
              const date = new Date(order.created_at).toLocaleDateString('ru-RU', {
                day: 'numeric', month: 'long', year: 'numeric',
              });
              const shortId = order.id.split('-')[0].toUpperCase();

              return (
                <Link
                  key={order.id}
                  href={`/profile/orders/${order.id}`}
                  className={cn(
                    'flex items-center justify-between',
                    'bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-4',
                    'hover:border-brand-pink-500 transition-colors group'
                  )}
                >
                  <div className="space-y-1">
                    <p className="text-white font-medium">Заказ #{shortId}</p>
                    <p className="text-sm text-brand-charcoal-400">{date}</p>
                    <span className={cn(
                      'inline-block text-xs px-2 py-0.5 rounded-[2px] border',
                      STATUS_STYLES[order.status]
                    )}>
                      {ORDER_STATUS_LABELS_RU[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-white font-bold">{formatPrice(order.total_rub)}</p>
                    <ChevronRight className="w-4 h-4 text-brand-charcoal-500 group-hover:text-brand-pink-500 transition-colors" />
                  </div>
                </Link>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
