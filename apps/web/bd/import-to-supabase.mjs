import Database from 'better-sqlite3';
import pg from 'pg';

const SUPABASE_DB_URL = process.env.SUPABASE_DB_URL || 'postgresql://postgres:postgres@127.0.0.1:54322/postgres';
const sqlite = new Database('./bd/skin1004.db', { readonly: true });
const pgClient = new pg.Client(SUPABASE_DB_URL);

const CATEGORY_MAP = {
  'Cleanser': 'cleanser',
  'Toner': 'toner',
  'Ampoule/Serum': 'serum',
  'Cream': 'cream',
  'Mask/Pad': 'mask-pad',
  'Others': 'others',
};

async function main() {
  await pgClient.connect();

  // Load brand & category IDs
  const { rows: brandRows } = await pgClient.query("SELECT id, slug FROM brands");
  const brandMap = Object.fromEntries(brandRows.map(b => [b.slug, b.id]));

  const { rows: catRows } = await pgClient.query("SELECT id, slug FROM categories");
  const catMap = Object.fromEntries(catRows.map(c => [c.slug, c.id]));

  const skin1004Id = brandMap['skin1004'];

  // Products
  const products = sqlite.prepare('SELECT * FROM products').all();
  for (const p of products) {
    const catSlug = CATEGORY_MAP[p.product_type] || 'others';
    const sourceUrl = `https://skin1004.com/products/${p.handle}`;
    await pgClient.query(
      `INSERT INTO products (name, slug, description, source_url, category_id, brand_id, created_at, updated_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
      [p.title, p.handle, p.body_html, sourceUrl, catMap[catSlug], skin1004Id, p.created_at, p.updated_at]
    );
  }
  // Get inserted product IDs by slug
  const { rows: insertedProducts } = await pgClient.query("SELECT id, slug FROM products");
  const productMap = Object.fromEntries(insertedProducts.map(p => [p.slug, p.id]));

  // Map old shopify product_id -> new postgres product_id via handle
  const oldToNew = {};
  for (const p of products) {
    oldToNew[p.id] = productMap[p.handle];
  }
  console.log(`Products: ${products.length} imported`);

  // Variants
  const variants = sqlite.prepare('SELECT * FROM variants').all();
  for (const v of variants) {
    const newProductId = oldToNew[v.product_id];
    if (!newProductId) continue;
    await pgClient.query(
      `INSERT INTO product_variants (product_id, name, price, compare_at_price, sku, in_stock, weight_g)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [newProductId, v.title || v.option1 || 'Default', v.price, v.compare_at_price, v.sku, v.available === 1, v.grams || 0]
    );
  }
  console.log(`Variants: ${variants.length} imported`);

  // Images
  const images = sqlite.prepare('SELECT * FROM images').all();
  for (const img of images) {
    const newProductId = oldToNew[img.product_id];
    if (!newProductId) continue;
    await pgClient.query(
      `INSERT INTO product_images (product_id, url, alt, is_primary, sort_order)
       VALUES ($1,$2,$3,$4,$5)`,
      [newProductId, img.src, img.alt, img.position === 1, img.position]
    );
  }
  console.log(`Images: ${images.length} imported`);

  // Tags
  const tags = sqlite.prepare('SELECT * FROM product_tags').all();
  let tagCount = 0;
  for (const t of tags) {
    const newProductId = oldToNew[t.product_id];
    if (!newProductId) continue;
    await pgClient.query(
      `INSERT INTO product_tags (product_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING`,
      [newProductId, t.tag]
    );
    tagCount++;
  }
  console.log(`Tags: ${tagCount} imported`);

  await pgClient.end();
  sqlite.close();
  console.log('Done!');
}

main().catch(err => { console.error(err); process.exit(1); });
