'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShoppingBag, Search, Menu, X, User } from 'lucide-react';
import { cn } from '@/shared/lib/cn';
import { useCartStore } from '@/features/cart/model/useCartStore';
import { useHeaderState } from '../model/useHeaderState';

const NAV_LINKS = [
  { href: '/', label: 'Главная' },
  { href: '/catalog', label: 'Каталог' },
  { href: '/quiz', label: 'Тип кожи' },
];

export function Header() {
  const pathname = usePathname();
  const { isMenuOpen, toggleMenu, closeMenu } = useHeaderState();
  const totalItems = useCartStore((s) => s.totalItems());

  // Avoid SSR/client mismatch: localStorage is only available on the client.
  // Show the cart badge only after hydration.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <header className="sticky top-0 z-40 bg-brand-black-900/95 backdrop-blur-md border-b border-brand-black-600">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2" onClick={closeMenu}>
            <span className="text-xl font-bold text-gradient-pink">
              K&amp;E Beauty
            </span>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm transition-colors duration-200',
                  pathname === link.href
                    ? 'text-brand-pink-500'
                    : 'text-brand-charcoal-300 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button className="p-2 text-brand-charcoal-300 hover:text-white transition-colors">
              <Search className="w-5 h-5" />
            </button>

            <Link
              href="/profile"
              className="p-2 text-brand-charcoal-300 hover:text-white transition-colors hidden md:block"
            >
              <User className="w-5 h-5" />
            </Link>

            <Link href="/cart" className="relative p-2 text-brand-charcoal-300 hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
              {mounted && totalItems > 0 && (
                <span className="absolute top-0.5 right-0.5 w-4 h-4 flex items-center justify-center bg-brand-pink-500 text-white text-[10px] font-bold rounded-full">
                  {totalItems > 9 ? '9+' : totalItems}
                </span>
              )}
            </Link>

            {/* Mobile menu toggle */}
            <button
              className="md:hidden p-2 text-brand-charcoal-300 hover:text-white transition-colors"
              onClick={toggleMenu}
            >
              {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden border-t border-brand-black-600 bg-brand-black-800">
          <nav className="flex flex-col py-2">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMenu}
                className={cn(
                  'px-6 py-3 text-sm transition-colors',
                  pathname === link.href
                    ? 'text-brand-pink-500'
                    : 'text-brand-charcoal-300 hover:text-white'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/profile"
              onClick={closeMenu}
              className="px-6 py-3 text-sm text-brand-charcoal-300 hover:text-white transition-colors"
            >
              Профиль
            </Link>
            <Link
              href="/login"
              onClick={closeMenu}
              className="px-6 py-3 text-sm text-brand-charcoal-300 hover:text-white transition-colors"
            >
              Войти
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
