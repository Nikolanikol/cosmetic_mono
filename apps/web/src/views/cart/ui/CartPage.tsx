'use client';

import Link from 'next/link';
import { ShoppingBag, ArrowLeft } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { CartItem } from '@/features/cart/ui/CartItem';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { formatPrice } from '@/shared/lib/formatPrice';

export function CartPage() {
  const { items, totalPrice, clearCart } = useCartStore();
  const total = totalPrice();
  const DELIVERY_THRESHOLD = 5000;
  const FREE_DELIVERY = total >= DELIVERY_THRESHOLD;

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back */}
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-brand-charcoal-300 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Продолжить покупки
        </Link>

        <h1 className="text-2xl font-bold text-white mb-8">Корзина</h1>

        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <ShoppingBag className="w-16 h-16 text-brand-black-600" />
            <h2 className="text-xl text-white">Корзина пуста</h2>
            <p className="text-brand-charcoal-300">Добавьте товары из каталога</p>
            <Button href="/catalog" variant="outline">Перейти в каталог</Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Items */}
            <div className="lg:col-span-2">
              <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] px-6">
                {items.map((item) => (
                  <CartItem key={item.variantId} {...item} />
                ))}
              </div>
              <button
                onClick={clearCart}
                className="mt-3 text-xs text-brand-charcoal-500 hover:text-red-400 transition-colors"
              >
                Очистить корзину
              </button>
            </div>

            {/* Summary */}
            <div className="lg:col-span-1">
              <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6 space-y-4 sticky top-24">
                <h2 className="text-lg font-medium text-white">Итого</h2>

                {!FREE_DELIVERY && (
                  <div className="text-xs text-brand-charcoal-300 p-3 bg-brand-black-800 rounded-[2px]">
                    До бесплатной доставки:{' '}
                    <span className="text-brand-pink-500 font-medium">
                      {formatPrice(DELIVERY_THRESHOLD - total)}
                    </span>
                  </div>
                )}

                <div className="space-y-2 border-t border-brand-black-600 pt-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-charcoal-300">Товары ({items.length})</span>
                    <span className="text-white">{formatPrice(total)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-brand-charcoal-300">Доставка</span>
                    <span className={FREE_DELIVERY ? 'text-green-400' : 'text-white'}>
                      {FREE_DELIVERY ? 'Бесплатно' : formatPrice(390)}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between border-t border-brand-black-600 pt-4">
                  <span className="text-white font-medium">К оплате</span>
                  <span className="text-white font-bold text-xl">
                    {formatPrice(total + (FREE_DELIVERY ? 0 : 390))}
                  </span>
                </div>

                <Button href="/checkout" fullWidth>
                  Оформить заказ
                </Button>
                <p className="text-xs text-brand-charcoal-500 text-center">
                  Безопасная оплата через ЮКассу
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
