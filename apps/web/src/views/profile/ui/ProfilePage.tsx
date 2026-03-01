'use client';

import { User, ShoppingBag, Heart, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

const MENU_ITEMS = [
  { icon: ShoppingBag, label: 'Мои заказы', href: '/profile/orders', badge: null },
  { icon: Heart, label: 'Избранное', href: '/profile/wishlist', badge: null },
  { icon: Settings, label: 'Настройки', href: '/profile/settings', badge: null },
];

export function ProfilePage() {
  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-white mb-8">Личный кабинет</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Profile card */}
          <div className="md:col-span-1">
            <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6">
              <div className="flex flex-col items-center text-center gap-3">
                <div className="w-16 h-16 bg-brand-black-600 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-brand-charcoal-400" />
                </div>
                <div>
                  <p className="text-white font-medium">Пользователь</p>
                  <p className="text-brand-charcoal-400 text-sm">user@example.com</p>
                </div>
              </div>

              <div className="divider-pink my-4" />

              <nav className="space-y-1">
                {MENU_ITEMS.map(({ icon: Icon, label, href }) => (
                  <Link
                    key={href}
                    href={href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-[2px] text-sm',
                      'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-600',
                      'transition-colors duration-200'
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </Link>
                ))}
                <button
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2 rounded-[2px] text-sm',
                    'text-red-400 hover:text-red-300 hover:bg-brand-black-600',
                    'transition-colors duration-200'
                  )}
                >
                  <LogOut className="w-4 h-4" />
                  Выйти
                </button>
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="md:col-span-2">
            <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] p-6">
              <h2 className="text-lg font-medium text-white mb-4">Последние заказы</h2>
              <div className="text-center py-12 text-brand-charcoal-400">
                <ShoppingBag className="w-10 h-10 mx-auto mb-3 text-brand-black-600" />
                <p>Заказов пока нет</p>
                <Link
                  href="/catalog"
                  className="text-brand-pink-500 hover:text-brand-pink-400 text-sm mt-2 inline-block"
                >
                  Перейти в каталог
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
