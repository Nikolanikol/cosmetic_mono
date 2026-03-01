'use client';

import { Plus } from 'lucide-react';
import { Button } from '@/shared/ui/Button';
import { Badge } from '@/shared/ui/Badge';

const MOCK_PRODUCTS = [
  { id: '1', name: 'COSRX Snail Mucin Essence', brand: 'COSRX', price: 2490, stock: 15, active: true },
  { id: '2', name: 'Laneige Water Sleeping Mask', brand: 'Laneige', price: 3200, stock: 8, active: true },
  { id: '3', name: 'Some By Mi AHA BHA Toner', brand: 'Some By Mi', price: 1890, stock: 0, active: false },
];

export function AdminProductsPage() {
  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-white">Товары</h1>
        <Button href="/admin/products/create" size="sm">
          <Plus className="w-4 h-4 mr-1" />
          Добавить
        </Button>
      </div>

      <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Название</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Бренд</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Цена</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Склад</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Статус</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_PRODUCTS.map((product) => (
              <tr key={product.id} className="border-b border-brand-black-600 hover:bg-brand-black-800 transition-colors">
                <td className="px-4 py-3 text-white">{product.name}</td>
                <td className="px-4 py-3 text-brand-charcoal-300">{product.brand}</td>
                <td className="px-4 py-3 text-white">{product.price.toLocaleString('ru-RU')} ₽</td>
                <td className="px-4 py-3">
                  <span className={product.stock === 0 ? 'text-red-400' : 'text-white'}>
                    {product.stock === 0 ? 'Нет' : product.stock + ' шт.'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <Badge variant={product.active ? 'outline' : 'muted'} size="sm">
                    {product.active ? 'Активен' : 'Скрыт'}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
