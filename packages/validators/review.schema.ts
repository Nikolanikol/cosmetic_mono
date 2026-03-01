/**
 * Review Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { SkinType } from '../types';

export const skinTypes: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];

export const reviewCreateSchema = z.object({
  productId: z.string().uuid('Некорректный ID продукта'),
  rating: z.coerce
    .number()
    .int()
    .min(1, 'Минимальная оценка — 1')
    .max(5, 'Максимальная оценка — 5'),
  title: z
    .string()
    .max(200, 'Максимум 200 символов')
    .optional()
    .or(z.literal('')),
  body: z
    .string()
    .min(10, 'Отзыв должен содержать минимум 10 символов')
    .max(2000, 'Максимум 2000 символов'),
  skinType: z.enum(['', ...skinTypes] as [string, ...string[]]).optional(),
});

export type ReviewCreateFormData = z.infer<typeof reviewCreateSchema>;

export const reviewUpdateSchema = z.object({
  rating: z.coerce
    .number()
    .int()
    .min(1)
    .max(5)
    .optional(),
  title: z.string().max(200).optional().nullable(),
  body: z.string().min(10).max(2000).optional(),
  skinType: z.enum(['', ...skinTypes] as [string, ...string[]]).optional(),
});

export type ReviewUpdateFormData = z.infer<typeof reviewUpdateSchema>;

export const reviewFiltersSchema = z.object({
  productId: z.string().uuid().optional(),
  userId: z.string().uuid().optional(),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  verifiedOnly: z.coerce.boolean().optional(),
  sortBy: z.enum(['newest', 'helpful', 'rating_high', 'rating_low']).optional(),
});

export type ReviewFiltersFormData = z.infer<typeof reviewFiltersSchema>;

export const reviewHelpfulVoteSchema = z.object({
  reviewId: z.string().uuid(),
  isHelpful: z.boolean(),
});

export type ReviewHelpfulVoteFormData = z.infer<typeof reviewHelpfulVoteSchema>;
