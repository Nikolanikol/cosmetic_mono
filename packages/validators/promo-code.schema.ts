/**
 * Promo code Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { DiscountType } from '../types';

export const discountTypes: DiscountType[] = ['percent', 'fixed_rub'];

export const promoCodeCreateSchema = z.object({
  code: z
    .string()
    .min(3, 'Код должен быть не менее 3 символов')
    .max(50, 'Максимум 50 символов')
    .regex(
      /^[A-Z0-9_-]+$/,
      'Код может содержать только заглавные буквы, цифры, дефисы и подчеркивания'
    ),
  discountType: z.enum(discountTypes as [string, ...string[]]),
  discountValue: z.coerce.number().min(0, 'Значение не может быть отрицательным'),
  minOrderRub: z.coerce.number().min(0).nullable().optional(),
  usageLimit: z.coerce.number().int().min(1).nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
  isActive: z.boolean().default(true),
}).refine(
  (data) => {
    if (data.discountType === 'percent') {
      return data.discountValue <= 100;
    }
    return true;
  },
  {
    message: 'Процент скидки не может превышать 100%',
    path: ['discountValue'],
  }
);

export type PromoCodeCreateFormData = z.infer<typeof promoCodeCreateSchema>;

export const promoCodeUpdateSchema = promoCodeCreateSchema.partial().extend({
  id: z.string().uuid(),
});

export type PromoCodeUpdateFormData = z.infer<typeof promoCodeUpdateSchema>;

export const promoCodeApplySchema = z.object({
  code: z.string().min(1, 'Введите промокод'),
  cartTotal: z.coerce.number().min(0),
});

export type PromoCodeApplyFormData = z.infer<typeof promoCodeApplySchema>;

export const promoCodeValidationResponseSchema = z.object({
  valid: z.boolean(),
  promoCode: z
    .object({
      id: z.string().uuid(),
      code: z.string(),
      discountType: z.enum(discountTypes as [string, ...string[]]),
      discountValue: z.number(),
    })
    .optional(),
  error: z.string().optional(),
  discountAmount: z.number().optional(),
  finalTotal: z.number().optional(),
});

export type PromoCodeValidationResponse = z.infer<typeof promoCodeValidationResponseSchema>;
