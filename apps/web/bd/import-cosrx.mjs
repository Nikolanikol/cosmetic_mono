import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'cosrx-raw');
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

function guessCategoryByTags(tags) {
  const t = Array.isArray(tags) ? tags : (typeof tags === 'string' && tags ? tags.split(',').map((s) => s.trim()) : []);
  const set = new Set(t.map((s) => s.toLowerCase()));

  if (set.has('haircare') || set.has('ycrf_hairscalp')) return 'haircare';
  if (set.has('serums')) return 'serum';
  if (set.has('moisturizers')) return 'cream';
  if (set.has('lip care')) return 'lips';
  return null;
}

function guessCategoryByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('sunscreen') || t.includes('sun cream') || t.includes('sun stick') || t.includes('spf')) return 'sunscreen';
  if (t.includes('shampoo') || t.includes('hair bonding') || t.includes('hair ')) return 'haircare';
  if (t.includes('serum') || t.includes('ampoule') || t.includes('essence') || t.includes('booster')) return 'serum';
  if (t.includes('cream') || t.includes('moistur') || t.includes('lotion') || t.includes('mist')) return 'cream';
  if (t.includes('cleanser') || t.includes('foam') || t.includes('wash') || t.includes('cleansing')) return 'cleanser';
  if (t.includes('toner') || t.includes('liquid') || t.includes('water')) return 'toner';
  if (t.includes('mask') || t.includes('pad') || t.includes('patch') || t.includes('peel')) return 'mask-pad';
  if (t.includes('lip')) return 'lips';
  if (t.includes('oil') && !t.includes('cleansing oil')) return 'serum';
  if (t.includes('powder')) return 'others';
  return 'others';
}

function guessCategory(product) {
  const fromTags = guessCategoryByTags(product.tags);
  if (fromTags) return fromTags;
  return guessCategoryByTitle(product.title);
}

async function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (files.length === 0) {
    console.error('No product JSON files found in cosrx-raw/. Run scrape-cosrx.mjs first.');
    process.exit(1);
  }

  const pgClient = new pg.Client(SUPABASE_DB_URL);
  await pgClient.connect();

  const { rows: brandRows } = await pgClient.query("SELECT id, slug FROM brands");
  const brandMap = Object.fromEntries(brandRows.map((b) => [b.slug, b.id]));
  const cosrxId = brandMap['cosrx'];
  if (!cosrxId) {
    console.error('Brand "cosrx" not found in brands table. Run the migration first.');
    process.exit(1);
  }

  const { rows: catRows } = await pgClient.query("SELECT id, slug FROM categories");
  const catMap = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let tagCount = 0;

  for (const file of files) {
    const product = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));
    const handle = product.handle;

    const catSlug = guessCategory(product);
    const categoryId = catMap[catSlug] || catMap['others'];
    const sourceUrl = `https://www.cosrx.com/products/${handle}`;

    await pgClient.query(
      `INSERT INTO products (name, slug, description, source_url, category_id, brand_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO NOTHING`,
      [product.title, handle, product.body_html || null, sourceUrl, categoryId, cosrxId, product.created_at, product.updated_at]
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
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
