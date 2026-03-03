/**
 * Admin Product Form — Create & Edit
 * Sections: основное, категоризация, SEO, варианты, изображения, ингредиенты
 */

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useQuery, useMutation } from '@tanstack/react-query';
import { ArrowLeft, Plus, Trash2, Sparkles, AlertCircle, Loader2 } from 'lucide-react';
import { getBrands } from '@packages/api/brands';
import { getCategories } from '@packages/api/products';
import { getProductById } from '@packages/api/products';
import {
  createProduct,
  updateProduct,
  createProductVariant,
  updateProductVariant,
  deleteProductVariant,
  createProductImage,
  createProductIngredient,
} from '@packages/api/products';
import { supabaseBrowser } from '@/shared/api/supabaseClient';
import { KBEAUTY_ROUTINE_STEPS } from '@packages/types';
import { cn } from '@/shared/lib/cn';
import type { SkinType, ProductTag } from '@packages/types';

// ── Slug helper ───────────────────────────────────────────────────────────────

const RU_MAP: Record<string, string> = {
  а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
  к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
  х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .split('')
    .map((c) => RU_MAP[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// ── Constants ─────────────────────────────────────────────────────────────────

const SKIN_TYPES: { value: SkinType; label: string }[] = [
  { value: 'dry',         label: 'Сухая'           },
  { value: 'oily',        label: 'Жирная'          },
  { value: 'combination', label: 'Комбинированная' },
  { value: 'sensitive',   label: 'Чувствительная'  },
  { value: 'normal',      label: 'Нормальная'       },
];

const PRODUCT_TAGS: ProductTag[] = [
  'антивозрастной','увлажнение','SPF','осветление',
  'питание','очищение','акне','чувствительная','сияние','лифтинг',
];

// ── Form state types ──────────────────────────────────────────────────────────

interface VariantForm {
  id?: string;
  name_ru: string;
  sku: string;
  price_rub: string;
  sale_price_rub: string;
  stock: string;
  volume: string;
}

interface ImageForm {
  id?: string;
  url: string;
  alt_ru: string;
  is_primary: boolean;
}

interface IngredientForm {
  id?: string;
  inci_name: string;
  name_ru: string;
  purpose_ru: string;
  is_highlighted: boolean;
  safety_rating: string;
}

interface ProductForm {
  name_ru: string;
  name_en: string;
  slug: string;
  description_ru: string;
  category_id: string;
  brand_id: string;
  is_active: boolean;
  is_featured: boolean;
  routine_step: string;
  skin_types: SkinType[];
  tags: ProductTag[];
  meta_title_ru: string;
  meta_description_ru: string;
}

const EMPTY_FORM: ProductForm = {
  name_ru: '', name_en: '', slug: '', description_ru: '',
  category_id: '', brand_id: '',
  is_active: true, is_featured: false,
  routine_step: '',
  skin_types: [], tags: [],
  meta_title_ru: '', meta_description_ru: '',
};

const EMPTY_VARIANT: VariantForm = {
  name_ru: '', sku: '', price_rub: '', sale_price_rub: '', stock: '0', volume: '',
};

const EMPTY_INGREDIENT: IngredientForm = {
  inci_name: '', name_ru: '', purpose_ru: '', is_highlighted: false, safety_rating: '',
};

// ── Props ─────────────────────────────────────────────────────────────────────

interface Props {
  mode: 'create' | 'edit';
  productId?: string;
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function AdminProductFormPage({ mode, productId }: Props) {
  const router = useRouter();

  // Reference data
  const { data: brands = [] }     = useQuery({ queryKey: ['brands'], queryFn: () => getBrands(supabaseBrowser) });
  const { data: categories = [] } = useQuery({ queryKey: ['categories'], queryFn: () => getCategories(supabaseBrowser) });

  // Existing product (edit mode)
  const { data: existingProduct } = useQuery({
    queryKey: ['admin', 'product', productId],
    queryFn:  () => getProductById(supabaseBrowser, productId!),
    enabled:  mode === 'edit' && !!productId,
  });

  // Form state
  const [form, setForm]               = useState<ProductForm>(EMPTY_FORM);
  const [variants, setVariants]       = useState<VariantForm[]>([{ ...EMPTY_VARIANT }]);
  const [images, setImages]           = useState<ImageForm[]>([]);
  const [ingredients, setIngredients] = useState<IngredientForm[]>([]);
  const [removedVariantIds, setRemovedVariantIds]         = useState<string[]>([]);
  const [removedIngredientIds, setRemovedIngredientIds]   = useState<string[]>([]);
  const [removedImageIds, setRemovedImageIds]             = useState<string[]>([]);
  const [submitError, setSubmitError] = useState('');
  const [seoLoading, setSeoLoading]   = useState(false);
  const [seoGenerated, setSeoGenerated] = useState(false);

  // Populate form in edit mode
  useEffect(() => {
    if (!existingProduct) return;
    const p = existingProduct;
    setForm({
      name_ru:            p.name_ru,
      name_en:            p.name_en,
      slug:               p.slug,
      description_ru:     p.description_ru ?? '',
      category_id:        p.category_id,
      brand_id:           p.brand_id,
      is_active:          p.is_active,
      is_featured:        p.is_featured,
      routine_step:       p.routine_step?.toString() ?? '',
      skin_types:         p.skin_types ?? [],
      tags:               p.tags ?? [],
      meta_title_ru:      p.meta_title_ru ?? '',
      meta_description_ru: p.meta_description_ru ?? '',
    });
    setVariants(p.variants.map((v) => ({
      id:            v.id,
      name_ru:       v.name_ru,
      sku:           v.sku,
      price_rub:     v.price_rub.toString(),
      sale_price_rub: v.sale_price_rub?.toString() ?? '',
      stock:         v.stock.toString(),
      volume:        (v.attributes as any)?.volume ?? '',
    })));
    setImages(p.images.map((img) => ({
      id:         img.id,
      url:        img.url,
      alt_ru:     img.alt_ru ?? '',
      is_primary: img.is_primary,
    })));
    setIngredients(p.ingredients.map((ing) => ({
      id:             ing.id,
      inci_name:      ing.inci_name,
      name_ru:        ing.name_ru,
      purpose_ru:     ing.purpose_ru ?? '',
      is_highlighted: ing.is_highlighted,
      safety_rating:  ing.safety_rating?.toString() ?? '',
    })));
  }, [existingProduct]);

  // ── Helpers ─────────────────────────────────────────────────────────────────

  const setField = <K extends keyof ProductForm>(key: K, val: ProductForm[K]) =>
    setForm((f) => ({ ...f, [key]: val }));

  const toggleArrayItem = <T extends string>(arr: T[], item: T): T[] =>
    arr.includes(item) ? arr.filter((x) => x !== item) : [...arr, item];

  function autoSlug() {
    setField('slug', slugify(form.name_ru));
  }

  async function generateSeo() {
    const brand = brands.find((b) => b.id === form.brand_id);
    const cat   = categories.find((c) => c.id === form.category_id);
    setSeoLoading(true);
    setSeoGenerated(false);
    try {
      const res = await fetch('/api/admin/generate-seo', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name_ru:       form.name_ru,
          name_en:       form.name_en || undefined,
          brand_name:    brand?.name ?? '',
          category_name: cat?.name_ru ?? '',
          description_ru: form.description_ru || undefined,
          skin_types:    form.skin_types,
          tags:          form.tags,
          routine_step:  form.routine_step ? parseInt(form.routine_step) : null,
          ingredients:   ingredients.filter((i) => i.inci_name).map((i) => ({
            inci_name:      i.inci_name,
            name_ru:        i.name_ru || undefined,
            purpose_ru:     i.purpose_ru || undefined,
            is_highlighted: i.is_highlighted,
          })),
        }),
      });
      if (!res.ok) throw new Error('Generation failed');
      const data = await res.json() as {
        meta_title_ru: string;
        meta_description_ru: string;
        description_ru: string;
      };
      setField('meta_title_ru', data.meta_title_ru);
      setField('meta_description_ru', data.meta_description_ru);
      // Fill description_ru only if empty
      if (!form.description_ru && data.description_ru) {
        setField('description_ru', data.description_ru);
      }
      setSeoGenerated(true);
    } catch (e) {
      console.error('[generateSeo]', e);
    } finally {
      setSeoLoading(false);
    }
  }

  // Helper: call SEO API and return generated data (used in submit)
  async function fetchGeneratedSeo() {
    const brand = brands.find((b) => b.id === form.brand_id);
    const cat   = categories.find((c) => c.id === form.category_id);
    const res = await fetch('/api/admin/generate-seo', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name_ru:       form.name_ru,
        name_en:       form.name_en || undefined,
        brand_name:    brand?.name ?? '',
        category_name: cat?.name_ru ?? '',
        description_ru: form.description_ru || undefined,
        skin_types:    form.skin_types,
        tags:          form.tags,
        routine_step:  form.routine_step ? parseInt(form.routine_step) : null,
        ingredients:   ingredients.filter((i) => i.inci_name).map((i) => ({
          inci_name:      i.inci_name,
          name_ru:        i.name_ru || undefined,
          purpose_ru:     i.purpose_ru || undefined,
          is_highlighted: i.is_highlighted,
        })),
      }),
    });
    if (!res.ok) return null;
    return res.json() as Promise<{
      meta_title_ru: string;
      meta_description_ru: string;
      description_ru: string;
    }>;
  }

  // ── Submit ───────────────────────────────────────────────────────────────────

  const submitMutation = useMutation({
    mutationFn: async () => {
      setSubmitError('');

      const base = {
        name_ru:             form.name_ru,
        name_en:             form.name_en,
        slug:                form.slug,
        description_ru:      form.description_ru || null,
        category_id:         form.category_id,
        brand_id:            form.brand_id,
        is_active:           form.is_active,
        is_featured:         form.is_featured,
        routine_step:        form.routine_step ? parseInt(form.routine_step) : null,
        skin_types:          form.skin_types,
        tags:                form.tags,
        meta_title_ru:       form.meta_title_ru || null,
        meta_description_ru: form.meta_description_ru || null,
      };

      if (mode === 'create') {
        // 1. Create product
        const product = await createProduct(supabaseBrowser, base);

        // 1b. Auto-generate SEO if meta fields are empty
        if (!form.meta_title_ru) {
          try {
            const seo = await fetchGeneratedSeo();
            if (seo) {
              await updateProduct(supabaseBrowser, product.id, {
                meta_title_ru:       seo.meta_title_ru || null,
                meta_description_ru: seo.meta_description_ru || null,
                ...(!form.description_ru && seo.description_ru
                  ? { description_ru: seo.description_ru }
                  : {}),
              });
            }
          } catch {
            // Non-critical — continue without SEO auto-generation
          }
        }

        // 2. Create variants
        for (const v of variants.filter((v) => v.name_ru && v.sku && v.price_rub)) {
          await createProductVariant(supabaseBrowser, {
            product_id:     product.id,
            name_ru:        v.name_ru,
            sku:            v.sku,
            price_rub:      parseFloat(v.price_rub),
            sale_price_rub: v.sale_price_rub ? parseFloat(v.sale_price_rub) : null,
            stock:          parseInt(v.stock) || 0,
            attributes:     v.volume ? { volume: v.volume } : {},
          });
        }

        // 3. Create images
        for (const [i, img] of images.filter((img) => img.url).entries()) {
          await createProductImage(supabaseBrowser, {
            product_id: product.id,
            url:        img.url,
            alt_ru:     img.alt_ru || null,
            is_primary: img.is_primary,
            sort_order: i,
          });
        }

        // 4. Create ingredients
        for (const ing of ingredients.filter((i) => i.inci_name)) {
          await createProductIngredient(supabaseBrowser, {
            product_id:     product.id,
            inci_name:      ing.inci_name,
            name_ru:        ing.name_ru,
            purpose_ru:     ing.purpose_ru || null,
            is_highlighted: ing.is_highlighted,
            safety_rating:  ing.safety_rating ? parseInt(ing.safety_rating) : null,
          });
        }
      } else {
        // EDIT MODE
        if (!productId) throw new Error('No product ID');

        // 1. Update product
        await updateProduct(supabaseBrowser, productId, base);

        // 2. Handle variants
        for (const id of removedVariantIds) {
          await deleteProductVariant(supabaseBrowser, id);
        }
        for (const v of variants.filter((v) => v.name_ru && v.sku && v.price_rub)) {
          if (v.id) {
            await updateProductVariant(supabaseBrowser, v.id, {
              name_ru:        v.name_ru,
              sku:            v.sku,
              price_rub:      parseFloat(v.price_rub),
              sale_price_rub: v.sale_price_rub ? parseFloat(v.sale_price_rub) : null,
              stock:          parseInt(v.stock) || 0,
              attributes:     v.volume ? { volume: v.volume } : {},
            });
          } else {
            await createProductVariant(supabaseBrowser, {
              product_id:     productId,
              name_ru:        v.name_ru,
              sku:            v.sku,
              price_rub:      parseFloat(v.price_rub),
              sale_price_rub: v.sale_price_rub ? parseFloat(v.sale_price_rub) : null,
              stock:          parseInt(v.stock) || 0,
              attributes:     v.volume ? { volume: v.volume } : {},
            });
          }
        }

        // 3. Handle images (delete removed, create new)
        for (const id of removedImageIds) {
          await supabaseBrowser.from('product_images').delete().eq('id', id);
        }
        for (const [i, img] of images.filter((img) => img.url && !img.id).entries()) {
          await createProductImage(supabaseBrowser, {
            product_id: productId,
            url:        img.url,
            alt_ru:     img.alt_ru || null,
            is_primary: img.is_primary,
            sort_order: i,
          });
        }

        // 4. Handle ingredients
        for (const id of removedIngredientIds) {
          await supabaseBrowser.from('product_ingredients').delete().eq('id', id);
        }
        for (const ing of ingredients.filter((i) => i.inci_name)) {
          if (!ing.id) {
            await createProductIngredient(supabaseBrowser, {
              product_id:     productId,
              inci_name:      ing.inci_name,
              name_ru:        ing.name_ru,
              purpose_ru:     ing.purpose_ru || null,
              is_highlighted: ing.is_highlighted,
              safety_rating:  ing.safety_rating ? parseInt(ing.safety_rating) : null,
            });
          } else {
            await supabaseBrowser
              .from('product_ingredients')
              .update({
                inci_name:      ing.inci_name,
                name_ru:        ing.name_ru,
                purpose_ru:     ing.purpose_ru || null,
                is_highlighted: ing.is_highlighted,
                safety_rating:  ing.safety_rating ? parseInt(ing.safety_rating) : null,
              })
              .eq('id', ing.id);
          }
        }
      }
    },
    onSuccess: () => router.push('/admin/products'),
    onError: (e: Error) => setSubmitError(e.message),
  });

  const isEdit   = mode === 'edit';
  const canSave  = !!form.name_ru && !!form.slug && !!form.category_id && !!form.brand_id;

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div className="p-6 max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/admin/products"
          className="flex items-center gap-1.5 text-sm text-brand-charcoal-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Товары
        </Link>
        <h1 className="text-xl font-bold text-white">
          {isEdit ? 'Редактировать товар' : 'Новый товар'}
        </h1>
      </div>

      {/* ── Section: Основное ─────────────────────────────────────────── */}
      <FormSection title="Основное">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Название (рус) *">
            <input
              value={form.name_ru}
              onChange={(e) => setField('name_ru', e.target.value)}
              placeholder="COSRX Advanced Snail Essence"
              className={inputCls}
            />
          </Field>
          <Field label="Название (eng)">
            <input
              value={form.name_en}
              onChange={(e) => setField('name_en', e.target.value)}
              placeholder="COSRX Advanced Snail 96 Mucin Power Essence"
              className={inputCls}
            />
          </Field>
        </div>

        <Field label="Slug *">
          <div className="flex gap-2">
            <input
              value={form.slug}
              onChange={(e) => setField('slug', e.target.value)}
              placeholder="cosrx-snail-96-mucin-essence"
              className={cn(inputCls, 'flex-1 font-mono')}
            />
            <button
              type="button"
              onClick={autoSlug}
              disabled={!form.name_ru}
              className="px-3 py-2 bg-brand-black-700 border border-brand-black-600 rounded-lg text-xs text-brand-charcoal-300 hover:text-white disabled:opacity-40 transition-colors"
            >
              Авто
            </button>
          </div>
        </Field>

        <Field label="Описание">
          <textarea
            value={form.description_ru}
            onChange={(e) => setField('description_ru', e.target.value)}
            rows={8}
            placeholder="Подробное описание товара… (AI заполнит при создании если оставить пустым)"
            className={cn(inputCls, 'resize-y')}
          />
        </Field>
      </FormSection>

      {/* ── Section: Категоризация ────────────────────────────────────── */}
      <FormSection title="Категоризация">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Бренд *">
            <select
              value={form.brand_id}
              onChange={(e) => setField('brand_id', e.target.value)}
              className={selectCls}
            >
              <option value="">— выберите —</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Категория *">
            <select
              value={form.category_id}
              onChange={(e) => setField('category_id', e.target.value)}
              className={selectCls}
            >
              <option value="">— выберите —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.parent_id ? `  └ ${c.name_ru}` : c.name_ru}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Шаг K-Beauty рутины">
          <select
            value={form.routine_step}
            onChange={(e) => setField('routine_step', e.target.value)}
            className={selectCls}
          >
            <option value="">— не выбран —</option>
            {Object.entries(KBEAUTY_ROUTINE_STEPS).map(([step, { name }]) => (
              <option key={step} value={step}>Шаг {step}: {name}</option>
            ))}
          </select>
        </Field>

        <Field label="Тип кожи">
          <div className="flex flex-wrap gap-2">
            {SKIN_TYPES.map(({ value, label }) => (
              <Chip
                key={value}
                label={label}
                active={form.skin_types.includes(value)}
                onClick={() => setField('skin_types', toggleArrayItem(form.skin_types, value))}
              />
            ))}
          </div>
        </Field>

        <Field label="Теги">
          <div className="flex flex-wrap gap-2">
            {PRODUCT_TAGS.map((tag) => (
              <Chip
                key={tag}
                label={`#${tag}`}
                active={form.tags.includes(tag)}
                onClick={() => setField('tags', toggleArrayItem(form.tags, tag))}
              />
            ))}
          </div>
        </Field>

        <div className="flex gap-6">
          <Toggle
            label="Активен (виден в каталоге)"
            checked={form.is_active}
            onChange={(v) => setField('is_active', v)}
          />
          <Toggle
            label="Хит продаж"
            checked={form.is_featured}
            onChange={(v) => setField('is_featured', v)}
          />
        </div>
      </FormSection>

      {/* ── Section: SEO ─────────────────────────────────────────────── */}
      <FormSection title="SEO">
        <div className="flex items-center justify-between mb-1">
          <p className="text-xs text-brand-charcoal-500">
            {seoGenerated
              ? <span className="text-brand-pink-400">✨ Сгенерировано AI</span>
              : 'Заполните основное и нажмите «Сгенерировать»'}
          </p>
          <button
            type="button"
            onClick={generateSeo}
            disabled={!form.name_ru || !form.brand_id || seoLoading}
            className="inline-flex items-center gap-1.5 text-xs text-brand-pink-400 hover:text-brand-pink-300 disabled:opacity-40 transition-colors"
          >
            {seoLoading
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Sparkles className="w-3.5 h-3.5" />}
            {seoLoading ? 'Генерация…' : 'Сгенерировать AI'}
          </button>
        </div>
        <Field label="Meta-заголовок">
          <input
            value={form.meta_title_ru}
            onChange={(e) => setField('meta_title_ru', e.target.value)}
            placeholder="Название — купить Бренд | K&E Beauty"
            className={inputCls}
          />
          <p className="text-xs text-brand-charcoal-500 mt-1">{form.meta_title_ru.length}/70 символов</p>
        </Field>
        <Field label="Meta-описание">
          <textarea
            value={form.meta_description_ru}
            onChange={(e) => setField('meta_description_ru', e.target.value)}
            rows={2}
            placeholder="Краткое описание для поисковиков…"
            className={cn(inputCls, 'resize-none')}
          />
          <p className="text-xs text-brand-charcoal-500 mt-1">{form.meta_description_ru.length}/160 символов</p>
        </Field>
      </FormSection>

      {/* ── Section: Варианты ─────────────────────────────────────────── */}
      <FormSection title="Варианты">
        <div className="space-y-3">
          {variants.map((v, i) => (
            <div key={i} className="p-4 bg-brand-black-900 rounded-xl border border-brand-black-600 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-brand-charcoal-400 text-xs font-medium">Вариант {i + 1}</span>
                {variants.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      if (v.id) setRemovedVariantIds((ids) => [...ids, v.id!]);
                      setVariants((arr) => arr.filter((_, j) => j !== i));
                    }}
                    className="text-brand-charcoal-500 hover:text-red-400 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <Field label="Название" compact>
                  <input
                    value={v.name_ru}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, name_ru: e.target.value } : x))}
                    placeholder="100 мл"
                    className={inputCls}
                  />
                </Field>
                <Field label="SKU" compact>
                  <input
                    value={v.sku}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, sku: e.target.value } : x))}
                    placeholder="COSRX-SNL-100"
                    className={cn(inputCls, 'font-mono')}
                  />
                </Field>
                <Field label="Объём (атрибут)" compact>
                  <input
                    value={v.volume}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, volume: e.target.value } : x))}
                    placeholder="100 мл"
                    className={inputCls}
                  />
                </Field>
                <Field label="Цена (₽)" compact>
                  <input
                    type="number"
                    value={v.price_rub}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, price_rub: e.target.value } : x))}
                    placeholder="1890"
                    className={inputCls}
                  />
                </Field>
                <Field label="Цена со скидкой (₽)" compact>
                  <input
                    type="number"
                    value={v.sale_price_rub}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, sale_price_rub: e.target.value } : x))}
                    placeholder="оставьте пустым"
                    className={inputCls}
                  />
                </Field>
                <Field label="Остаток (шт.)" compact>
                  <input
                    type="number"
                    value={v.stock}
                    onChange={(e) => setVariants((arr) => arr.map((x, j) => j === i ? { ...x, stock: e.target.value } : x))}
                    placeholder="0"
                    className={inputCls}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setVariants((arr) => [...arr, { ...EMPTY_VARIANT }])}
          className="mt-2 flex items-center gap-1.5 text-sm text-brand-pink-400 hover:text-brand-pink-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить вариант
        </button>
      </FormSection>

      {/* ── Section: Изображения ──────────────────────────────────────── */}
      <FormSection title="Изображения (URL)">
        <p className="text-brand-charcoal-500 text-xs mb-3">
          Загрузка файлов будет добавлена в Этапе 3. Пока можно вставить URL изображения.
        </p>
        <div className="space-y-3">
          {images.map((img, i) => (
            <div key={i} className="flex gap-3 items-start p-3 bg-brand-black-900 rounded-xl border border-brand-black-600">
              <div className="flex-1 space-y-2">
                <input
                  value={img.url}
                  onChange={(e) => setImages((arr) => arr.map((x, j) => j === i ? { ...x, url: e.target.value } : x))}
                  placeholder="https://example.com/image.jpg"
                  className={cn(inputCls, 'text-xs')}
                />
                <div className="flex items-center gap-4">
                  <input
                    value={img.alt_ru}
                    onChange={(e) => setImages((arr) => arr.map((x, j) => j === i ? { ...x, alt_ru: e.target.value } : x))}
                    placeholder="Alt-текст"
                    className={cn(inputCls, 'text-xs flex-1')}
                  />
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs text-brand-charcoal-300 whitespace-nowrap">
                    <input
                      type="radio"
                      name="primary_image"
                      checked={img.is_primary}
                      onChange={() => setImages((arr) => arr.map((x, j) => ({ ...x, is_primary: j === i })))}
                      className="accent-brand-pink-500"
                    />
                    Главное
                  </label>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (img.id) setRemovedImageIds((ids) => [...ids, img.id!]);
                  setImages((arr) => arr.filter((_, j) => j !== i));
                }}
                className="text-brand-charcoal-500 hover:text-red-400 transition-colors pt-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setImages((arr) => [...arr, { url: '', alt_ru: '', is_primary: arr.length === 0 }])}
          className="mt-2 flex items-center gap-1.5 text-sm text-brand-pink-400 hover:text-brand-pink-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить изображение
        </button>
      </FormSection>

      {/* ── Section: Ингредиенты ──────────────────────────────────────── */}
      <FormSection title="Ингредиенты">
        <div className="space-y-3">
          {ingredients.map((ing, i) => (
            <div key={i} className="p-4 bg-brand-black-900 rounded-xl border border-brand-black-600 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-brand-charcoal-400 text-xs font-medium">Ингредиент {i + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    if (ing.id) setRemovedIngredientIds((ids) => [...ids, ing.id!]);
                    setIngredients((arr) => arr.filter((_, j) => j !== i));
                  }}
                  className="text-brand-charcoal-500 hover:text-red-400 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="INCI Name" compact>
                  <input
                    value={ing.inci_name}
                    onChange={(e) => setIngredients((arr) => arr.map((x, j) => j === i ? { ...x, inci_name: e.target.value } : x))}
                    placeholder="Snail Secretion Filtrate"
                    className={cn(inputCls, 'font-mono text-xs')}
                  />
                </Field>
                <Field label="Название (рус)" compact>
                  <input
                    value={ing.name_ru}
                    onChange={(e) => setIngredients((arr) => arr.map((x, j) => j === i ? { ...x, name_ru: e.target.value } : x))}
                    placeholder="Фильтрат улиточного муцина"
                    className={inputCls}
                  />
                </Field>
                <Field label="Назначение" compact>
                  <input
                    value={ing.purpose_ru}
                    onChange={(e) => setIngredients((arr) => arr.map((x, j) => j === i ? { ...x, purpose_ru: e.target.value } : x))}
                    placeholder="Увлажнение, восстановление"
                    className={inputCls}
                  />
                </Field>
                <Field label="Оценка безопасности (1-10)" compact>
                  <input
                    type="number"
                    min={1} max={10}
                    value={ing.safety_rating}
                    onChange={(e) => setIngredients((arr) => arr.map((x, j) => j === i ? { ...x, safety_rating: e.target.value } : x))}
                    placeholder="1 = безопасно"
                    className={inputCls}
                  />
                </Field>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={ing.is_highlighted}
                  onChange={(e) => setIngredients((arr) => arr.map((x, j) => j === i ? { ...x, is_highlighted: e.target.checked } : x))}
                  className="w-4 h-4 rounded accent-brand-pink-500"
                />
                <span className="text-xs text-brand-charcoal-300">Ключевой ингредиент (выделять на странице)</span>
              </label>
            </div>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setIngredients((arr) => [...arr, { ...EMPTY_INGREDIENT }])}
          className="mt-2 flex items-center gap-1.5 text-sm text-brand-pink-400 hover:text-brand-pink-300 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Добавить ингредиент
        </button>
      </FormSection>

      {/* Error */}
      {submitError && (
        <div className="flex items-start gap-2 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{submitError}</p>
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-3 pb-8">
        <button
          type="button"
          onClick={() => submitMutation.mutate()}
          disabled={!canSave || submitMutation.isPending}
          className={cn(
            'px-6 py-2.5 rounded-xl font-semibold text-sm transition-all',
            canSave && !submitMutation.isPending
              ? 'bg-brand-pink-500 hover:bg-brand-pink-400 text-white'
              : 'bg-brand-black-700 text-brand-charcoal-500 cursor-not-allowed'
          )}
        >
          {submitMutation.isPending
            ? 'Сохранение…'
            : isEdit ? 'Сохранить изменения' : 'Создать товар'}
        </button>
        <Link
          href="/admin/products"
          className="px-4 py-2.5 rounded-xl text-sm text-brand-charcoal-400 hover:text-white transition-colors"
        >
          Отмена
        </Link>
      </div>
    </div>
  );
}

// ── UI helpers ────────────────────────────────────────────────────────────────

const inputCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white placeholder:text-brand-charcoal-600 focus:outline-none focus:border-brand-pink-500 transition-colors';

const selectCls =
  'w-full px-3 py-2 bg-brand-black-900 border border-brand-black-600 rounded-lg text-sm text-white focus:outline-none focus:border-brand-pink-500 transition-colors';

function FormSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-brand-black-800 border border-brand-black-600 rounded-xl p-5 space-y-4">
      <h2 className="text-white font-semibold text-sm border-b border-brand-black-600 pb-3">{title}</h2>
      {children}
    </div>
  );
}

function Field({
  label,
  children,
  compact = false,
}: {
  label: string;
  children: React.ReactNode;
  compact?: boolean;
}) {
  return (
    <div className={compact ? '' : 'space-y-1'}>
      <label className="block text-xs text-brand-charcoal-400 mb-1">{label}</label>
      {children}
    </div>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2.5 cursor-pointer select-none">
      <div
        onClick={() => onChange(!checked)}
        className={cn(
          'w-9 h-5 rounded-full transition-colors relative',
          checked ? 'bg-brand-pink-500' : 'bg-brand-black-600'
        )}
      >
        <div
          className={cn(
            'absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform',
            checked ? 'translate-x-4' : 'translate-x-0.5'
          )}
        />
      </div>
      <span className="text-sm text-brand-charcoal-300">{label}</span>
    </label>
  );
}

function Chip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'px-2.5 py-1 rounded-lg text-xs border transition-all',
        active
          ? 'bg-brand-pink-500/15 border-brand-pink-500/50 text-brand-pink-400'
          : 'border-brand-black-600 text-brand-charcoal-400 hover:border-brand-charcoal-500 hover:text-white'
      )}
    >
      {label}
    </button>
  );
}
