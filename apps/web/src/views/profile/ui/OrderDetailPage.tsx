'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowLeft, Package, MapPin, CreditCard, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { getOrderById } from '@packages/api';
import {
  ORDER_STATUS_LABELS_RU,
  SHIPPING_METHOD_LABELS_RU,
  type OrderWithItems,
  type OrderStatus,
} from '@packages/types';

const STATUS_STYLES: Record<OrderStatus, string> = {
  pending:    'bg-orange-900/30 text-orange-400 border-orange-700',
  paid:       'bg-green-900/30 text-green-400 border-green-700',
  processing: 'bg-blue-900/30 text-blue-400 border-blue-700',
  shipped:    'bg-purple-900/30 text-purple-400 border-purple-700',
  delivered:  'bg-cyan-900/30 text-cyan-400 border-cyan-700',
  cancelled:  'bg-red-900/30 text-red-400 border-red-700',
  refunded:   'bg-stone-900/30 text-stone-400 border-stone-700',
};

function InfoCard({ title, icon: Icon, children }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-5">
      <div className="flex items-center gap-2 mb-4">
        <Icon className="w-4 h-4 text-brand-pink-500" />
        <h3 className="text-sm font-semibold text-white">{title}</h3>
      </div>
      {children}
    </div>
  );
}

interface OrderDetailPageProps {
  orderId: string;
}

export function OrderDetailPage({ orderId }: OrderDetailPageProps) {
  const [order, setOrder]       = useState<OrderWithItems | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    getOrderById(supabaseBrowser, orderId)
      .then((data) => {
        if (!data) setNotFound(true);
        else setOrder(data);
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-pink-500 animate-spin" />
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex flex-col items-center justify-center gap-4">
        <Package className="w-12 h-12 text-brand-black-600" />
        <p className="text-white">Заказ не найден</p>
        <Link href="/profile/orders" className="text-brand-pink-500 hover:underline text-sm">
          Все заказы
        </Link>
      </div>
    );
  }

  const addr = order.shipping_address;
  const addressLine = addr
    ? [addr.city, addr.street, `д. ${addr.house}`, addr.apartment && `кв. ${addr.apartment}`]
        .filter(Boolean).join(', ')
    : '—';

  const orderDate = new Date(order.created_at).toLocaleDateString('ru-RU', {
    day: 'numeric', month: 'long', year: 'numeric',
  });

  const shortId = order.id.split('-')[0].toUpperCase();

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile/orders" className="text-brand-charcoal-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-white">Заказ #{shortId}</h1>
            <p className="text-sm text-brand-charcoal-400">{orderDate}</p>
          </div>
          <span className={cn(
            'ml-auto text-xs font-medium px-2.5 py-1 rounded-[2px] border',
            STATUS_STYLES[order.status]
          )}>
            {ORDER_STATUS_LABELS_RU[order.status]}
          </span>
        </div>

        {/* Items */}
        <InfoCard title="Состав заказа" icon={Package}>
          <div className="space-y-4">
            {order.items.map((item) => {
              const snap = item.product_snapshot;
              return (
                <div key={item.id} className="flex items-center gap-3">
                  <div className="w-14 h-16 bg-brand-black-800 rounded-[2px] overflow-hidden flex-shrink-0 relative">
                    {snap.image_url ? (
                      <Image src={snap.image_url} alt={snap.product_name_ru} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-brand-charcoal-600 text-[10px]">
                        Нет фото
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/product/${snap.product_slug}`}
                      className="text-sm text-white hover:text-brand-pink-400 line-clamp-2 transition-colors"
                    >
                      {snap.product_name_ru}
                    </Link>
                    <p className="text-xs text-brand-charcoal-500 mt-0.5">
                      {snap.brand_name} · {snap.variant_name_ru}
                    </p>
                    <p className="text-xs text-brand-charcoal-400">Кол-во: {item.quantity} шт.</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm text-white font-medium">
                      {formatPrice(item.price_rub_at_purchase * item.quantity)}
                    </p>
                    <p className="text-xs text-brand-charcoal-500">
                      {formatPrice(item.price_rub_at_purchase)} × {item.quantity}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </InfoCard>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Delivery address */}
          <InfoCard title="Доставка" icon={MapPin}>
            <div className="text-sm space-y-1">
              {addr ? (
                <>
                  <p className="text-white font-medium">{addr.recipient_name}</p>
                  <p className="text-brand-charcoal-300">{addr.recipient_phone}</p>
                  <p className="text-brand-charcoal-300 mt-2">{addressLine}</p>
                  {addr.zip && <p className="text-brand-charcoal-400 text-xs">{addr.zip}</p>}
                  {addr.comment && (
                    <p className="text-brand-charcoal-500 text-xs italic mt-1">{addr.comment}</p>
                  )}
                  <p className="text-brand-charcoal-400 text-xs mt-2">
                    {order.shipping_method ? SHIPPING_METHOD_LABELS_RU[order.shipping_method] : '—'}
                  </p>
                  {order.tracking_number && (
                    <p className="text-brand-pink-400 text-xs mt-1">
                      Трек: {order.tracking_number}
                    </p>
                  )}
                </>
              ) : (
                <p className="text-brand-charcoal-400">Адрес не указан</p>
              )}
            </div>
          </InfoCard>

          {/* Payment summary */}
          <InfoCard title="Оплата" icon={CreditCard}>
            <div className="text-sm space-y-2">
              <div className="flex justify-between">
                <span className="text-brand-charcoal-300">Товары</span>
                <span className="text-white">
                  {formatPrice(order.items.reduce((s, i) => s + i.price_rub_at_purchase * i.quantity, 0))}
                </span>
              </div>
              {order.discount_rub > 0 && (
                <div className="flex justify-between">
                  <span className="text-green-400">Скидка</span>
                  <span className="text-green-400">−{formatPrice(order.discount_rub)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-brand-charcoal-300">Доставка</span>
                <span className={order.delivery_cost_rub === 0 ? 'text-green-400' : 'text-white'}>
                  {order.delivery_cost_rub === 0 ? 'Бесплатно' : formatPrice(order.delivery_cost_rub)}
                </span>
              </div>
              <div className="flex justify-between pt-2 border-t border-brand-black-600">
                <span className="text-white font-semibold">Итого</span>
                <span className="text-white font-bold">{formatPrice(order.total_rub)}</span>
              </div>
              <div className="pt-2">
                <span className={cn(
                  'text-xs px-2 py-1 rounded-[2px] border',
                  STATUS_STYLES[order.status]
                )}>
                  {ORDER_STATUS_LABELS_RU[order.status]}
                </span>
              </div>
            </div>
          </InfoCard>
        </div>

        {/* Back to catalog */}
        <div className="text-center pt-2">
          <Link
            href="/catalog"
            className="text-sm text-brand-charcoal-400 hover:text-brand-pink-500 transition-colors"
          >
            Продолжить покупки →
          </Link>
        </div>

      </div>
    </div>
  );
}
