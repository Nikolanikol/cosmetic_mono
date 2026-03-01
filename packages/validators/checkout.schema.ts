/**
 * Checkout Zod schemas
 * Used by both Next.js web app and future React Native app
 */

import { z } from 'zod';
import type { ShippingMethod } from '../types';

export const shippingMethods: ShippingMethod[] = ['sdek', 'pochta', 'pickup'];

export const checkoutAddressSchema = z.object({
  fullName: z
    .string()
    .min(1, 'ФИО обязательно')
    .max(200, 'Максимум 200 символов'),
  phone: z
    .string()
    .min(1, 'Телефон обязателен')
    .regex(
      /^\+?[\d\s\-\(\)]{10,20}$/,
      'Введите корректный номер телефона'
    ),
  email: z
    .string()
    .min(1, 'Email обязателен')
    .email('Введите корректный email'),
  city: z
    .string()
    .min(1, 'Город обязателен')
    .max(100, 'Максимум 100 символов'),
  street: z
    .string()
    .min(1, 'Улица обязательна')
    .max(200, 'Максимум 200 символов'),
  zip: z
    .string()
    .min(1, 'Индекс обязателен')
    .regex(/^\d{6}$/, 'Индекс должен содержать 6 цифр'),
  apartment: z
    .string()
    .max(50, 'Максимум 50 символов')
    .optional()
    .or(z.literal('')),
  comment: z
    .string()
    .max(500, 'Максимум 500 символов')
    .optional()
    .or(z.literal('')),
});

export type CheckoutAddressFormData = z.infer<typeof checkoutAddressSchema>;

export const checkoutShippingSchema = z.object({
  shippingMethod: z.enum(shippingMethods as [string, ...string[]], {
    error: 'Выберите способ доставки',
  }),
  pickupPointId: z.string().optional().nullable(),
});

export type CheckoutShippingFormData = z.infer<typeof checkoutShippingSchema>;

export const checkoutPaymentSchema = z.object({
  paymentMethod: z.literal('yookassa').default('yookassa'),
  saveCard: z.boolean().optional().default(false),
});

export type CheckoutPaymentFormData = z.infer<typeof checkoutPaymentSchema>;

export const checkoutSchema = z.object({
  address: checkoutAddressSchema,
  shipping: checkoutShippingSchema,
  payment: checkoutPaymentSchema,
  promoCode: z.string().optional().nullable(),
});

export type CheckoutFormData = z.infer<typeof checkoutSchema>;

export const yookassaPaymentCreateSchema = z.object({
  amount: z.object({
    value: z.string().regex(/^\d+\.\d{2}$/, 'Сумма должна быть в формате 0.00'),
    currency: z.literal('RUB'),
  }),
  capture: z.boolean().default(true),
  confirmation: z.object({
    type: z.literal('redirect'),
    return_url: z.string().url(),
  }),
  description: z.string().max(128).optional(),
  metadata: z.record(z.string(), z.string()).optional(),
  receipt: z
    .object({
      customer: z.object({
        email: z.string().email(),
        phone: z.string().optional(),
      }),
      items: z.array(
        z.object({
          description: z.string().max(128),
          quantity: z.string().regex(/^\d+\.\d{3}$/),
          amount: z.object({
            value: z.string().regex(/^\d+\.\d{2}$/),
            currency: z.literal('RUB'),
          }),
          vat_code: z.literal('1').optional(), // 20% VAT
        })
      ),
    })
    .optional(),
});

export type YookassaPaymentCreateData = z.infer<typeof yookassaPaymentCreateSchema>;

export const yookassaWebhookSchema = z.object({
  type: z.string(),
  event: z.enum([
    'payment.succeeded',
    'payment.canceled',
    'payment.waiting_for_capture',
    'refund.succeeded',
  ]),
  object: z.object({
    id: z.string(),
    status: z.enum(['succeeded', 'canceled', 'pending', 'waiting_for_capture']),
    amount: z.object({
      value: z.string(),
      currency: z.string(),
    }),
    income_amount: z
      .object({
        value: z.string(),
        currency: z.string(),
      })
      .optional(),
    description: z.string().optional(),
    recipient: z
      .object({
        account_id: z.string(),
        gateway_id: z.string(),
      })
      .optional(),
    payment_method: z.record(z.string(), z.unknown()).optional(),
    captured_at: z.string().optional(),
    created_at: z.string(),
    expires_at: z.string().optional(),
    metadata: z.record(z.string(), z.string()).optional(),
    refundable: z.boolean().optional(),
    test: z.boolean().optional(),
    paid: z.boolean().optional(),
  }),
});

export type YookassaWebhookData = z.infer<typeof yookassaWebhookSchema>;
