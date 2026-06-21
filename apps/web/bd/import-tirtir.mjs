import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const RAW_DIR = path.join(__dirname, 'tirtir-raw');
const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';

const shadeColors = JSON.parse(fs.readFileSync(path.join(__dirname, 'tirtir-shade-colors.json'), 'utf-8'));
const allColors = { ...shadeColors.cushion, ...shadeColors.lip, ...shadeColors.other };

const SKIP_HANDLES = new Set([
  'tirtir-gift-card',
  'soft-shell-cushion-puff',
  'glow-base-set',
  'glow-base-set2',
  'pore-base-set',
  'mask-fit-cushion-mini',
  'mask-fit-cushion-refill',
  'mask-fit-all-cover-cushion-refill',
  'mask-fit-red-cushion-refill',
]);

function shouldSkipProduct(product) {
  if (SKIP_HANDLES.has(product.handle)) return 'skip list';
  if (product.title.startsWith('(Set)')) return 'set duplicate';
  if (product.product_type === 'Bundle') return 'bundle';
  return null;
}

const PRODUCT_TYPE_TO_CATEGORY = {
  'Cushion': 'cushion',
  'Primer': 'primer',
  'Foundation': 'foundation',
  'Concealer': 'concealer',
  'Lip Tint': 'lips',
  'Lip Balm': 'lips',
  'Lip Oil': 'lips',
  'Lip Plumper': 'lips',
  'Blush': 'blush',
  'Highlighter': 'highlighter',
  'Makeup Fixer': 'setting-spray',
  'Setting Spray': 'setting-spray',
};

function guessCategoryByTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('cushion')) return 'cushion';
  if (t.includes('primer')) return 'primer';
  if (t.includes('foundation')) return 'foundation';
  if (t.includes('concealer')) return 'concealer';
  if (t.includes('tint') || t.includes('lip balm') || t.includes('lip oil') || t.includes('lip plumper') || t.includes('lip gloss')) return 'lips';
  if (t.includes('blush')) return 'blush';
  if (t.includes('highlighter')) return 'highlighter';
  if (t.includes('setting') || t.includes('fixer') || t.includes('spray')) return 'setting-spray';
  if (t.includes('serum') || t.includes('ampoule')) return 'serum';
  if (t.includes('cream') || t.includes('moistur')) return 'cream';
  if (t.includes('cleanser') || t.includes('foam') || t.includes('wash')) return 'cleanser';
  if (t.includes('toner') || t.includes('water')) return 'toner';
  if (t.includes('mask') || t.includes('pad') || t.includes('patch')) return 'mask-pad';
  return 'others';
}

function lookupColor(variantTitle) {
  if (allColors[variantTitle]) return allColors[variantTitle];
  const normalized = variantTitle.trim();
  for (const [key, hex] of Object.entries(allColors)) {
    if (key.toLowerCase() === normalized.toLowerCase()) return hex;
  }
  return null;
}

async function main() {
  const files = fs.readdirSync(RAW_DIR).filter((f) => f.endsWith('.json') && !f.startsWith('_'));
  if (files.length === 0) {
    console.error('No product JSON files found in tirtir-raw/. Run scrape-tirtir.mjs first.');
    process.exit(1);
  }

  const pgClient = new pg.Client(SUPABASE_DB_URL);
  await pgClient.connect();

  const { rows: brandRows } = await pgClient.query("SELECT id, slug FROM brands");
  const brandMap = Object.fromEntries(brandRows.map((b) => [b.slug, b.id]));
  const tirtirId = brandMap['tirtir'];
  if (!tirtirId) {
    console.error('Brand "tirtir" not found in brands table. Run the catalog migration first.');
    process.exit(1);
  }

  const { rows: catRows } = await pgClient.query("SELECT id, slug FROM categories");
  const catMap = Object.fromEntries(catRows.map((c) => [c.slug, c.id]));

  let productCount = 0;
  let variantCount = 0;
  let imageCount = 0;
  let tagCount = 0;
  let colorCount = 0;
  const unmappedTypes = new Set();

  const skipped = [];

  for (const file of files) {
    const product = JSON.parse(fs.readFileSync(path.join(RAW_DIR, file), 'utf-8'));
    const handle = product.handle;

    const skipReason = shouldSkipProduct(product);
    if (skipReason) {
      skipped.push({ handle, reason: skipReason });
      continue;
    }

    let catSlug = PRODUCT_TYPE_TO_CATEGORY[product.product_type];
    if (!catSlug) {
      catSlug = guessCategoryByTitle(product.title);
      if (product.product_type) unmappedTypes.add(product.product_type);
    }

    const categoryId = catMap[catSlug] || catMap['others'];
    const sourceUrl = `https://tirtir.global/products/${handle}`;

    await pgClient.query(
      `INSERT INTO products (name, slug, description, source_url, category_id, brand_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
       ON CONFLICT (slug) DO NOTHING`,
      [product.title, handle, product.body_html || null, sourceUrl, categoryId, tirtirId, product.created_at, product.updated_at]
    );

    const { rows: [inserted] } = await pgClient.query("SELECT id FROM products WHERE slug = $1", [handle]);
    if (!inserted) {
      console.log(`  SKIP (already exists): ${handle}`);
      continue;
    }
    const productId = inserted.id;
    productCount++;

    for (const v of product.variants) {
      const colorHex = lookupColor(v.title) || lookupColor(v.option1) || null;
      if (colorHex) colorCount++;

      await pgClient.query(
        `INSERT INTO product_variants (product_id, name, price, compare_at_price, sku, in_stock, weight_g, color_hex)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
        [productId, v.title || v.option1 || 'Default', v.price, v.compare_at_price || null, v.sku || null, true, v.grams || 0, colorHex]
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
  console.log(`Variants: ${variantCount} (${colorCount} with color_hex)`);
  console.log(`Images:   ${imageCount}`);
  console.log(`Tags:     ${tagCount}`);

  if (skipped.length > 0) {
    console.log(`Skipped: ${skipped.length}`);
    skipped.forEach((s) => console.log(`  ${s.handle}: ${s.reason}`));
  }
  if (unmappedTypes.size > 0) {
    console.log(`\nUnmapped product_types (guessed by title): ${[...unmappedTypes].join(', ')}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
