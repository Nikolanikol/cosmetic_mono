'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/shared/ui/Button';

interface ProductDetailPageProps {
  slug: string;
}

export function ProductDetailPage({ slug }: ProductDetailPageProps) {
  return (
    <div className="min-h-screen bg-brand-black-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-brand-charcoal-300 hover:text-white text-sm mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Назад в каталог
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
          {/* Image placeholder */}
          <div className="aspect-square bg-brand-black-700 border border-brand-black-600 rounded-[2px] flex items-center justify-center">
            <span className="text-brand-charcoal-500">Фото товара</span>
          </div>

          {/* Info */}
          <div className="space-y-6">
            <div>
              <p className="text-brand-charcoal-300 text-sm mb-1">Бренд</p>
              <h1 className="text-2xl font-bold text-white">Название товара</h1>
              <p className="text-brand-charcoal-400 text-sm mt-1">Артикул: {slug}</p>
            </div>

            <div className="text-3xl font-bold text-white">0 ₽</div>

            <Button fullWidth size="lg">В корзину</Button>

            <div className="border-t border-brand-black-600 pt-6">
              <h3 className="text-white font-medium mb-2">Описание</h3>
              <p className="text-brand-charcoal-300 text-sm leading-relaxed">
                Информация о товаре загружается...
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
