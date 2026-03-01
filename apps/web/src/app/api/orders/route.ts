import { NextResponse } from 'next/server';
import { getSupabaseServerClient } from '@/shared/api/supabaseServer';
import type { OrderShippingAddress, ShippingMethod, OrderInsert, OrderItemInsert, ProductSnapshot } from '@packages/types';

interface CartItemInput {
  variantId: string;
  quantity: number;
}

interface CreateOrderBody {
  cartItems:       CartItemInput[];
  shippingAddress: OrderShippingAddress;
  shippingMethod:  ShippingMethod;
  promoCodeId:     string | null;
  discount:        number;
  deliveryCost:    number;
  total:           number;
}

export async function POST(request: Request) {
  const supabase = await getSupabaseServerClient();

  // Auth check
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Необходима авторизация' }, { status: 401 });
  }

  let body: CreateOrderBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Неверный формат запроса' }, { status: 400 });
  }

  const { cartItems, shippingAddress, shippingMethod, promoCodeId, discount, deliveryCost } = body;

  if (!cartItems?.length) {
    return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 });
  }

  // Fetch variant details from DB (re-verify prices server-side)
  const variantIds = cartItems.map((i) => i.variantId);
  const { data: variants, error: variantsError } = await supabase
    .from('product_variants')
    .select(`
      id,
      sku,
      name_ru,
      price_rub,
      sale_price_rub,
      attributes,
      product:products!inner(
        id,
        name_ru,
        name_en,
        slug,
        brand:brands!inner(name),
        images:product_images(url, is_primary)
      )
    `)
    .in('id', variantIds);

  if (variantsError || !variants?.length) {
    return NextResponse.json({ error: 'Товары не найдены' }, { status: 400 });
  }

  // Calculate server-side subtotal
  const itemsWithDetails = cartItems.map((cartItem) => {
    const v = variants.find((vv) => vv.id === cartItem.variantId);
    if (!v) return null;
    const effectivePrice = (v.sale_price_rub ?? v.price_rub) as number;
    return { cartItem, variant: v, effectivePrice };
  }).filter(Boolean) as { cartItem: CartItemInput; variant: typeof variants[number]; effectivePrice: number }[];

  if (itemsWithDetails.length !== cartItems.length) {
    return NextResponse.json({ error: 'Один или несколько товаров недоступны' }, { status: 400 });
  }

  const serverSubtotal = itemsWithDetails.reduce(
    (sum, { cartItem, effectivePrice }) => sum + effectivePrice * cartItem.quantity,
    0
  );

  const serverTotal = serverSubtotal - (discount ?? 0) + (deliveryCost ?? 0);

  // Create order
  const orderInsert: OrderInsert = {
    user_id:          user.id,
    status:           'pending',
    total_rub:        serverTotal,
    discount_rub:     discount ?? 0,
    delivery_cost_rub: deliveryCost ?? 0,
    promo_code_id:    promoCodeId ?? null,
    shipping_address: shippingAddress,
    shipping_method:  shippingMethod,
  };

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert(orderInsert)
    .select('id')
    .single();

  if (orderError || !order) {
    console.error('Order creation error:', orderError);
    return NextResponse.json({ error: 'Не удалось создать заказ' }, { status: 500 });
  }

  // Create order items with product snapshots
  const orderItems: OrderItemInsert[] = itemsWithDetails.map(({ cartItem, variant, effectivePrice }) => {
    const product = variant.product as {
      id: string;
      name_ru: string;
      name_en: string;
      slug: string;
      brand: { name: string } | { name: string }[];
      images: { url: string; is_primary: boolean }[];
    };

    const brandName = Array.isArray(product.brand)
      ? product.brand[0]?.name ?? ''
      : (product.brand as { name: string })?.name ?? '';

    const images = (product.images ?? []) as { url: string; is_primary: boolean }[];
    const primaryImage = images.find((img) => img.is_primary) ?? images[0];

    const snapshot: ProductSnapshot = {
      product_id:         product.id,
      product_name_ru:    product.name_ru,
      product_name_en:    product.name_en,
      product_slug:       product.slug,
      brand_name:         brandName,
      variant_name_ru:    variant.name_ru,
      variant_sku:        variant.sku,
      variant_attributes: (variant.attributes as Record<string, string>) ?? {},
      image_url:          primaryImage?.url ?? null,
    };

    return {
      order_id:              order.id,
      variant_id:            cartItem.variantId,
      quantity:              cartItem.quantity,
      price_rub_at_purchase: effectivePrice,
      product_snapshot:      snapshot,
    };
  });

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems);

  if (itemsError) {
    console.error('Order items error:', itemsError);
    // Order exists but items failed — still return orderId so user can see the order
  }

  // Increment promo code usage if applied
  if (promoCodeId) {
    await supabase.rpc('increment_promo_code_usage', { promo_code_id: promoCodeId });
  }

  return NextResponse.json({ orderId: order.id }, { status: 201 });
}
