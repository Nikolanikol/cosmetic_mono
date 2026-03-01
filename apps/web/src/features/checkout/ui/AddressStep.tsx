'use client';

import { useEffect } from 'react';
import { cn } from '@/shared/lib/cn';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getCurrentProfile } from '@packages/api';
import type { ShippingMethod } from '@packages/types';

export interface AddressFormData {
  recipientName: string;
  recipientPhone: string;
  shippingMethod: ShippingMethod;
  country: string;
  region: string;
  city: string;
  street: string;
  house: string;
  building: string;
  apartment: string;
  zip: string;
  comment: string;
}

interface AddressStepProps {
  data: AddressFormData;
  onChange: (data: AddressFormData) => void;
  onNext: () => void;
}

const SHIPPING_OPTIONS: {
  value: ShippingMethod;
  label: string;
  description: string;
  cost: number;
}[] = [
  { value: 'sdek',   label: 'СДЭК',         description: 'Пункт выдачи или курьер',  cost: 390 },
  { value: 'pochta', label: 'Почта России',  description: 'Доставка 5–14 дней',       cost: 290 },
  { value: 'pickup', label: 'Самовывоз',     description: 'Москва, ул. Примерная, 1', cost: 0   },
];

const inputCls = cn(
  'w-full bg-brand-black-800 border border-brand-black-500 rounded-[2px]',
  'px-3 py-2 text-sm text-white placeholder:text-brand-charcoal-500',
  'focus:outline-none focus:border-brand-pink-500 transition-colors'
);

export function AddressStep({ data, onChange, onNext }: AddressStepProps) {
  const { user } = useAuthStore();

  // Pre-fill from profile on mount
  useEffect(() => {
    if (!user) return;
    getCurrentProfile(supabaseBrowser).then((profile) => {
      if (!profile) return;
      onChange({
        ...data,
        recipientName:  data.recipientName  || profile.full_name               || '',
        recipientPhone: data.recipientPhone || profile.phone                   || '',
        country:        data.country        || profile.default_address?.country   || 'Россия',
        region:         data.region         || profile.default_address?.region    || '',
        city:           data.city           || profile.default_address?.city      || '',
        street:         data.street         || profile.default_address?.street    || '',
        house:          data.house          || profile.default_address?.house     || '',
        building:       data.building       || profile.default_address?.building  || '',
        apartment:      data.apartment      || profile.default_address?.apartment || '',
        zip:            data.zip            || profile.default_address?.zip       || '',
        comment:        data.comment        || profile.default_address?.comment   || '',
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const set =
    (field: keyof AddressFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      onChange({ ...data, [field]: e.target.value });

  const isValid =
    data.recipientName.trim() &&
    data.recipientPhone.trim() &&
    data.city.trim() &&
    data.street.trim() &&
    data.house.trim() &&
    data.zip.trim();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isValid) onNext();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <h2 className="text-lg font-semibold text-white">Получатель</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm text-brand-charcoal-300 mb-1.5">
            Имя и фамилия <span className="text-brand-pink-500">*</span>
          </label>
          <input
            type="text"
            value={data.recipientName}
            onChange={set('recipientName')}
            placeholder="Иванов Иван"
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-sm text-brand-charcoal-300 mb-1.5">
            Телефон <span className="text-brand-pink-500">*</span>
          </label>
          <input
            type="tel"
            value={data.recipientPhone}
            onChange={set('recipientPhone')}
            placeholder="+7 (999) 000-00-00"
            required
            className={inputCls}
          />
        </div>
      </div>

      {/* Shipping method */}
      <div>
        <p className="text-sm text-brand-charcoal-300 mb-2">
          Способ доставки <span className="text-brand-pink-500">*</span>
        </p>
        <div className="space-y-2">
          {SHIPPING_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className={cn(
                'flex items-center justify-between px-4 py-3 rounded-[2px] border cursor-pointer transition-all',
                data.shippingMethod === opt.value
                  ? 'border-brand-pink-500 bg-brand-pink-500/10'
                  : 'border-brand-black-500 bg-brand-black-800 hover:border-brand-black-400'
              )}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="shippingMethod"
                  value={opt.value}
                  checked={data.shippingMethod === opt.value}
                  onChange={(e) => onChange({ ...data, shippingMethod: e.target.value as ShippingMethod })}
                  className="accent-brand-pink-500"
                />
                <div>
                  <span className="text-sm text-white font-medium">{opt.label}</span>
                  <p className="text-xs text-brand-charcoal-500">{opt.description}</p>
                </div>
              </div>
              <span className={cn(
                'text-sm font-medium',
                opt.cost === 0 ? 'text-green-400' : 'text-white'
              )}>
                {opt.cost === 0 ? 'Бесплатно' : `${opt.cost} ₽`}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Address fields */}
      <div className="pt-2 border-t border-brand-black-600">
        <h3 className="text-sm font-semibold text-white mb-4">Адрес доставки</h3>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">Страна</label>
              <input type="text" value={data.country} onChange={set('country')} placeholder="Россия" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">Регион / область</label>
              <input type="text" value={data.region} onChange={set('region')} placeholder="Московская обл." className={inputCls} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">
                Город <span className="text-brand-pink-500">*</span>
              </label>
              <input type="text" value={data.city} onChange={set('city')} placeholder="Москва" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">
                Индекс <span className="text-brand-pink-500">*</span>
              </label>
              <input type="text" value={data.zip} onChange={set('zip')} placeholder="101000" maxLength={6} required className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-charcoal-300 mb-1.5">
              Улица <span className="text-brand-pink-500">*</span>
            </label>
            <input type="text" value={data.street} onChange={set('street')} placeholder="ул. Тверская" required className={inputCls} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">
                Дом <span className="text-brand-pink-500">*</span>
              </label>
              <input type="text" value={data.house} onChange={set('house')} placeholder="12" required className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">Корпус</label>
              <input type="text" value={data.building} onChange={set('building')} placeholder="к1" className={inputCls} />
            </div>
            <div>
              <label className="block text-sm text-brand-charcoal-300 mb-1.5">Квартира</label>
              <input type="text" value={data.apartment} onChange={set('apartment')} placeholder="45" className={inputCls} />
            </div>
          </div>

          <div>
            <label className="block text-sm text-brand-charcoal-300 mb-1.5">Комментарий курьеру</label>
            <textarea
              value={data.comment}
              onChange={set('comment')}
              placeholder="Домофон 45, позвонить за 30 минут"
              rows={2}
              className={cn(inputCls, 'resize-none')}
            />
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={!isValid}
        className={cn(
          'w-full py-3 text-sm font-medium rounded-[2px] transition-colors',
          isValid
            ? 'bg-brand-pink-500 hover:bg-brand-pink-400 text-white'
            : 'bg-brand-black-600 text-brand-charcoal-500 cursor-not-allowed'
        )}
      >
        Далее → Подтверждение заказа
      </button>
    </form>
  );
}
