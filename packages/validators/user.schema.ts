/**
 * User Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { SkinType, UserRole } from '../types';

export const skinTypes: SkinType[] = ['dry', 'oily', 'combination', 'sensitive', 'normal'];
export const userRoles: UserRole[] = ['customer', 'admin'];

export const profileUpdateSchema = z.object({
  fullName: z
    .string()
    .min(2, 'Имя должно быть не менее 2 символов')
    .max(100, 'Имя не должно превышать 100 символов')
    .optional()
    .or(z.literal('')),
  phone: z
    .string()
    .regex(
      /^\+?[\d\s\-\(\)]{10,20}$/,
      'Введите корректный номер телефона'
    )
    .optional()
    .or(z.literal('')),
  avatarUrl: z.string().url('Некорректный URL').optional().or(z.literal('')),
  skinType: z.enum(['dry', 'oily', 'combination', 'sensitive', 'normal', '']).optional(),
});

export type ProfileUpdateFormData = z.infer<typeof profileUpdateSchema>;

export const userAddressSchema = z.object({
  city: z.string().min(1, 'Город обязателен').max(100, 'Максимум 100 символов'),
  street: z.string().min(1, 'Улица обязательна').max(200, 'Максимум 200 символов'),
  zip: z
    .string()
    .min(1, 'Индекс обязателен')
    .regex(/^\d{6}$/, 'Индекс должен содержать 6 цифр'),
  apartment: z
    .string()
    .max(50, 'Максимум 50 символов')
    .optional()
    .or(z.literal('')),
});

export type UserAddressFormData = z.infer<typeof userAddressSchema>;

export const changeEmailSchema = z.object({
  newEmail: z.string().min(1, 'Email обязателен').email('Введите корректный email'),
  password: z.string().min(1, 'Текущий пароль обязателен'),
});

export type ChangeEmailFormData = z.infer<typeof changeEmailSchema>;

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'Текущий пароль обязателен'),
    newPassword: z
      .string()
      .min(8, 'Пароль должен быть не менее 8 символов')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'Пароль должен содержать заглавную букву, строчную букву и цифру'
      ),
    confirmNewPassword: z.string().min(1, 'Подтвердите новый пароль'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmNewPassword'],
  });

export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
