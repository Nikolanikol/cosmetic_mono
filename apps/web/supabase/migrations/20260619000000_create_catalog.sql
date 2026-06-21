-- Brands
create table brands (
  id serial primary key,
  name text unique not null,
  slug text unique not null,
  origin_country text not null default 'KR',
  logo_url text,
  description text,
  is_featured boolean not null default false,
  created_at timestamptz not null default now()
);

-- Categories (flat, no hierarchy for now)
create table categories (
  id serial primary key,
  name_ru text not null,
  slug text unique not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Products
create table products (
  id bigint primary key generated always as identity,
  name_ru text not null,
  slug text unique not null,
  description_ru text,
  source_url text,
  category_id integer references categories(id),
  brand_id integer not null references brands(id),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Variants
create table product_variants (
  id bigint primary key generated always as identity,
  product_id bigint not null references products(id) on delete cascade,
  name_ru text not null,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  sku text,
  in_stock boolean not null default true,
  weight_g integer not null default 0,
  created_at timestamptz not null default now()
);

-- Images
create table product_images (
  id bigint primary key generated always as identity,
  product_id bigint not null references products(id) on delete cascade,
  url text not null,
  alt text,
  is_primary boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

-- Tags
create table product_tags (
  product_id bigint not null references products(id) on delete cascade,
  tag text not null,
  primary key (product_id, tag)
);

-- Indexes
create index idx_products_brand_id on products(brand_id);
create index idx_products_category_id on products(category_id);
create index idx_products_slug on products(slug);
create index idx_product_variants_product_id on product_variants(product_id);
create index idx_product_images_product_id on product_images(product_id);
create index idx_product_tags_tag on product_tags(tag);

-- RLS: allow public read access
alter table brands enable row level security;
create policy "brands_read" on brands for select using (true);

alter table categories enable row level security;
create policy "categories_read" on categories for select using (true);

alter table products enable row level security;
create policy "products_read" on products for select using (true);

alter table product_variants enable row level security;
create policy "variants_read" on product_variants for select using (true);

alter table product_images enable row level security;
create policy "images_read" on product_images for select using (true);

alter table product_tags enable row level security;
create policy "tags_read" on product_tags for select using (true);

-- Grant read access to anon and authenticated roles
grant select on brands to anon, authenticated;
grant select on categories to anon, authenticated;
grant select on products to anon, authenticated;
grant select on product_variants to anon, authenticated;
grant select on product_images to anon, authenticated;
grant select on product_tags to anon, authenticated;

-- Seed brands
insert into brands (name, slug) values
  ('Beauty of Joseon', 'beauty-of-joseon'),
  ('SKIN1004', 'skin1004'),
  ('TIRTIR', 'tirtir'),
  ('Anua', 'anua'),
  ('COSRX', 'cosrx'),
  ('Torriden', 'torriden'),
  ('Medicube', 'medicube'),
  ('Mediheal', 'mediheal');

-- Seed categories
insert into categories (name_ru, slug, sort_order) values
  ('Очищение', 'cleanser', 1),
  ('Тонер', 'toner', 2),
  ('Сыворотка', 'serum', 3),
  ('Крем', 'cream', 4),
  ('Маска', 'mask-pad', 5),
  ('Другое', 'others', 99);
