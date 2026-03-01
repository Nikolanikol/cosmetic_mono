'use client';

import { CreditCard } from 'lucide-react';
import { Button } from '@/shared/ui/Button';

interface PaymentStepProps {
  onPay: () => void;
  total: number;
}

export function PaymentStep({ onPay, total }: PaymentStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-white mb-4">Оплата</h2>
      <div className="p-4 border border-brand-black-600 rounded-[2px] flex items-center gap-3">
        <CreditCard className="w-5 h-5 text-brand-charcoal-300" />
        <span className="text-brand-charcoal-300">Банковская карта (ЮКасса)</span>
      </div>
      <div className="pt-2">
        <Button onClick={onPay} fullWidth>
          Оплатить {total.toLocaleString('ru-RU')} ₽
        </Button>
      </div>
    </div>
  );
}
