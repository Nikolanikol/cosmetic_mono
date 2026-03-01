'use client';

import { useState } from 'react';
import { CheckoutStepper } from '@/features/checkout/ui/CheckoutStepper';
import { AddressStep } from '@/features/checkout/ui/AddressStep';
import { PaymentStep } from '@/features/checkout/ui/PaymentStep';
import { useCartStore } from '@/features/cart/model/useCartStore';

const STEPS = [{ label: 'Адрес' }, { label: 'Оплата' }];

export function CheckoutForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const totalPrice = useCartStore((s) => s.totalPrice());

  return (
    <div className="space-y-8">
      <CheckoutStepper steps={STEPS} currentStep={currentStep} />
      {currentStep === 0 && <AddressStep onNext={() => setCurrentStep(1)} />}
      {currentStep === 1 && (
        <PaymentStep onPay={() => {}} total={totalPrice} />
      )}
    </div>
  );
}
