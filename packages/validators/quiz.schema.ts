/**
 * Quiz Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { SkinType } from '../types';

export const skinTypes: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];

export const quizAnswerSchema = z.object({
  questionId: z.string(),
  optionId: z.string(),
  value: z.string(),
});

export type QuizAnswerFormData = z.infer<typeof quizAnswerSchema>;

export const quizSubmissionSchema = z.object({
  answers: z.array(quizAnswerSchema).min(1, 'Необходимо ответить на вопросы'),
  sessionId: z.string().optional(),
});

export type QuizSubmissionFormData = z.infer<typeof quizSubmissionSchema>;

export const quizResultSchema = z.object({
  skinType: z.enum(skinTypes as [string, ...string[]]),
  recommendedProductIds: z.array(z.string().uuid()),
  description: z.object({
    name: z.string(),
    description: z.string(),
    characteristics: z.array(z.string()),
    recommendedIngredients: z.array(z.string()),
    avoidIngredients: z.array(z.string()),
  }),
});

export type QuizResultData = z.infer<typeof quizResultSchema>;

export const quizResultSaveSchema = z.object({
  answers: z.array(quizAnswerSchema),
  skinTypeResult: z.enum(skinTypes as [string, ...string[]]),
  recommendedProductIds: z.array(z.string().uuid()),
  sessionId: z.string().optional(),
});

export type QuizResultSaveFormData = z.infer<typeof quizResultSaveSchema>;
