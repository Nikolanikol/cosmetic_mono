'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tag,
  Layers,
  Ticket,
  ArrowLeft,
} from 'lucide-react';
import { cn } from '@/shared/lib/cn';

const NAV = [
  { href: '/admin',             label: 'Дашборд',    icon: LayoutDashboard, exact: true  },
  { href: '/admin/orders',      label: 'Заказы',     icon: ShoppingBag,     exact: false },
  { href: '/admin/products',    label: 'Товары',     icon: Package,         exact: false },
  { href: '/admin/brands',      label: 'Бренды',     icon: Tag,             exact: false },
  { href: '/admin/categories',  label: 'Категории',  icon: Layers,          exact: false },
  { href: '/admin/promo-codes', label: 'Промокоды',  icon: Ticket,          exact: false },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-brand-black-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-black-800 border-r border-brand-black-600 flex flex-col sticky top-0 h-screen flex-shrink-0">
        <div className="p-4 border-b border-brand-black-600">
          <span className="text-lg font-bold text-gradient-pink">K&amp;E Admin</span>
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const isActive = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 text-sm transition-colors border-l-2',
                  isActive
                    ? 'text-white bg-brand-black-700 border-brand-pink-500'
                    : 'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-700/50 border-transparent'
                )}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-brand-black-600">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-brand-charcoal-500 hover:text-brand-pink-500 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            На сайт
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
