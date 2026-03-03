/**
 * Admin Categories List
 * Tree view (родитель → дочерние), inline create/edit/delete
 */

'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, X, Check, RefreshCw, ChevronRight } from 'lucide-react';
import { getCategories, createCategory } from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { cn } from '@/shared/lib/cn';
import type { Category, CategoryInsert } from '@packages/types';

// ── Form state ────────────────────────────────────────────────────────────────

interface CatForm {
  name_ru: string;
  name_en: string;
  slug: string;
  parent_id: string;
  sort_order: string;
  image_url: string;
}

const EMPTY_FORM: CatForm = {
  name_ru: '',
  name_en: '',
  slug: '',
  parent_id: '',
  sort_order: '0',
  image_url: '',
};

const inputCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-600 focus:outline-none focus:border-brand-pink-500 transition-colors';

const selectCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand-pink-500 transition-colors';

function slugify(text: string): string {
  const RU: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return text.toLowerCase().split('').map((c) => RU[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

// ── Category Form Panel ───────────────────────────────────────────────────────

function CatFormPanel({
  initial,
  categories,
  editId,
  onSave,
  onCancel,
  isPending,
  error,
}: {
  initial: CatForm;
  categories: Category[];
  editId?: string;
  onSave: (f: CatForm) => void;
  onCancel: () => void;
  isPending: boolean;
  error: string;
}) {
  const [form, setForm] = useState<CatForm>(initial);
  const set = <K extends keyof CatForm>(k: K, v: CatForm[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  // Root categories only (can't nest more than 2 levels)
  const roots = categories.filter((c) => !c.parent_id && c.id !== editId);

  return (
    <div className="bg-brand-black-800 border border-brand-pink-500/40 rounded-xl p-5 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Name RU */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Название (рус) *</label>
          <input
            value={form.name_ru}
            onChange={(e) => {
              set('name_ru', e.target.value);
              if (!initial.slug) set('slug', slugify(e.target.value));
            }}
            placeholder="Сыворотки"
            className={inputCls}
          />
        </div>

        {/* Name EN */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Название (eng)</label>
          <input
            value={form.name_en}
            onChange={(e) => set('name_en', e.target.value)}
            placeholder="Serums"
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
              placeholder="serums"
              className={cn(inputCls, 'flex-1 font-mono')}
            />
            <button
              type="button"
              onClick={() => set('slug', slugify(form.name_ru))}
              disabled={!form.name_ru}
              title="Авто-slug"
              className="px-3 py-2 bg-brand-black-700 border border-brand-black-600 rounded-lg text-xs text-brand-charcoal-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Parent */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Родительская категория</label>
          <select
            value={form.parent_id}
            onChange={(e) => set('parent_id', e.target.value)}
            className={selectCls}
          >
            <option value="">— корневая —</option>
            {roots.map((c) => (
              <option key={c.id} value={c.id}>{c.name_ru}</option>
            ))}
          </select>
        </div>

        {/* Sort order */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">Порядок сортировки</label>
          <input
            type="number"
            value={form.sort_order}
            onChange={(e) => set('sort_order', e.target.value)}
            placeholder="0"
            className={inputCls}
          />
        </div>

        {/* Image URL */}
        <div className="space-y-1">
          <label className="text-xs text-brand-charcoal-400">URL изображения</label>
          <input
            value={form.image_url}
            onChange={(e) => set('image_url', e.target.value)}
            placeholder="https://example.com/cat.jpg"
            className={inputCls}
          />
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="button"
          onClick={() => onSave(form)}
          disabled={!form.name_ru || !form.slug || isPending}
          className={cn(
            'flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors',
            form.name_ru && form.slug && !isPending
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

export function AdminCategoriesPage() {
  const queryClient = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [formError, setFormError] = useState('');

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['admin', 'categories'],
    queryFn: () => getCategories(supabaseBrowser),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
    queryClient.invalidateQueries({ queryKey: ['categories'] });
  };

  const createMutation = useMutation({
    mutationFn: (form: CatForm) =>
      createCategory(supabaseBrowser, {
        name_ru: form.name_ru,
        name_en: form.name_en || form.name_ru,
        slug: form.slug,
        parent_id: form.parent_id || null,
        sort_order: parseInt(form.sort_order) || 0,
        image_url: form.image_url || null,
      } as CategoryInsert),
    onSuccess: () => { invalidate(); setCreating(false); setFormError(''); },
    onError: (e: Error) => setFormError(e.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, form }: { id: string; form: CatForm }) => {
      const { error } = await supabaseBrowser
        .from('categories')
        .update({
          name_ru: form.name_ru,
          name_en: form.name_en || form.name_ru,
          slug: form.slug,
          parent_id: form.parent_id || null,
          sort_order: parseInt(form.sort_order) || 0,
          image_url: form.image_url || null,
        })
        .eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { invalidate(); setEditingId(null); setFormError(''); },
    onError: (e: Error) => setFormError(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabaseBrowser.from('categories').delete().eq('id', id);
      if (error) throw new Error(error.message);
    },
    onSuccess: () => { invalidate(); setConfirmDelete(null); },
  });

  // Build tree display: roots first, then children indented
  const roots     = categories.filter((c) => !c.parent_id);
  const childrenOf = (id: string) => categories.filter((c) => c.parent_id === id);

  const rows: { cat: Category; isChild: boolean }[] = [];
  roots.forEach((root) => {
    rows.push({ cat: root, isChild: false });
    childrenOf(root.id).forEach((child) => {
      rows.push({ cat: child, isChild: true });
    });
  });

  return (
    <div className="p-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Категории</h1>
          {!isLoading && (
            <p className="text-brand-charcoal-400 text-sm mt-0.5">{categories.length} категорий</p>
          )}
        </div>
        {!creating && (
          <button
            onClick={() => { setCreating(true); setEditingId(null); setFormError(''); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-brand-pink-500 hover:bg-brand-pink-400 text-white text-sm font-medium rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            Добавить категорию
          </button>
        )}
      </div>

      {/* Create form */}
      {creating && (
        <CatFormPanel
          initial={EMPTY_FORM}
          categories={categories}
          onSave={(f) => createMutation.mutate(f)}
          onCancel={() => { setCreating(false); setFormError(''); }}
          isPending={createMutation.isPending}
          error={formError}
        />
      )}

      {/* Tree table */}
      <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-brand-black-600">
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium">Категория</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden sm:table-cell">Slug</th>
              <th className="px-5 py-3 text-left text-brand-charcoal-400 text-xs font-medium hidden md:table-cell">Порядок</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {isLoading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-b border-brand-black-600/50">
                    <td colSpan={4} className="px-5 py-3.5">
                      <div className="h-3 bg-brand-black-700 rounded animate-pulse" style={{ width: `${40 + i * 10}%` }} />
                    </td>
                  </tr>
                ))
              : rows.length === 0
              ? (
                <tr>
                  <td colSpan={4} className="px-5 py-12 text-center text-brand-charcoal-500">
                    Категорий нет. Добавьте первую!
                  </td>
                </tr>
              )
              : rows.map(({ cat, isChild }) => (
                  <>
                    <tr
                      key={cat.id}
                      className="border-b border-brand-black-600/50 hover:bg-brand-black-700/40 transition-colors"
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-2">
                          {isChild && (
                            <ChevronRight className="w-3.5 h-3.5 text-brand-charcoal-600 flex-shrink-0 ml-3" />
                          )}
                          <span className={cn(
                            'text-xs font-medium',
                            isChild ? 'text-brand-charcoal-300' : 'text-white'
                          )}>
                            {cat.name_ru}
                          </span>
                          {cat.name_en && cat.name_en !== cat.name_ru && (
                            <span className="text-brand-charcoal-600 text-xs">/ {cat.name_en}</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden sm:table-cell">
                        <span className="font-mono text-brand-charcoal-500 text-xs">{cat.slug}</span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <span className="text-brand-charcoal-500 text-xs">{cat.sort_order}</span>
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => {
                              setEditingId(editingId === cat.id ? null : cat.id);
                              setCreating(false);
                              setFormError('');
                            }}
                            className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-white hover:bg-brand-black-600 transition-colors"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          {confirmDelete === cat.id ? (
                            <span className="flex items-center gap-1.5 text-xs">
                              <button
                                onClick={() => deleteMutation.mutate(cat.id)}
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
                              onClick={() => setConfirmDelete(cat.id)}
                              className="p-1.5 rounded-lg text-brand-charcoal-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    {editingId === cat.id && (
                      <tr key={`${cat.id}-edit`} className="border-b border-brand-black-600/50">
                        <td colSpan={4} className="px-5 py-3">
                          <CatFormPanel
                            initial={{
                              name_ru: cat.name_ru,
                              name_en: cat.name_en,
                              slug: cat.slug,
                              parent_id: cat.parent_id ?? '',
                              sort_order: cat.sort_order.toString(),
                              image_url: cat.image_url ?? '',
                            }}
                            categories={categories}
                            editId={cat.id}
                            onSave={(f) => updateMutation.mutate({ id: cat.id, form: f })}
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
