import Link from 'next/link';
import { cn } from '@/shared/lib/cn';

const NAV = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/products', label: 'Товары' },
  { href: '/admin/orders', label: 'Заказы' },
  { href: '/admin/analytics', label: 'Аналитика' },
];

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-brand-black-900 flex">
      {/* Sidebar */}
      <aside className="w-56 bg-brand-black-800 border-r border-brand-black-600 flex flex-col">
        <div className="p-4 border-b border-brand-black-600">
          <Link href="/" className="text-lg font-bold text-gradient-pink">
            K&amp;E Admin
          </Link>
        </div>
        <nav className="flex-1 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'block px-4 py-2.5 text-sm transition-colors',
                'text-brand-charcoal-300 hover:text-white hover:bg-brand-black-700'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-4 border-t border-brand-black-600">
          <Link href="/" className="text-xs text-brand-charcoal-500 hover:text-brand-pink-500 transition-colors">
            ← На сайт
          </Link>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
