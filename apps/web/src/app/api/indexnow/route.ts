import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseServiceClient } from '@/shared/api/supabaseServer';
import { getProducts, getCategories } from '@packages/api/products';
import { getBrands } from '@packages/api/brands';

const KEY = 'd3bdf307a48a481a8838c91f7de13cdd';
const HOST = 'https://axis-beauty.com';
const ENDPOINT = 'https://api.indexnow.org/indexnow';

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const secret = body.secret;
  if (secret !== process.env.INDEXNOW_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const urls: string[] = body.urls ?? [];
  if (urls.length === 0) {
    return NextResponse.json({ error: 'No URLs provided' }, { status: 400 });
  }

  const fullUrls = urls.map((u: string) =>
    u.startsWith('http') ? u : `${HOST}${u.startsWith('/') ? '' : '/'}${u}`
  );

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json; charset=utf-8' },
    body: JSON.stringify({
      host: 'axis-beauty.com',
      key: KEY,
      keyLocation: `${HOST}/${KEY}.txt`,
      urlList: fullUrls,
    }),
  });

  return NextResponse.json({
    status: res.status,
    submitted: fullUrls.length,
    message: res.ok ? 'Submitted to IndexNow' : await res.text(),
  });
}

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.INDEXNOW_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServiceClient();
  const [productsResult, categoriesResult, brandsResult] = await Promise.allSettled([
    getProducts(supabase, { limit: 5000 }),
    getCategories(supabase),
    getBrands(supabase),
  ]);

  const products = productsResult.status === 'fulfilled' ? productsResult.value.products : [];
  const categories = categoriesResult.status === 'fulfilled' ? categoriesResult.value : [];
  const brands = brandsResult.status === 'fulfilled' ? brandsResult.value : [];

  const loc = `${HOST}/en`;
  const urls = [
    loc,
    `${loc}/catalog`,
    `${loc}/quiz`,
    ...products.map((p) => `${loc}/product/${p.slug}`),
    ...categories.map((c) => `${loc}/catalog?category=${c.slug}`),
    ...brands.map((b) => `${loc}/catalog?brand=${b.slug}`),
  ];

  const batchSize = 10000;
  const results = [];

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const res = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify({
        host: 'axis-beauty.com',
        key: KEY,
        keyLocation: `${HOST}/${KEY}.txt`,
        urlList: batch,
      }),
    });
    const body = await res.text().catch(() => '');
    results.push({ status: res.status, count: batch.length, body });
  }

  return NextResponse.json({
    totalUrls: urls.length,
    batches: results,
  });
}
