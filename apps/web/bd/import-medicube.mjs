import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'medicube-raw');
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function shouldSkipProduct(product) {
  if (product.product_type === 'GIFT') return 'gift';
  if (product.product_type === 'RECHARGE') return 'subscription';
  if (product.title.startsWith('[GIFT]')) return 'gift (title)';
  if (product.title === 'testtesttest') return 'test';
  if (product.handle.startsWith('gift-')) return 'gift (handle)';
  if (product.handle.startsWith('subscr-')) return 'subscription (handle)';
  if (product.handle.startsWith('reward-')) return 'reward';
  const allZero = product.variants?.every((v) => parseFloat(v.price) === 0);
  if (allZero) return 'zero price';
  return null;
}

function guessCategoryByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('device') || t.includes('booster pro') || t.includes('ultra tune') || t.includes('mini booster')) return 'others';
  if (t.includes('brush') || t.includes('gua sha') || t.includes('sponge') || t.includes('travel case') || t.includes('headband')) return 'others';
  if (t.includes(' set') || t.includes(' duo') || t.includes(' trio') || t.includes(' kit')) return 'others';
  if (t.includes('body wash') || t.includes('body lotion') || t.includes('body cream') || t.includes('body care') || t.includes('body essentials')) return 'others';
  if (t.includes('sunscreen') || t.includes('sun cream') || t.includes('spf')) return 'sunscreen';
  if (t.includes('shampoo') || t.includes('conditioner') || t.includes('hair')) return 'haircare';
  if (t.includes('lip')) return 'lips';
  if (t.includes('serum') || t.includes('ampoule') || t.includes('essence') || t.includes('booster') || t.includes('shot')) return 'serum';
  if (t.includes('cream') || t.includes('moistur') || t.includes('lotion') || t.includes('mist') || t.includes('balm')) return 'cream';
  if (t.includes('cleanser') || t.includes('cleansing') || t.includes('foam') || t.includes('wash') || t.includes('peel shot')) return 'cleanser';
  if (t.includes('toner') || t.includes('pad') || t.includes('liquid')) return 'toner';
  if (t.includes('mask') || t.includes('patch') || t.includes('peel')) return 'mask-pad';
  if (t.includes('eye cream')) return 'cream';
  return 'others';
}

async function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (files.length === 0) {
    console.error('No product JSON files found in medicube-raw/.');
    process.exit(1);
  }

  const pgClient = new pg.Client(SUPABASE_DB_URL);
  await pgClient.connect();

  const { rows: brandRows } = await pgClient.query("SELECT id, slug FROM brands");
  const brandMap = Object.fromEntries(brandRows.map((b) => [b.slug, b.id]));
  const brandId = brandMap['medicube'];
  if (!brandId) {
    console.error('Brand "medicube" not found in brands table.');
    process.exit(1);
  }

  const { rows: catRows } = await pgClient.query("SELECT id, slug FROM categories");
  const catMap = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let tagCount = 0;
  const skipped = [];

  for (const file of files) {
    const product = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));
    const handle = product.handle;

    const skipReason = shouldSkipProduct(product);
    if (skipReason) {
      skipped.push({ handle, reason: skipReason });
      continue;
    }

    const catSlug = guessCategoryByTitle(product.title);
    const categoryId = catMap[catSlug] || catMap['others'];
    const sourceUrl = `https://medicube.us/products/${handle}`;

    await pgClient.query(
      `INSERT INTO products (name, slug, description, source_url, category_id, brand_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO NOTHING`,
      [product.title, handle, product.body_html || null, sourceUrl, categoryId, brandId, product.created_at, product.updated_at]
    );

    const { rows: [inserted] } = await pgClient.query("SELECT id FROM products WHERE slug = $1", [handle]);
    if (!inserted) {
      console.log(`  SKIP (already exists): ${handle}`);
      continue;
    }
    const productId = inserted.id;
    productCount++;

    for (const v of product.variants) {
      await pgClient.query(
        `INSERT INTO product_variants (product_id, name, price, compare_at_price, sku, in_stock, weight_g, color_hex)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [productId, v.title || v.option1 || 'Default', v.price, v.compare_at_price || null, v.sku || null, true, v.grams || 0, null]
      );
      variantCount++;
    }

    for (const img of product.images) {
      await pgClient.query(
        `INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
         VALUES ($1,$2,$3,$4,$5)`,
        [productId, img.src, img.alt || null, img.position === 1, img.position]
      );
      imageCount++;
    }

    const tags = Array.isArray(product.tags) ? product.tags : (typeof product.tags === 'string' && product.tags ? product.tags.split(',').map((t) => t.trim()) : []);
    for (const tag of tags) {
      if (!tag) continue;
      await pgClient.query(
        `INSERT INTO product_tags (product_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
        [productId, tag]
      );
      tagCount++;
    }

    console.log(`OK: ${product.title} → ${catSlug} | ${product.variants.length} variants | ${product.images.length} images`);
  }

  await pgClient.end();

  console.log('\n--- Import Summary ---');
  console.log(`Products: ${productCount}`);
  console.log(`Variants: ${variantCount}`);
  console.log(`Images:   ${imageCount}`);
  console.log(`Tags:     ${tagCount}`);

  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.length}`);
    skipped.forEach((s) => console.log(`  ${s.handle}: ${s.reason}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
