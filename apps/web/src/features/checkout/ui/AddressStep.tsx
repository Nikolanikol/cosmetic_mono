'use client';

import { Input } from '@/shared/ui/Input';
import { Button } from '@/shared/ui/Button';

interface AddressStepProps {
  onNext: () => void;
}

export function AddressStep({ onNext }: AddressStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium text-white mb-4">Адрес доставки</h2>
      <Input label="Полное имя" placeholder="Иванов Иван Иванович" />
      <Input label="Телефон" type="tel" placeholder="+7 (999) 999-99-99" />
      <Input label="Email" type="email" placeholder="example@mail.ru" />
      <Input label="Город" placeholder="Москва" />
      <Input label="Адрес" placeholder="ул. Примерная, д. 1, кв. 1" />
      <Input label="Индекс" placeholder="123456" />
      <div className="pt-2">
        <Button onClick={onNext} fullWidth>Далее</Button>
      </div>
    </div>
  );
}
