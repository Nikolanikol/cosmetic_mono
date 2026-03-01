'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Settings, Check, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { useAuthStore } from '@/features/auth/model/useAuthStore';
import { getCurrentProfile, updateProfile } from '@packages/api';
import type { Profile, SkinType, Gender, UserAddress } from '@packages/types';

// ─── Constants ───────────────────────────────────────────────────────────────

const SKIN_TYPES: { value: SkinType; label: string; description: string }[] = [
  { value: 'normal',      label: 'Нормальная',    description: 'Без особых проблем, хорошо увлажнена' },
  { value: 'dry',         label: 'Сухая',          description: 'Ощущение стянутости, шелушение' },
  { value: 'oily',        label: 'Жирная',         description: 'Блеск, расширенные поры' },
  { value: 'combination', label: 'Комбинированная', description: 'T-зона жирная, щёки нормальные' },
  { value: 'sensitive',   label: 'Чувствительная', description: 'Покраснения, реакции на продукты' },
];

const GENDERS: { value: Gender; label: string }[] = [
  { value: 'female',      label: 'Женский' },
  { value: 'male',        label: 'Мужской' },
  { value: 'unspecified', label: 'Не указан' },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6">
      <h2 className="text-lg font-semibold text-white mb-6">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  required,
  children,
  hint,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-brand-charcoal-300 mb-1.5">
        {label}
        {required && <span className="text-brand-pink-500 ml-0.5">*</span>}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-brand-charcoal-500">{hint}</p>}
    </div>
  );
}

const inputCls = cn(
  'w-full bg-brand-black-800 border border-brand-black-500 rounded-[2px]',
  'px-3 py-2 text-sm text-white placeholder:text-brand-charcoal-500',
  'focus:outline-none focus:border-brand-pink-500 transition-colors',
  'disabled:opacity-50 disabled:cursor-not-allowed'
);

function SaveButton({ saving, saved }: { saving: boolean; saved: boolean }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className={cn(
        'flex items-center gap-2 px-5 py-2 text-sm font-medium rounded-[2px] transition-all',
        saved
          ? 'bg-green-600 text-white'
          : 'bg-brand-pink-500 hover:bg-brand-pink-400 text-white',
        saving && 'opacity-70 cursor-not-allowed'
      )}
    >
      {saving ? (
        <><Loader2 className="w-4 h-4 animate-spin" /> Сохранение…</>
      ) : saved ? (
        <><Check className="w-4 h-4" /> Сохранено</>
      ) : (
        'Сохранить'
      )}
    </button>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function SettingsPage() {
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Section saving states
  const [savingPersonal, setSavingPersonal] = useState(false);
  const [savedPersonal, setSavedPersonal] = useState(false);
  const [savingSkin, setSavingSkin] = useState(false);
  const [savedSkin, setSavedSkin] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [savedAddress, setSavedAddress] = useState(false);

  // Personal data form
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState<Gender>('unspecified');
  const [birthDate, setBirthDate] = useState('');

  // Skin type
  const [skinType, setSkinType] = useState<SkinType | null>(null);

  // Address form
  const [address, setAddress] = useState<UserAddress>({
    country: 'Россия',
    region: '',
    city: '',
    street: '',
    house: '',
    building: '',
    apartment: '',
    zip: '',
    comment: '',
  });

  // Load profile on mount
  useEffect(() => {
    if (!user) { setIsLoading(false); return; }

    getCurrentProfile(supabaseBrowser).then((p) => {
      if (!p) return;
      setProfile(p);
      setFullName(p.full_name ?? '');
      setPhone(p.phone ?? '');
      setGender(p.gender ?? 'unspecified');
      setBirthDate(p.birth_date ?? '');
      setSkinType(p.skin_type ?? null);
      if (p.default_address) {
        setAddress({
          country:   p.default_address.country   ?? 'Россия',
          region:    p.default_address.region    ?? '',
          city:      p.default_address.city      ?? '',
          street:    p.default_address.street    ?? '',
          house:     p.default_address.house     ?? '',
          building:  p.default_address.building  ?? '',
          apartment: p.default_address.apartment ?? '',
          zip:       p.default_address.zip       ?? '',
          comment:   p.default_address.comment   ?? '',
        });
      }
    }).finally(() => setIsLoading(false));
  }, [user]);

  const userId = user?.id;

  // ── Save handlers ──────────────────────────────────────────────────────────

  const handleSavePersonal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingPersonal(true);
    try {
      await updateProfile(supabaseBrowser, userId, {
        full_name: fullName || null,
        phone: phone || null,
        gender: gender,
        birth_date: birthDate || null,
      });
      setSavedPersonal(true);
      setTimeout(() => setSavedPersonal(false), 2500);
    } finally {
      setSavingPersonal(false);
    }
  };

  const handleSaveSkin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingSkin(true);
    try {
      await updateProfile(supabaseBrowser, userId, { skin_type: skinType });
      setSavedSkin(true);
      setTimeout(() => setSavedSkin(false), 2500);
    } finally {
      setSavingSkin(false);
    }
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId) return;
    setSavingAddress(true);
    // Strip empty optional fields
    const cleaned: UserAddress = {
      country:   address.country,
      region:    address.region,
      city:      address.city,
      street:    address.street,
      house:     address.house,
      zip:       address.zip,
      ...(address.building  && { building:  address.building }),
      ...(address.apartment && { apartment: address.apartment }),
      ...(address.comment   && { comment:   address.comment }),
    };
    try {
      await updateProfile(supabaseBrowser, userId, { default_address: cleaned });
      setSavedAddress(true);
      setTimeout(() => setSavedAddress(false), 2500);
    } finally {
      setSavingAddress(false);
    }
  };

  const addr = (field: keyof UserAddress) => (
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setAddress((prev) => ({ ...prev, [field]: e.target.value }))
  );

  // ── Loading / auth guard ───────────────────────────────────────────────────

  if (!user && !isLoading) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex items-center justify-center">
        <p className="text-brand-charcoal-400">
          <Link href="/login" className="text-brand-pink-500 hover:underline">Войдите</Link>
          , чтобы открыть настройки
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-brand-pink-500 animate-spin" />
      </div>
    );
  }

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-center gap-3">
          <Link href="/profile" className="text-brand-charcoal-400 hover:text-white transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <Settings className="w-6 h-6 text-brand-pink-500" />
          <h1 className="text-2xl font-bold text-white">Настройки</h1>
        </div>

        {/* ── Личные данные ─────────────────────────────────────────────── */}
        <SectionCard title="Личные данные">
          <form onSubmit={handleSavePersonal} className="space-y-4">

            {/* Email — read only */}
            <Field label="Email" hint="Email нельзя изменить — он привязан к Google-аккаунту">
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                className={inputCls}
              />
            </Field>

            {/* Full name */}
            <Field label="Имя и фамилия">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иван Иванов"
                className={inputCls}
              />
            </Field>

            {/* Phone */}
            <Field label="Телефон" hint="Используется для связи по заказу">
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+7 (999) 000-00-00"
                className={inputCls}
              />
            </Field>

            {/* Gender + Birth date — side by side */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Пол">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as Gender)}
                  className={cn(inputCls, 'cursor-pointer')}
                >
                  {GENDERS.map(({ value, label }) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </Field>

              <Field label="Дата рождения" hint="Для именинных скидок">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  max={new Date().toISOString().split('T')[0]}
                  className={cn(inputCls, '[color-scheme:dark]')}
                />
              </Field>
            </div>

            <div className="flex justify-end pt-2">
              <SaveButton saving={savingPersonal} saved={savedPersonal} />
            </div>
          </form>
        </SectionCard>

        {/* ── Тип кожи ──────────────────────────────────────────────────── */}
        <SectionCard title="Тип кожи">
          <form onSubmit={handleSaveSkin} className="space-y-4">
            <p className="text-sm text-brand-charcoal-400 -mt-3">
              Используется для персональных рекомендаций продуктов
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SKIN_TYPES.map(({ value, label, description }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSkinType(value)}
                  className={cn(
                    'text-left px-4 py-3 rounded-[2px] border transition-all duration-150',
                    skinType === value
                      ? 'border-brand-pink-500 bg-brand-pink-500/10 text-white'
                      : 'border-brand-black-500 bg-brand-black-800 text-brand-charcoal-300 hover:border-brand-black-400'
                  )}
                >
                  <span className="block text-sm font-medium">{label}</span>
                  <span className="block text-xs text-brand-charcoal-500 mt-0.5">{description}</span>
                </button>
              ))}

              {/* Clear option */}
              {skinType && (
                <button
                  type="button"
                  onClick={() => setSkinType(null)}
                  className="text-xs text-brand-charcoal-500 hover:text-brand-pink-400 transition-colors text-left px-1"
                >
                  Сбросить выбор
                </button>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <SaveButton saving={savingSkin} saved={savedSkin} />
            </div>
          </form>
        </SectionCard>

        {/* ── Адрес доставки ────────────────────────────────────────────── */}
        <SectionCard title="Адрес доставки">
          <form onSubmit={handleSaveAddress} className="space-y-4">
            <p className="text-sm text-brand-charcoal-400 -mt-3">
              Автоматически подставляется при оформлении заказа
            </p>

            {/* Country + Region */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Страна" required>
                <input
                  type="text"
                  value={address.country}
                  onChange={addr('country')}
                  placeholder="Россия"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Регион / область" required hint="Нужен для расчёта доставки СДЭК">
                <input
                  type="text"
                  value={address.region}
                  onChange={addr('region')}
                  placeholder="Московская область"
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* City + ZIP */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Город" required>
                <input
                  type="text"
                  value={address.city}
                  onChange={addr('city')}
                  placeholder="Москва"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Индекс" required>
                <input
                  type="text"
                  value={address.zip}
                  onChange={addr('zip')}
                  placeholder="101000"
                  maxLength={6}
                  required
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Street */}
            <Field label="Улица" required>
              <input
                type="text"
                value={address.street}
                onChange={addr('street')}
                placeholder="ул. Тверская"
                required
                className={inputCls}
              />
            </Field>

            {/* House + Building + Apartment */}
            <div className="grid grid-cols-3 gap-4">
              <Field label="Дом" required>
                <input
                  type="text"
                  value={address.house}
                  onChange={addr('house')}
                  placeholder="12"
                  required
                  className={inputCls}
                />
              </Field>
              <Field label="Корпус">
                <input
                  type="text"
                  value={address.building ?? ''}
                  onChange={addr('building')}
                  placeholder="к1"
                  className={inputCls}
                />
              </Field>
              <Field label="Квартира">
                <input
                  type="text"
                  value={address.apartment ?? ''}
                  onChange={addr('apartment')}
                  placeholder="45"
                  className={inputCls}
                />
              </Field>
            </div>

            {/* Comment */}
            <Field label="Комментарий курьеру">
              <textarea
                value={address.comment ?? ''}
                onChange={addr('comment')}
                placeholder="Домофон 45, позвонить за 30 минут"
                rows={2}
                className={cn(inputCls, 'resize-none')}
              />
            </Field>

            <div className="flex justify-end pt-2">
              <SaveButton saving={savingAddress} saved={savedAddress} />
            </div>
          </form>
        </SectionCard>

      </div>
    </div>
  );
}
