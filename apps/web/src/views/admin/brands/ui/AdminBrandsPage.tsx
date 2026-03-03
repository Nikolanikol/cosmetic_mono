/**
 * Admin Brands List
 * Full CRUD: список → inline edit/delete + кнопка «Добавить»
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, Star, X, Check, RefreshCw } from 'lucide-react';
import {
  getBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from '@packages/api/brands';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { Badge } from '@/shared/ui/Badge';
import { cn } from '@/shared/lib/cn';
import type { Brand, BrandInsert, OriginCountry } from '@packages/types';
import { COUNTRY_FLAGS, COUNTRY_NAMES_RU } from '@packages/types';
import { generatePromoCode } from '@packages/api/promo-codes';

// ── Form state ────────────────────────────────────────────────────────────────

interface BrandForm {
  name: string;
  slug: string;
  origin_country: OriginCountry;
  logo_url: string;
  description: string;
  is_featured: boolean;
}

const EMPTY_FORM: BrandForm = {
  name: '',
  slug: '',
  origin_country: 'KR',
  logo_url: '',
  description: '',
  is_featured: false,
};

const COUNTRIES = Object.entries(COUNTRY_NAMES_RU) as [OriginCountry, string][];

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Input class ───────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-600 focus:outline-none focus:border-brand-pink-500 transition-colors';

const selectCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand-pink-500 transition-colors';

// ── Brand Form Panel ──────────────────────────────────────────────────────────

function BrandFormPanel({
  initial,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial: BrandForm;
  onSave: (f: BrandForm) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string;
}) {
  const [form, setForm] = useState<BrandForm>(initial);
  const set = <K extends keyof BrandForm>(k: K, v: BrandForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="bg-brand-black-800 border border-brand-pink-500/40 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Название *</label>
          <input
            value={form.name}
            onChange={(e) => {
              set('name', e.target.value);
              if (!initial.slug) set('slug', slugify(e.target.value));
            }}
            placeholder="COSRX"
            className={inputCls}
          />
        </div>

        {/* Slug */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Slug *</label>
          <div className="flex gap-2">
            <input
              value={form.slug}
              onChange={(e) => set('slug', e.target.value)}
              placeholder="cosrx"
              className={cn(inputCls, 'flex-1 font-mono')}
            />
            <button
              type="button"
              onClick={() => set('slug', slugify(form.name))}
              disabled={!form.name}
              title="Авто-slug"
              className="px-3 py-2 bg-brand-black-700 border border-brand-black-600 rounded-lg text-xs text-brand-charcoal-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Country */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Страна *</label>
          <select
            value={form.origin_country}
            onChange={(e) => set('origin_country', e.target.value as OriginCountry)}
            className={selectCls}
          >
            {COUNTRIES.map(([code, name]) => (
              <option key={code} value={code}>
                {COUNTRY_FLAGS[code]} {name}
              </option>
            ))}
          </select>
        </div>

        {/* Logo URL */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">URL логотипа</label>
          <input
            value={form.logo_url}
            onChange={(e) => set('logo_url', e.target.value)}
            placeholder="https://example.com/logo.png"
            className={inputCls}
          />
        </div>
      </div>

      {/* Description */}
      <div className="space-y-1">
        <label className="text-xs text-brand-charcoal-400">Описание</label>
        <textarea
          value={form.description}
          onChange={(e) => set('description', e.target.value)}
          rows={2}
          placeholder="Краткое описание бренда…"
          className={cn(inputCls, 'resize-none')}
        />
      </div>

      {/* Featured toggle */}
      <label className="flex items-center gap-2.5 cursor-pointer select-none">
        <div
          onClick={() => set('is_featured', !form.is_featured)}
          className={cn(
            'w-9 h-5 rounded-full transition-colors relative',
            form.is_featured ? 'bg-brand-pink-500' : 'bg-brand-black-600'
          )}
        >
          <div
            className={cn(
              'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
              form.is_featured ? 'translate-x-4' : 'translate-x-0.5'
            )}
          />
        </div>
        <span className="text-sm text-brand-charcoal-300">Показывать на главной (хит)</span>
      </label>

      {error && (
        <p className="text-red-400 text-xs">{error}</p>
      )}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={!form.name || !form.slug || isPending}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            form.name && form.slug && !isPending
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

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminBrandsPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data: brands = [], isLoading } = useQuery({
    queryKey: ['admin', 'brands'],
    queryFn: () => getBrands(supabaseBrowser),
  });

  const createMutation = useMutation({
    mutationFn: (form: BrandForm) =>
      createBrand(supabaseBrowser, {
        name: form.name,
        slug: form.slug,
        origin_country: form.origin_country,
        logo_url: form.logo_url || null,
        description: form.description || null,
        is_featured: form.is_featured,
      } as BrandInsert),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setCreating(false);
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, form }: { id: string; form: BrandForm }) =>
      updateBrand(supabaseBrowser, id, {
        name: form.name,
        slug: form.slug,
        origin_country: form.origin_country,
        logo_url: form.logo_url || null,
        description: form.description || null,
        is_featured: form.is_featured,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setEditingId(null);
      setFormError('');
    },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteBrand(supabaseBrowser, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'brands'] });
      queryClient.invalidateQueries({ queryKey: ['brands'] });
      setConfirmDelete(null);
    },
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Бренды</h1>
          {!isLoading && (
            <p className="text-brand-charcoal-400 text-sm mt-0.5">{brands.length} брендов</p>
          )}
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setFormError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить бренд
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <BrandFormPanel
          initial={EMPTY_FORM}
          onSave={(f) => createMutation.mutate(f)}
          onCancel={() => { setCreating(false); setFormError(''); }}
          isPending={createMutation.isPending}
          error={formError}
        />
      )}

      {/* Table */}
      <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Бренд</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden sm:table-cell">Страна</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden md:table-cell">Slug</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Хит</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-black-600/50">
                    <td colSpan={5} className="px-5 py-3.5">
                      <div className="h-3 bg-brand-black-700 rounded animate-pulse" style={{ width: `${50 + i * 8}%` }} />
                    </td>
                  </tr>
                ))
              : brands.length === 0
              ? (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-brand-charcoal-500">
                    Брендов нет. Добавьте первый!
                  </td>
                </tr>
              )
              : brands.map((brand) => (
                  <>
                    <tr
                      key={brand.id}
                      className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          {brand.logo_url ? (
                            <img
                              src={brand.logo_url}
                              alt={brand.name}
                              className="w-8 h-8 rounded object-contain bg-white/5"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded bg-brand-black-700 flex items-center justify-center text-brand-charcoal-500 text-xs font-bold">
                              {brand.name.charAt(0)}
                            </div>
                          )}
                          <span className="text-white text-xs font-medium">{brand.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="text-brand-charcoal-300 text-xs">
                          {COUNTRY_FLAGS[brand.origin_country]} {COUNTRY_NAMES_RU[brand.origin_country]}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="font-mono text-brand-charcoal-500 text-xs">{brand.slug}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        {brand.is_featured ? (
                          <Star className="w-4 h-4 text-brand-pink-400 fill-brand-pink-400/30" />
                        ) : (
                          <span className="text-brand-charcoal-700 text-xs">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(editingId === brand.id ? null : brand.id);
                              setCreating(false);
                              setFormError('');
                            }}
                            className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-white hover:bg-brand-black-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === brand.id ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <button
                                onClick={() => deleteMutation.mutate(brand.id)}
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
                              onClick={() => setConfirmDelete(brand.id)}
                              className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editingId === brand.id && (
                      <tr key={`${brand.id}-edit`} className="border-b border-brand-black-600/50">
                        <td colSpan={5} className="px-5 py-3">
                          <BrandFormPanel
                            initial={{
                              name: brand.name,
                              slug: brand.slug,
                              origin_country: brand.origin_country,
                              logo_url: brand.logo_url ?? '',
                              description: brand.description ?? '',
                              is_featured: brand.is_featured,
                            }}
                            onSave={(f) => updateMutation.mutate({ id: brand.id, form: f })}
                            onCancel={() => { setEditingId(null); setFormError(''); }}
                            isPending={updateMutation.isPending}
                            error={formError}
                          />
                        </td>
                      </tr>
                    )}
                  </>
                ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
