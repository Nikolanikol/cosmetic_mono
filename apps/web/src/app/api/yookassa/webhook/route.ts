/**
 * YooKassa Webhook Handler
 * Processes payment notifications from YooKassa
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { env } from '@/shared/config/env';
import { yookassaWebhookSchema } from '@packages/validators/checkout.schema';
import { updateOrderStatus } from '@packages/api/orders';
import { incrementPromoCodeUsage } from '@packages/api/promo-codes';
import type { Database } from '@/shared/api/database.types';

/**
 * POST handler for YooKassa webhooks
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text();
    const body = JSON.parse(rawBody);

    // Verify webhook signature (if provided)
    const signature = request.headers.get('X-Webhook-Signature');
    if (signature && env.YOOKASSA_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature);
      if (!isValid) {
        console.error('Invalid webhook signature');
        return NextResponse.json(
          { error: 'Invalid signature' },
          { status: 401 }
        );
      }
    }

    // Validate webhook payload
    const validationResult = yookassaWebhookSchema.safeParse(body);
    if (!validationResult.success) {
      console.error('Invalid webhook payload:', validationResult.error);
      return NextResponse.json(
        { error: 'Invalid payload' },
        { status: 400 }
      );
    }

    const webhookData = validationResult.data;
    const { event, object: paymentObject } = webhookData;

    // Create Supabase client (service role, no cookies needed for webhooks)
    const supabase = createServerClient(
      env.NEXT_PUBLIC_SUPABASE_URL,
      env.SUPABASE_SERVICE_ROLE_KEY,
      {
        cookies: {
          getAll() { return []; },
          setAll() {},
        },
      }
    );

    // Get order ID from payment metadata
    const orderId = paymentObject.metadata?.order_id;
    if (!orderId || typeof orderId !== 'string') {
      console.error('No order_id in payment metadata');
      return NextResponse.json(
        { error: 'Missing order_id' },
        { status: 400 }
      );
    }

    // Handle different event types
    switch (event) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(supabase, orderId, paymentObject);
        break;

      case 'payment.canceled':
        await handlePaymentCanceled(supabase, orderId, paymentObject);
        break;

      case 'payment.waiting_for_capture':
        // For two-step payments, auto-capture
        await handlePaymentWaitingForCapture(supabase, orderId, paymentObject);
        break;

      case 'refund.succeeded':
        await handleRefundSucceeded(supabase, orderId, paymentObject);
        break;

      default:
        console.log(`Unhandled webhook event: ${event}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Handle payment.succeeded event
 */
async function handlePaymentSucceeded(
  supabase: SupabaseClient<any>,
  orderId: string,
  paymentObject: {
    id: string;
    amount: { value: string; currency: string };
    metadata?: Record<string, unknown>;
  }
) {
  console.log(`Payment succeeded for order ${orderId}`);

  // Update order status to paid
  await updateOrderStatus(supabase, orderId, 'paid');

  // Update order with payment ID
  await supabase
    .from('orders')
    .update({
      yookassa_payment_id: paymentObject.id,
      paid_at: new Date().toISOString(),
    })
    .eq('id', orderId);

  // Increment promo code usage if used
  const { data: order } = await supabase
    .from('orders')
    .select('promo_code_id')
    .eq('id', orderId)
    .single();

  if (order?.promo_code_id) {
    await incrementPromoCodeUsage(supabase, order.promo_code_id);
  }

  // Clear user's cart
  const { data: orderData } = await supabase
    .from('orders')
    .select('user_id')
    .eq('id', orderId)
    .single();

  if (orderData?.user_id) {
    await supabase.from('cart_items').delete().eq('user_id', orderData.user_id);
  }

  // TODO: Send confirmation email
  // TODO: Notify admin about new order
}

/**
 * Handle payment.canceled event
 */
async function handlePaymentCanceled(
  supabase: SupabaseClient<any>,
  orderId: string,
  paymentObject: { id: string }
) {
  console.log(`Payment canceled for order ${orderId}`);

  // Update order status to cancelled
  await updateOrderStatus(supabase, orderId, 'cancelled');

  // Restore product stock (optional - depends on business logic)
  // This would require fetching order items and updating variant stock
}

/**
 * Handle payment.waiting_for_capture event
 */
async function handlePaymentWaitingForCapture(
  supabase: SupabaseClient<any>,
  orderId: string,
  paymentObject: { id: string }
) {
  console.log(`Payment waiting for capture for order ${orderId}`);

  // Auto-capture the payment
  // This requires making an API call to YooKassa to capture
  // For simplicity, we'll update the order status
  await updateOrderStatus(supabase, orderId, 'processing');
}

/**
 * Handle refund.succeeded event
 */
async function handleRefundSucceeded(
  supabase: SupabaseClient<any>,
  orderId: string,
  paymentObject: { id: string }
) {
  console.log(`Refund succeeded for order ${orderId}`);

  // Update order status to refunded
  await updateOrderStatus(supabase, orderId, 'refunded');

  // TODO: Send refund confirmation email
}

/**
 * Verify webhook signature
 */
function verifyWebhookSignature(body: string, signature: string): boolean {
  try {
    const crypto = require('crypto');
    const expectedSignature = crypto
      .createHmac('sha256', env.YOOKASSA_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch {
    return false;
  }
}

/**
 * GET handler for webhook verification (optional)
 */
export async function GET() {
  return NextResponse.json({
    message: 'YooKassa webhook endpoint',
    status: 'active',
  });
}
