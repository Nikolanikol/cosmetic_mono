/**
 * Product Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { OriginCountry, SkinType, ProductTag } from '../types';

export const originCountries: OriginCountry[] = ['KR', 'FR', 'DE', 'IT', 'US', 'JP', 'CN', 'GB', 'ES', 'SE'];
export const skinTypes: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
export const productTags: ProductTag[] = [
  'антивозрастной',
  'увлажнение',
  'SPF',
  'осветление',
  'питание',
  'очищение',
  'акне',
  'чувствительная',
  'сияние',
  'лифтинг',
];

export const productFilterSchema = z.object({
  category: z.string().optional(),
  brand: z.array(z.string()).optional(),
  price_min: z.coerce.number().min(0).optional(),
  price_max: z.coerce.number().min(0).optional(),
  skin_type: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal']).optional(),
  rating: z.coerce.number().min(1).max(5).optional(),
  sale_only: z.coerce.boolean().optional(),
  origin_country: z.array(z.enum(originCountries as [string, ...string[]])).optional(),
  tags: z.array(z.enum(productTags as [string, ...string[]])).optional(),
  search: z.string().optional(),
});

export type ProductFilterFormData = z.infer<typeof productFilterSchema>;

export const productSortSchema = z.enum([
  'popular',
  'price_asc',
  'price_desc',
  'newest',
  'rating',
]);

export type ProductSortOption = z.infer<typeof productSortSchema>;

export const productVariantAttributeSchema = z.record(z.string(), z.string().optional());

export const productVariantSchema = z.object({
  sku: z.string().min(1, 'SKU обязателен').max(50, 'Максимум 50 символов'),
  name_ru: z.string().min(1, 'Название варианта обязательно').max(100, 'Максимум 100 символов'),
  price_rub: z.coerce.number().min(0, 'Цена не может быть отрицательной'),
  sale_price_rub: z.coerce.number().min(0).nullable().optional(),
  stock: z.coerce.number().int().min(0, 'Количество не может быть отрицательным').default(0),
  attributes: productVariantAttributeSchema.default({}),
  weight_g: z.coerce.number().int().min(0).nullable().optional(),
});

export type ProductVariantFormData = z.infer<typeof productVariantSchema>;

export const productIngredientSchema = z.object({
  inci_name: z.string().min(1, 'INCI название обязательно').max(200, 'Максимум 200 символов'),
  name_ru: z.string().min(1, 'Название на русском обязательно').max(200, 'Максимум 200 символов'),
  purpose_ru: z.string().max(500, 'Максимум 500 символов').optional().nullable(),
  is_highlighted: z.boolean().default(false),
  safety_rating: z.coerce.number().int().min(1).max(10).nullable().optional(),
});

export type ProductIngredientFormData = z.infer<typeof productIngredientSchema>;

export const productCreateSchema = z.object({
  name_ru: z.string().min(1, 'Название на русском обязательно').max(200, 'Максимум 200 символов'),
  name_en: z.string().min(1, 'Название на английском обязательно').max(200, 'Максимум 200 символов'),
  slug: z
    .string()
    .min(1, 'Slug обязателен')
    .max(200, 'Максимум 200 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  description_ru: z.string().max(5000, 'Максимум 5000 символов').optional().nullable(),
  category_id: z.string().uuid('Выберите категорию'),
  brand_id: z.string().uuid('Выберите бренд'),
  is_active: z.boolean().default(true),
  is_featured: z.boolean().default(false),
  routine_step: z.coerce.number().int().min(1).max(10).nullable().optional(),
  skin_types: z.array(z.enum(skinTypes as [string, ...string[]])).default([]),
  tags: z.array(z.enum(productTags as [string, ...string[]])).default([]),
  meta_title_ru: z.string().max(70, 'Максимум 70 символов').optional().nullable(),
  meta_description_ru: z.string().max(160, 'Максимум 160 символов').optional().nullable(),
  variants: z.array(productVariantSchema).min(1, 'Добавьте хотя бы один вариант'),
  ingredients: z.array(productIngredientSchema).default([]),
});

export type ProductCreateFormData = z.infer<typeof productCreateSchema>;

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export type ProductUpdateFormData = z.infer<typeof productUpdateSchema>;

export const brandCreateSchema = z.object({
  name: z.string().min(1, 'Название бренда обязательно').max(100, 'Максимум 100 символов'),
  slug: z
    .string()
    .min(1, 'Slug обязателен')
    .max(100, 'Максимум 100 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  origin_country: z.enum(originCountries as [string, ...string[]]),
  logo_url: z.string().url('Некорректный URL').optional().nullable(),
  description: z.string().max(2000, 'Максимум 2000 символов').optional().nullable(),
  is_featured: z.boolean().default(false),
});

export type BrandCreateFormData = z.infer<typeof brandCreateSchema>;

export const categoryCreateSchema = z.object({
  name_ru: z.string().min(1, 'Название на русском обязательно').max(100, 'Максимум 100 символов'),
  name_en: z.string().min(1, 'Название на английском обязательно').max(100, 'Максимум 100 символов'),
  slug: z
    .string()
    .min(1, 'Slug обязателен')
    .max(100, 'Максимум 100 символов')
    .regex(/^[a-z0-9-]+$/, 'Slug может содержать только строчные буквы, цифры и дефисы'),
  parent_id: z.string().uuid().optional().nullable(),
  image_url: z.string().url('Некорректный URL').optional().nullable(),
  sort_order: z.coerce.number().int().min(0).default(0),
});

export type CategoryCreateFormData = z.infer<typeof categoryCreateSchema>;
