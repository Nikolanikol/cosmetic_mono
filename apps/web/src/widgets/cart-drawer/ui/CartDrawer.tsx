'use client';

import Link from 'next/link';
import { X, ShoppingBag } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { Button } from '@/shared/ui/Button';
import { CartItem } from '@/features/cart/ui/CartItem';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { formatPrice } from '@/shared/lib/formatPrice';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const { items, totalPrice } = useCartStore();

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />
      )}

      {/* Drawer */}
      <div
        className={cn(
          'fixed top-0 right-0 bottom-0 z-50 w-full max-w-md',
          'bg-brand-black-800 border-l border-brand-black-600',
          'flex flex-col transition-transform duration-300',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-brand-black-600">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-pink-500" />
            <h2 className="text-lg font-medium text-white">Корзина</h2>
            {items.length > 0 && (
              <span className="text-sm text-brand-charcoal-300">({items.length})</span>
            )}
          </div>
          <button onClick={onClose} className="text-brand-charcoal-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-12">
              <ShoppingBag className="w-12 h-12 text-brand-black-600" />
              <p className="text-brand-charcoal-300">Корзина пуста</p>
              <Button href="/catalog" onClick={onClose} variant="outline" size="sm">
                Перейти в каталог
              </Button>
            </div>
          ) : (
            <div>
              {items.map((item) => (
                <CartItem key={item.variantId} {...item} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="px-6 py-4 border-t border-brand-black-600 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-brand-charcoal-300">Итого</span>
              <span className="text-white font-semibold text-lg">{formatPrice(totalPrice())}</span>
            </div>
            <Button href="/checkout" onClick={onClose} fullWidth>
              Оформить заказ
            </Button>
          </div>
        )}
      </div>
    </>
  );
}
