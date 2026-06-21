import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'mediheal-raw');
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const PRODUCT_TYPE_TO_CATEGORY = {
  'Sheet Mask': 'mask-pad',
  'Toner Pad': 'toner',
  'Peeling Pad': 'toner',
  'Modeling Pack': 'mask-pad',
  'Serum': 'serum',
  'Cleanser': 'cleanser',
  'Face': 'mask-pad',
  'Body': 'others',
  'Bundle': 'others',
};

function guessCategoryByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('duo') || t.includes('trio') || t.includes('set') || t.includes('1+1') || t.includes('+ refill')) return 'others';
  if (t.includes('serum') || t.includes('ampoule') || t.includes('essence')) return 'serum';
  if (t.includes('cream') || t.includes('moistur') || t.includes('lotion')) return 'cream';
  if (t.includes('cleanser') || t.includes('wash') || t.includes('foam')) return 'cleanser';
  if (t.includes('toner') || t.includes(' pad')) return 'toner';
  if (t.includes('mask') || t.includes('patch') || t.includes('peel')) return 'mask-pad';
  return 'others';
}

async function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (files.length === 0) {
    console.error('No product JSON files found in mediheal-raw/.');
    process.exit(1);
  }

  const pgClient = new pg.Client(SUPABASE_DB_URL);
  await pgClient.connect();

  const { rows: brandRows } = await pgClient.query("SELECT id, slug FROM brands");
  const brandMap = Object.fromEntries(brandRows.map((b) => [b.slug, b.id]));
  const brandId = brandMap['mediheal'];
  if (!brandId) {
    console.error('Brand "mediheal" not found in brands table.');
    process.exit(1);
  }

  const { rows: catRows } = await pgClient.query("SELECT id, slug FROM categories");
  const catMap = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let tagCount = 0;
  const unmappedTypes = new Set();

  for (const file of files) {
    const product = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));
    const handle = product.handle;

    let catSlug = PRODUCT_TYPE_TO_CATEGORY[product.product_type];
    if (!catSlug) {
      catSlug = guessCategoryByTitle(product.title);
      if (product.product_type) unmappedTypes.add(product.product_type);
    }

    const categoryId = catMap[catSlug] || catMap['others'];
    const sourceUrl = `https://mediheal.com/products/${handle}`;

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

  if (unmappedTypes.size > 0) {
    console.log(`\nUnmapped product_types (guessed by title): ${[...unmappedTypes].join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
