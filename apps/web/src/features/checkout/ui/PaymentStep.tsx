'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronLeft, Tag, Check, Loader2, X } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { formatPrice } from '@/shared/lib/formatPrice';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { validatePromoCode } from '@packages/api';
import type { PromoCodeValidationResult, ShippingMethod } from '@packages/types';
import type { AddressFormData } from './AddressStep';

interface CartItemRow {
  variantId: string;
  name: string;
  price: number;
  salePrice?: number | null;
  quantity: number;
  imageUrl?: string;
  slug: string;
}

interface PaymentStepProps {
  items: CartItemRow[];
  addressData: AddressFormData;
  onBack: () => void;
  onSubmit: (promoCodeId: string | null, discount: number, deliveryCost: number, total: number) => Promise<void>;
  isSubmitting: boolean;
}

const SHIPPING_COSTS: Record<ShippingMethod, number> = {
  sdek:   390,
  pochta: 290,
  pickup: 0,
};
const FREE_DELIVERY_THRESHOLD = 5000;

const inputCls = cn(
  'flex-1 bg-brand-black-800 border border-brand-black-500 rounded-l-[2px]',
  'px-3 py-2 text-sm text-white placeholder:text-brand-charcoal-500',
  'focus:outline-none focus:border-brand-pink-500 transition-colors'
);

export function PaymentStep({ items, addressData, onBack, onSubmit, isSubmitting }: PaymentStepProps) {
  const [promoInput, setPromoInput]       = useState('');
  const [promoResult, setPromoResult]     = useState<PromoCodeValidationResult | null>(null);
  const [promoLoading, setPromoLoading]   = useState(false);
  const [promoError, setPromoError]       = useState<string | null>(null);

  const subtotal = items.reduce((sum, i) => sum + (i.salePrice ?? i.price) * i.quantity, 0);
  const discount = promoResult?.valid ? (promoResult.discount_amount ?? 0) : 0;
  const baseAfterDiscount = subtotal - discount;
  const shippingCost = addressData.shippingMethod === 'pickup' || baseAfterDiscount >= FREE_DELIVERY_THRESHOLD
    ? 0
    : SHIPPING_COSTS[addressData.shippingMethod];
  const total = baseAfterDiscount + shippingCost;

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) return;
    setPromoLoading(true);
    setPromoError(null);
    try {
      const result = await validatePromoCode(supabaseBrowser, promoInput.trim(), subtotal);
      setPromoResult(result);
      if (!result.valid) setPromoError(result.error ?? 'Промокод недействителен');
    } catch {
      setPromoError('Ошибка проверки промокода');
    } finally {
      setPromoLoading(false);
    }
  };

  const handleClearPromo = () => {
    setPromoInput('');
    setPromoResult(null);
    setPromoError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const promoCodeId = promoResult?.valid ? (promoResult.promo_code?.id ?? null) : null;
    onSubmit(promoCodeId, discount, shippingCost, total);
  };

  const SHIPPING_LABELS: Record<ShippingMethod, string> = {
    sdek:   'СДЭК',
    pochta: 'Почта России',
    pickup: 'Самовывоз',
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Подтверждение заказа</h2>

      {/* Delivery address summary */}
      <div className="bg-brand-black-800 rounded-[2px] p-4 text-sm space-y-1">
        <p className="text-brand-charcoal-400 text-xs mb-2">Доставка</p>
        <p className="text-white font-medium">{addressData.recipientName}</p>
        <p className="text-brand-charcoal-300">{addressData.recipientPhone}</p>
        <p className="text-brand-charcoal-300">
          {[addressData.city, addressData.street, `д. ${addressData.house}`, addressData.apartment && `кв. ${addressData.apartment}`]
            .filter(Boolean)
            .join(', ')}
        </p>
        <p className="text-brand-charcoal-400 text-xs mt-1">{SHIPPING_LABELS[addressData.shippingMethod]}</p>
      </div>

      {/* Items list */}
      <div className="space-y-3">
        <p className="text-sm text-brand-charcoal-400">Товары ({items.length})</p>
        {items.map((item) => (
          <div key={item.variantId} className="flex items-center gap-3">
            <div className="w-12 h-14 bg-brand-black-800 rounded-[2px] overflow-hidden flex-shrink-0 relative">
              {item.imageUrl ? (
                <Image src={item.imageUrl} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-brand-charcoal-600 text-[10px]">
                  Нет фото
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <Link href={`/product/${item.slug}`} className="text-sm text-white hover:text-brand-pink-400 line-clamp-1 transition-colors">
                {item.name}
              </Link>
              <p className="text-xs text-brand-charcoal-400 mt-0.5">{item.quantity} шт.</p>
            </div>
            <span className="text-sm text-white font-medium flex-shrink-0">
              {formatPrice((item.salePrice ?? item.price) * item.quantity)}
            </span>
          </div>
        ))}
      </div>

      {/* Promo code */}
      <div>
        <p className="text-sm text-brand-charcoal-400 mb-2">Промокод</p>
        {promoResult?.valid ? (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-900/30 border border-green-700 rounded-[2px]">
            <Check className="w-4 h-4 text-green-400 flex-shrink-0" />
            <span className="text-sm text-green-400 flex-1">
              {promoInput.toUpperCase()} — скидка {formatPrice(discount)}
            </span>
            <button type="button" onClick={handleClearPromo} className="text-brand-charcoal-500 hover:text-red-400 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex">
            <input
              type="text"
              value={promoInput}
              onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError(null); }}
              placeholder="Введите промокод"
              className={inputCls}
            />
            <button
              type="button"
              onClick={handleApplyPromo}
              disabled={promoLoading || !promoInput.trim()}
              className={cn(
                'flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-r-[2px] transition-colors',
                'bg-brand-black-600 border border-brand-black-500 border-l-0 text-white',
                'hover:bg-brand-black-500 disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              {promoLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5" />}
              Применить
            </button>
          </div>
        )}
        {promoError && <p className="mt-1.5 text-xs text-red-400">{promoError}</p>}
      </div>

      {/* Price breakdown */}
      <div className="border-t border-brand-black-600 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-brand-charcoal-300">Товары</span>
          <span className="text-white">{formatPrice(subtotal)}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-green-400">Скидка по промокоду</span>
            <span className="text-green-400">−{formatPrice(discount)}</span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-brand-charcoal-300">Доставка ({SHIPPING_LABELS[addressData.shippingMethod]})</span>
          <span className={shippingCost === 0 ? 'text-green-400' : 'text-white'}>
            {shippingCost === 0 ? 'Бесплатно' : formatPrice(shippingCost)}
          </span>
        </div>
        <div className="flex justify-between pt-2 border-t border-brand-black-600">
          <span className="text-white font-semibold">К оплате</span>
          <span className="text-white font-bold text-xl">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Actions */}
      <div className="space-y-3">
        <button
          type="submit"
          disabled={isSubmitting || items.length === 0}
          className={cn(
            'w-full py-3 text-sm font-medium rounded-[2px] transition-colors flex items-center justify-center gap-2',
            'bg-brand-pink-500 hover:bg-brand-pink-400 text-white',
            (isSubmitting || items.length === 0) && 'opacity-70 cursor-not-allowed'
          )}
        >
          {isSubmitting ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Оформляем заказ…</>
          ) : (
            `Оформить заказ на ${formatPrice(total)}`
          )}
        </button>

        <button
          type="button"
          onClick={onBack}
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-1.5 py-2 text-sm text-brand-charcoal-400 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Изменить адрес
        </button>
      </div>

      <p className="text-xs text-brand-charcoal-500 text-center">
        Нажимая «Оформить заказ», вы соглашаетесь с условиями обработки данных
      </p>
    </form>
  );
}
