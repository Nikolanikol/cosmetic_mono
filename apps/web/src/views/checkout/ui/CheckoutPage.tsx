'use client';

import { useState } from 'react';
import { CheckoutStepper } from '@/features/checkout/ui/CheckoutStepper';
import { AddressStep } from '@/features/checkout/ui/AddressStep';
import { PaymentStep } from '@/features/checkout/ui/PaymentStep';
import { useCartStore } from '@/features/cart/model/useCartStore';

const STEPS = [
  { label: 'Адрес' },
  { label: 'Оплата' },
];

export function CheckoutPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const totalPrice = useCartStore((s) => s.totalPrice());

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-2xl font-bold text-white mb-8">Оформление заказа</h1>

        <CheckoutStepper steps={STEPS} currentStep={currentStep} className="mb-10" />

        <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6">
          {currentStep === 0 && (
            <AddressStep onNext={() => setCurrentStep(1)} />
          )}
          {currentStep === 1 && (
            <PaymentStep onPay={() => alert('Интеграция с ЮКассой в разработке')} total={totalPrice} />
          )}
        </div>
      </div>
    </div>
  );
}
