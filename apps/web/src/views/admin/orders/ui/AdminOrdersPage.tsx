'use client';

import { Badge } from '@/shared/ui/Badge';

const MOCK_ORDERS = [
  { id: '#001', customer: 'Иванов И.', total: 4500, status: 'pending', date: '01.03.2025' },
  { id: '#002', customer: 'Петрова А.', total: 12000, status: 'paid', date: '01.03.2025' },
  { id: '#003', customer: 'Сидоров М.', total: 7800, status: 'shipped', date: '28.02.2025' },
];

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'pink' | 'outline' | 'muted' }> = {
  pending: { label: 'Ожидает', variant: 'muted' },
  paid: { label: 'Оплачен', variant: 'outline' },
  processing: { label: 'В обработке', variant: 'outline' },
  shipped: { label: 'Отправлен', variant: 'pink' },
  delivered: { label: 'Доставлен', variant: 'default' },
  cancelled: { label: 'Отменён', variant: 'muted' },
};

export function AdminOrdersPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-white mb-6">Заказы</h1>
      <div className="bg-brand-black-700 border border-brand-black-600 rounded-[2px] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">ID</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Покупатель</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Сумма</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Статус</th>
              <th className="px-4 py-3 text-left text-brand-charcoal-400 font-medium">Дата</th>
            </tr>
          </thead>
          <tbody>
            {MOCK_ORDERS.map((order) => {
              const st = STATUS_LABELS[order.status] || STATUS_LABELS.pending;
              return (
                <tr key={order.id} className="border-b border-brand-black-600 hover:bg-brand-black-800 transition-colors">
                  <td className="px-4 py-3 text-brand-pink-500 font-medium">{order.id}</td>
                  <td className="px-4 py-3 text-white">{order.customer}</td>
                  <td className="px-4 py-3 text-white">{order.total.toLocaleString('ru-RU')} ₽</td>
                  <td className="px-4 py-3">
                    <Badge variant={st.variant} size="sm">{st.label}</Badge>
                  </td>
                  <td className="px-4 py-3 text-brand-charcoal-400">{order.date}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
