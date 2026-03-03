/**
 * Admin Promo Codes
 * Список + форма создания/редактирования + inline delete
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Check, Shuffle,
  ChevronLeft, ChevronRight, ToggleLeft, ToggleRight,
} from 'lucide-react';
import {
  getPromoCodes,
  createPromoCode,
  updatePromoCode,
  deletePromoCode,
  generatePromoCode,
} from '@packages/api/promo-codes';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/cn';
import type { PromoCode, PromoCodeInsert, DiscountType } from '@packages/types';
import { formatPrice } from '@/shared/lib/formatPrice';

// ── Form state ────────────────────────────────────────────────────────────────

interface PromoForm {
  code: string;
  discount_type: DiscountType;
  discount_value: string;
  min_order_rub: string;
  usage_limit: string;
  expires_at: string;
  is_active: boolean;
}

const EMPTY_FORM: PromoForm = {
  code: '',
  discount_type: 'percent',
  discount_value: '',
  min_order_rub: '',
  usage_limit: '',
  expires_at: '',
  is_active: true,
};

const inputCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-600 focus:outline-none focus:border-brand-pink-500 transition-colors';

// ── Promo Form Panel ──────────────────────────────────────────────────────────

function PromoFormPanel({
  initial,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial: PromoForm;
  onSave: (f: PromoForm) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string;
}) {
  const [form, setForm] = useState<PromoForm>(initial);
  const set = <K extends keyof PromoForm>(k: K, v: PromoForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const canSave = !!form.code && !!form.discount_value;

  return (
    <div className="bg-brand-black-800 border border-brand-pink-500/40 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Code */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Код промокода *</label>
          <div className="flex gap-2">
            <input
              value={form.code}
              onChange={(e) => set('code', e.target.value.toUpperCase())}
              placeholder="SAVE20"
              className={cn(inputCls, 'flex-1 font-mono tracking-widest uppercase')}
            />
            <button
              type="button"
              onClick={() => set('code', generatePromoCode(8))}
              title="Генерировать случайный код"
              className="px-3 py-2 bg-brand-black-700 border border-brand-black-600 rounded-lg text-brand-charcoal-300 hover:text-white transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Type */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Тип скидки *</label>
          <div className="flex gap-1 p-1 bg-brand-black-900 border border-brand-black-600 rounded-lg">
            {(['percent', 'fixed_rub'] as DiscountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => set('discount_type', type)}
                className={cn(
                  'flex-1 py-1.5 rounded-md text-xs transition-colors',
                  form.discount_type === type
                    ? 'bg-brand-pink-500 text-white'
                    : 'text-brand-charcoal-400 hover:text-white'
                )}
              >
                {type === 'percent' ? '% Процент' : '₽ Фиксированная'}
              </button>
            ))}
          </div>
        </div>

        {/* Value */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">
            Значение скидки * {form.discount_type === 'percent' ? '(%)' : '(₽)'}
          </label>
          <input
            type="number"
            min={0}
            max={form.discount_type === 'percent' ? 100 : undefined}
            value={form.discount_value}
            onChange={(e) => set('discount_value', e.target.value)}
            placeholder={form.discount_type === 'percent' ? '20' : '500'}
            className={inputCls}
          />
        </div>

        {/* Min order */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Мин. сумма заказа (₽)</label>
          <input
            type="number"
            min={0}
            value={form.min_order_rub}
            onChange={(e) => set('min_order_rub', e.target.value)}
            placeholder="оставьте пустым"
            className={inputCls}
          />
        </div>

        {/* Usage limit */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Лимит использований</label>
          <input
            type="number"
            min={0}
            value={form.usage_limit}
            onChange={(e) => set('usage_limit', e.target.value)}
            placeholder="без ограничений"
            className={inputCls}
          />
        </div>

        {/* Expires at */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Дата окончания</label>
          <input
            type="datetime-local"
            value={form.expires_at}
            onChange={(e) => set('expires_at', e.target.value)}
            className={cn(inputCls, 'text-brand-charcoal-300')}
          />
        </div>
      </div>

      {/* Active toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => set('is_active', !form.is_active)}
          className={cn(
            'w-9 h-5 rounded-full transition-colors relative',
            form.is_active ? 'bg-brand-pink-500' : 'bg-brand-black-600'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              form.is_active ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </div>
        <span className="text-sm text-brand-charcoal-300">Промокод активен</span>
      </label>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={!canSave || isPending}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            canSave && !isPending
              ? 'bg-brand-pink-500 hover:bg-brand-pink-400 text-white'
              : 'bg-brand-black-700 text-brand-charcoal-500 cursor-not-allowed'
          )}
        >
          <Check className="w-3.5 h-3.5" />
          {isPending ? 'Сохранение…' : 'Сохранить'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm text-brand-charcoal-400 hover:text-white transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Отмена
        </button>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isExpired(expiresAt: string | null): boolean {
  if (!expiresAt) return false;
  return new Date(expiresAt) < new Date();
}

function formatExpiry(expiresAt: string | null): string {
  if (!expiresAt) return '∞';
  return new Date(expiresAt).toLocaleDateString('ru-RU');
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminPromoCodesPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating]         = useState(false);
  const [editingId, setEditingId]       = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError]       = useState('');
  const [page, setPage]                 = useState(1);
  const [activeFilter, setActiveFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const limit = 20;

  const { data, isLoading } = useQuery({
    queryKey: ['admin', 'promo-codes', { page, activeFilter }],
    queryFn: () => getPromoCodes(supabaseBrowser, {
      page,
      limit,
      ...(activeFilter === 'active' ? { isActive: true } : {}),
      ...(activeFilter === 'inactive' ? { isActive: false } : {}),
    }),
  });

  const promoCodes   = data?.promoCodes ?? [];
  const totalPages   = data?.total_pages ?? 1;
  const total        = data?.total ?? 0;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['admin', 'promo-codes'] });

  function formToInsert(form: PromoForm): PromoCodeInsert {
    return {
      code:           form.code,
      discount_type:  form.discount_type,
      discount_value: parseFloat(form.discount_value),
      min_order_rub:  form.min_order_rub  ? parseFloat(form.min_order_rub)  : null,
      usage_limit:    form.usage_limit    ? parseInt(form.usage_limit)       : null,
      expires_at:     form.expires_at ? new Date(form.expires_at).toISOString() : null,
      is_active:      form.is_active,
    };
  }

  const createMutation = useMutation({
    mutationFn: (form: PromoForm) => createPromoCode(supabaseBrowser, formToInsert(form)),
    onSuccess: () => { invalidate(); setCreating(false); setFormError(''); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: PromoForm }) =>
      updatePromoCode(supabaseBrowser, id, formToInsert(form)),
    onSuccess: () => { invalidate(); setEditingId(null); setFormError(''); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deletePromoCode(supabaseBrowser, id),
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, is_active }: { id: string; is_active: boolean }) =>
      updatePromoCode(supabaseBrowser, id, { is_active }),
    onSuccess: invalidate,
  });

  // Build initial form from existing promo code (for edit)
  function promoToForm(p: PromoCode): PromoForm {
    const expiresLocal = p.expires_at
      ? new Date(p.expires_at).toISOString().slice(0, 16)
      : '';
    return {
      code:           p.code,
      discount_type:  p.discount_type,
      discount_value: p.discount_value.toString(),
      min_order_rub:  p.min_order_rub?.toString() ?? '',
      usage_limit:    p.usage_limit?.toString() ?? '',
      expires_at:     expiresLocal,
      is_active:      p.is_active,
    };
  }

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Промокоды</h1>
          {!isLoading && (
            <p className="text-brand-charcoal-400 text-sm mt-0.5">{total} промокодов</p>
          )}
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setFormError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Создать промокод
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <PromoFormPanel
          initial={EMPTY_FORM}
          onSave={(f) => createMutation.mutate(f)}
          onCancel={() => { setCreating(false); setFormError(''); }}
          isPending={createMutation.isPending}
          error={formError}
        />
      )}

      {/* Filters */}
      <div className="flex gap-1 bg-brand-black-800 border border-brand-black-600 rounded-lg p-1 w-fit">
        {(['all', 'active', 'inactive'] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setActiveFilter(f); setPage(1); }}
            className={cn(
              'px-3 py-1.5 rounded-md text-xs transition-colors',
              activeFilter === f
                ? 'bg-brand-black-600 text-white'
                : 'text-brand-charcoal-400 hover:text-white'
            )}
          >
            {{ all: 'Все', active: 'Активные', inactive: 'Отключённые' }[f]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Код</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Скидка</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden sm:table-cell">Использований</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden md:table-cell">Срок</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Статус</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-black-600/50">
                    <td colSpan={6} className="px-5 py-3.5">
                      <div className="h-3 bg-brand-black-700 rounded animate-pulse" style={{ width: `${55 + i * 6}%` }} />
                    </td>
                  </tr>
                ))
              : promoCodes.length === 0
              ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-brand-charcoal-500">
                    Промокодов не найдено
                  </td>
                </tr>
              )
              : promoCodes.map((promo) => {
                  const expired = isExpired(promo.expires_at);
                  return (
                    <>
                      <tr
                        key={promo.id}
                        className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                      >
                        <td className="px-5 py-3.5">
                          <span className="font-mono text-sm text-brand-pink-400 tracking-widest">
                            {promo.code}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <span className="text-white text-xs font-medium">
                            {promo.discount_type === 'percent'
                              ? `${promo.discount_value}%`
                              : formatPrice(promo.discount_value)}
                          </span>
                          {promo.min_order_rub && (
                            <p className="text-brand-charcoal-500 text-xs mt-0.5">
                              от {formatPrice(promo.min_order_rub)}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3.5 hidden sm:table-cell">
                          <span className="text-brand-charcoal-300 text-xs">
                            {promo.used_count}
                            {promo.usage_limit ? ` / ${promo.usage_limit}` : ' / ∞'}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 hidden md:table-cell">
                          <span className={cn(
                            'text-xs',
                            expired ? 'text-red-400' : 'text-brand-charcoal-300'
                          )}>
                            {expired ? '⚠ ' : ''}{formatExpiry(promo.expires_at)}
                          </span>
                        </td>
                        <td className="px-5 py-3.5">
                          <button
                            onClick={() => toggleMutation.mutate({ id: promo.id, is_active: !promo.is_active })}
                            disabled={toggleMutation.isPending}
                            className="transition-opacity disabled:opacity-50"
                          >
                            {promo.is_active ? (
                              <Badge variant="outline" size="sm">Активен</Badge>
                            ) : (
                              <Badge variant="muted" size="sm">Выкл.</Badge>
                            )}
                          </button>
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-1 justify-end">
                            <button
                              onClick={() => {
                                setEditingId(editingId === promo.id ? null : promo.id);
                                setCreating(false);
                                setFormError('');
                              }}
                              className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-white hover:bg-brand-black-600 transition-colors"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            {confirmDelete === promo.id ? (
                              <span className="flex items-center gap-1.5 text-xs">
                                <button
                                  onClick={() => deleteMutation.mutate(promo.id)}
                                  disabled={deleteMutation.isPending}
                                  className="text-red-400 hover:text-red-300 font-medium transition-colors disabled:opacity-50"
                                >
                                  Удалить
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(null)}
                                  className="text-brand-charcoal-500 hover:text-white transition-colors"
                                >
                                  Отмена
                                </button>
                              </span>
                            ) : (
                              <button
                                onClick={() => setConfirmDelete(promo.id)}
                                className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {editingId === promo.id && (
                        <tr key={`${promo.id}-edit`} className="border-b border-brand-black-600/50">
                          <td colSpan={6} className="px-5 py-3">
                            <PromoFormPanel
                              initial={promoToForm(promo)}
                              onSave={(f) => updateMutation.mutate({ id: promo.id, form: f })}
                              onCancel={() => { setEditingId(null); setFormError(''); }}
                              isPending={updateMutation.isPending}
                              error={formError}
                            />
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-5 py-3 border-t border-brand-black-600">
            <span className="text-brand-charcoal-400 text-xs">
              Страница {page} из {totalPages}
            </span>
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
