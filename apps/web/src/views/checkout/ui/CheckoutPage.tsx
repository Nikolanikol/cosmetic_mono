'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { CheckoutStepper } from '@/features/checkout/ui/CheckoutStepper';
import { AddressStep, type AddressFormData } from '@/features/checkout/ui/AddressStep';
import { PaymentStep } from '@/features/checkout/ui/PaymentStep';
import { useCartStore } from '@/features/cart/model/useCartStore';

const STEPS = [
  { label: 'Доставка' },
  { label: 'Подтверждение' },
];

const EMPTY_ADDRESS: AddressFormData = {
  recipientName:  '',
  recipientPhone: '',
  shippingMethod: 'sdek',
  country:        'Россия',
  region:         '',
  city:           '',
  street:         '',
  house:          '',
  building:       '',
  apartment:      '',
  zip:            '',
  comment:        '',
};

export function CheckoutPage() {
  const router = useRouter();
  const { items, clearCart } = useCartStore();

  const [currentStep, setCurrentStep]     = useState(0);
  const [addressData, setAddressData]     = useState<AddressFormData>(EMPTY_ADDRESS);
  const [isSubmitting, setIsSubmitting]   = useState(false);
  const [submitError, setSubmitError]     = useState<string | null>(null);

  const handleSubmitOrder = async (
    promoCodeId: string | null,
    discount: number,
    deliveryCost: number,
    total: number,
  ) => {
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartItems: items.map((i) => ({ variantId: i.variantId, quantity: i.quantity })),
          shippingAddress: {
            recipient_name:  addressData.recipientName,
            recipient_phone: addressData.recipientPhone,
            country:         addressData.country,
            region:          addressData.region,
            city:            addressData.city,
            street:          addressData.street,
            house:           addressData.house,
            building:        addressData.building  || undefined,
            apartment:       addressData.apartment || undefined,
            zip:             addressData.zip,
            comment:         addressData.comment   || undefined,
          },
          shippingMethod: addressData.shippingMethod,
          promoCodeId,
          discount,
          deliveryCost,
          total,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setSubmitError(json.error ?? 'Не удалось оформить заказ');
        return;
      }

      clearCart();
      router.push(`/profile/orders/${json.orderId}`);
    } catch {
      setSubmitError('Ошибка сети. Попробуйте ещё раз.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Empty cart guard
  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex flex-col items-center justify-center gap-4">
        <ShoppingBag className="w-16 h-16 text-brand-black-600" />
        <h2 className="text-xl text-white">Корзина пуста</h2>
        <p className="text-brand-charcoal-400 text-sm">Добавьте товары перед оформлением заказа</p>
        <Link
          href="/catalog"
          className="px-6 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-sm font-medium rounded-[2px] transition-colors"
        >
          Перейти в каталог
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-white mb-8">Оформление заказа</h1>

        <CheckoutStepper steps={STEPS} currentStep={currentStep} className="mb-10" />

        {submitError && (
          <div className="mb-4 px-4 py-3 bg-red-900/30 border border-red-700 rounded-[2px] text-sm text-red-400">
            {submitError}
          </div>
        )}

        <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6">
          {currentStep === 0 && (
            <AddressStep
              data={addressData}
              onChange={setAddressData}
              onNext={() => setCurrentStep(1)}
            />
          )}
          {currentStep === 1 && (
            <PaymentStep
              items={items}
              addressData={addressData}
              onBack={() => setCurrentStep(0)}
              onSubmit={handleSubmitOrder}
              isSubmitting={isSubmitting}
            />
          )}
        </div>
      </div>
    </div>
  );
}
