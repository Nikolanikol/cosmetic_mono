/**
 * Admin Products List
 * Direct Supabase query (includes inactive products unlike storefront API)
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Pencil, Trash2, ChevronLeft, ChevronRight } from 'lucide-react';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { formatPrice } from '@/shared/lib/formatPrice';
import { Badge } from '@/shared/ui/Badge';
import { Button } from '@/shared/ui/Button';
import { deleteProduct } from '@packages/api/products';

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminProduct {
  id: string;
  name_ru: string;
  slug: string;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  brand: { name: string } | null;
  category: { name_ru: string } | null;
  variants: { price_rub: number; stock: number }[];
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch]       = useState('');
  const [activeFilter, setActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [page, setPage]           = useState(1);
  const [confirmDelete, setConfirm] = useState<string | null>(null);
  const limit = 20;

  // Direct query — getProducts() always filters is_active=true (storefront only)
  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'products', { search, activeFilter, page }],
    queryFn: async () => {
      const from = (page - 1) * limit;
      const to   = from + limit - 1;

      let q = supabaseBrowser
        .from('products')
        .select(
          `id, name_ru, slug, is_active, is_featured, created_at,
           brand:brands!inner(name),
           category:categories!inner(name_ru),
           variants:product_variants(price_rub, stock)`,
          { count: 'exact' }
        );

      if (search)                      q = q.or(`name_ru.ilike.%${search}%,name_en.ilike.%${search}%`);
      if (activeFilter === 'active')   q = q.eq('is_active', true);
      if (activeFilter === 'inactive') q = q.eq('is_active', false);

      const { data, count, error } = await q
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw new Error(error.message);
      return { products: (data ?? []) as unknown as AdminProduct[], total: count ?? 0 };
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(supabaseBrowser, id),
    onSuccess: () => {
      setConfirm(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
    },
  });

  const products   = data?.products ?? [];
  const total      = data?.total ?? 0;
  const totalPages = Math.ceil(total / limit) || 1;

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Товары</h1>
          {!isLoading && <p className="text-brand-charcoal-400 text-sm mt-0.5">{total} товаров</p>}
        </div>
        <Button href="/admin/products/create" size="sm">
          <Plus className="w-4 h-4 mr-1.5" />
          Добавить товар
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-charcoal-500" />
          <input
            type="text"
            placeholder="Поиск по названию…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-9 pr-4 py-2 bg-brand-black-800 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-500 focus:outline-none focus:border-brand-pink-500"
          />
        </div>
        <div className="flex gap-1 bg-brand-black-800 border border-brand-black-600 rounded-lg p-1">
          {(['all', 'active', 'inactive'] as const).map((f) => (
            <button
              key={f}
              onClick={() => { setActive(f); setPage(1); }}
              className={`px-3 py-1.5 rounded-md text-xs transition-colors ${
                activeFilter === f
                  ? 'bg-brand-black-600 text-white'
                  : 'text-brand-charcoal-400 hover:text-white'
              }`}
            >
              {{ all: 'Все', active: 'Активные', inactive: 'Скрытые' }[f]}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Название</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden md:table-cell">Бренд / Категория</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Цена</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden sm:table-cell">Склад</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Статус</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-black-600/50">
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-3 bg-brand-black-700 rounded animate-pulse" style={{ width: `${55 + (i % 4) * 10}%` }} />
                    </td>
                  </tr>
                ))
              : products.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-brand-charcoal-500">
                    Товаров не найдено
                  </td>
                </tr>
              )
              : products.map((p) => {
                  const price = p.variants?.[0]?.price_rub;
                  const stock = p.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? 0;
                  return (
                    <tr
                      key={p.id}
                      className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <p className="text-white text-xs font-medium line-clamp-1">{p.name_ru}</p>
                        <p className="text-brand-charcoal-500 text-xs mt-0.5 font-mono">{p.slug}</p>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <p className="text-brand-charcoal-300 text-xs">{(p.brand as any)?.name ?? '—'}</p>
                        <p className="text-brand-charcoal-500 text-xs mt-0.5">{(p.category as any)?.name_ru ?? '—'}</p>
                      </td>
                      <td className="px-5 py-3.5 text-white text-xs">
                        {price != null ? formatPrice(price) : '—'}
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className={stock === 0 ? 'text-red-400 text-xs' : 'text-brand-charcoal-300 text-xs'}>
                          {stock === 0 ? 'Нет' : `${stock} шт.`}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Badge variant={p.is_active ? 'outline' : 'muted'} size="sm">
                          {p.is_active ? 'Активен' : 'Скрыт'}
                        </Badge>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <Link
                            href={`/admin/products/${p.id}/edit`}
                            className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-white hover:bg-brand-black-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Link>
                          {confirmDelete === p.id ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <button
                                onClick={() => deleteMutation.mutate(p.id)}
                                disabled={deleteMutation.isPending}
                                className="text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                              >
                                Удалить
                              </button>
                              <button
                                onClick={() => setConfirm(null)}
                                className="text-brand-charcoal-500 hover:text-white transition-colors"
                              >
                                Отмена
                              </button>
                            </span>
                          ) : (
                            <button
                              onClick={() => setConfirm(p.id)}
                              className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
          </tbody>
        </table>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-black-600">
            <span className="text-brand-charcoal-400 text-xs">Страница {page} из {totalPages}</span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded-lg border border-brand-black-600 text-brand-charcoal-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded-lg border border-brand-black-600 text-brand-charcoal-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
