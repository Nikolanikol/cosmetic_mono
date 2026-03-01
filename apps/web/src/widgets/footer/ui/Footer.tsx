import Link from 'next/link';

const LINKS = {
  catalog: [
    { href: '/catalog', label: 'Весь каталог' },
    { href: '/catalog?origin_country=KR', label: 'K-Beauty' },
    { href: '/catalog?origin_country=FR', label: 'Европейская косметика' },
    { href: '/catalog?sale_only=true', label: 'Скидки' },
  ],
  info: [
    { href: '/quiz', label: 'Определить тип кожи' },
    { href: '/login', label: 'Вход' },
    { href: '/register', label: 'Регистрация' },
    { href: '/cart', label: 'Корзина' },
  ],
};

export function Footer() {
  return (
    <footer className="bg-brand-black-800 border-t border-brand-black-600 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2">
            <div className="text-xl font-bold text-gradient-pink mb-3">K&amp;E Beauty</div>
            <p className="text-brand-charcoal-300 text-sm leading-relaxed max-w-xs">
              Премиальная корейская и европейская косметика с доставкой по России.
            </p>
            <div className="mt-4">
              <div className="h-px bg-gradient-to-r from-brand-pink-500 via-brand-pink-400 to-transparent w-24" />
            </div>
          </div>

          {/* Catalog */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Каталог</h4>
            <ul className="space-y-2">
              {LINKS.catalog.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-charcoal-300 hover:text-brand-pink-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Info */}
          <div>
            <h4 className="text-sm font-medium text-white mb-3">Покупателям</h4>
            <ul className="space-y-2">
              {LINKS.info.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-brand-charcoal-300 hover:text-brand-pink-500 transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="divider-pink my-8" />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-brand-charcoal-500">
          <span>© 2025 K&E Beauty. Все права защищены.</span>
          <span>Доставка по России: СДЭК, Почта России</span>
        </div>
      </div>
    </footer>
  );
}
