-- ============================================================================
-- Cosmetics E-Commerce Database Schema
-- For Supabase (PostgreSQL)
-- Target Market: Russia
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- ENUMS
-- ============================================================================

-- User roles
CREATE TYPE user_role AS ENUM ('customer', 'admin');

-- Skin types
CREATE TYPE skin_type AS ENUM ('dry', 'oily', 'combination', 'sensitive', 'normal');

-- Order statuses
CREATE TYPE order_status AS ENUM ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded');

-- Shipping methods
CREATE TYPE shipping_method AS ENUM ('sdek', 'pochta', 'pickup');

-- Discount types
CREATE TYPE discount_type AS ENUM ('percent', 'fixed_rub');

-- Origin countries
CREATE TYPE origin_country AS ENUM ('KR', 'FR', 'DE', 'IT', 'US', 'JP', 'CN', 'GB', 'ES', 'SE');

-- ============================================================================
-- PROFILES (extends auth.users)
-- ============================================================================

CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'customer',
  skin_type skin_type,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_skin_type ON profiles(skin_type);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'customer')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- BRANDS
-- ============================================================================

CREATE TABLE brands (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  origin_country origin_country NOT NULL,
  logo_url TEXT,
  description TEXT,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_brands_slug ON brands(slug);
CREATE INDEX idx_brands_origin_country ON brands(origin_country);
CREATE INDEX idx_brands_is_featured ON brands(is_featured) WHERE is_featured = TRUE;

-- Trigger for updated_at
CREATE TRIGGER update_brands_updated_at
  BEFORE UPDATE ON brands
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- CATEGORIES
-- ============================================================================

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_categories_slug ON categories(slug);
CREATE INDEX idx_categories_parent_id ON categories(parent_id);
CREATE INDEX idx_categories_sort_order ON categories(sort_order);

-- ============================================================================
-- PRODUCTS
-- ============================================================================

CREATE TABLE products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name_ru TEXT NOT NULL,
  name_en TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description_ru TEXT,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE RESTRICT,
  brand_id UUID NOT NULL REFERENCES brands(id) ON DELETE RESTRICT,
  is_active BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  routine_step INTEGER CHECK (routine_step BETWEEN 1 AND 10),
  skin_types skin_type[] DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  meta_title_ru TEXT,
  meta_description_ru TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_products_slug ON products(slug);
CREATE INDEX idx_products_category_id ON products(category_id);
CREATE INDEX idx_products_brand_id ON products(brand_id);
CREATE INDEX idx_products_is_active ON products(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_products_is_featured ON products(is_featured) WHERE is_featured = TRUE;
CREATE INDEX idx_products_routine_step ON products(routine_step) WHERE routine_step IS NOT NULL;
CREATE INDEX idx_products_skin_types ON products USING GIN(skin_types);
CREATE INDEX idx_products_tags ON products USING GIN(tags);
CREATE INDEX idx_products_created_at ON products(created_at);

-- Full-text search index
CREATE INDEX idx_products_search ON products 
  USING gin(to_tsvector('russian', name_ru || ' ' || COALESCE(description_ru, '')));

-- Trigger for updated_at
CREATE TRIGGER update_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PRODUCT VARIANTS
-- ============================================================================

CREATE TABLE product_variants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  sku TEXT UNIQUE NOT NULL,
  name_ru TEXT NOT NULL,
  price_rub NUMERIC(10,2) NOT NULL CHECK (price_rub >= 0),
  sale_price_rub NUMERIC(10,2) CHECK (sale_price_rub IS NULL OR sale_price_rub < price_rub),
  stock INTEGER DEFAULT 0 CHECK (stock >= 0),
  attributes JSONB DEFAULT '{}',
  weight_g INTEGER CHECK (weight_g >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_variants_product_id ON product_variants(product_id);
CREATE INDEX idx_product_variants_sku ON product_variants(sku);
CREATE INDEX idx_product_variants_price ON product_variants(price_rub);
CREATE INDEX idx_product_variants_sale_price ON product_variants(sale_price_rub) WHERE sale_price_rub IS NOT NULL;
CREATE INDEX idx_product_variants_stock ON product_variants(stock);

-- ============================================================================
-- PRODUCT IMAGES
-- ============================================================================

CREATE TABLE product_images (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  alt_ru TEXT,
  is_primary BOOLEAN DEFAULT FALSE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_images_product_id ON product_images(product_id);
CREATE INDEX idx_product_images_is_primary ON product_images(is_primary) WHERE is_primary = TRUE;
CREATE INDEX idx_product_images_sort_order ON product_images(sort_order);

-- Ensure only one primary image per product
CREATE UNIQUE INDEX idx_product_images_one_primary 
  ON product_images(product_id) 
  WHERE is_primary = TRUE;

-- ============================================================================
-- PRODUCT INGREDIENTS
-- ============================================================================

CREATE TABLE product_ingredients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  inci_name TEXT NOT NULL,
  name_ru TEXT NOT NULL,
  purpose_ru TEXT,
  is_highlighted BOOLEAN DEFAULT FALSE,
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_product_ingredients_product_id ON product_ingredients(product_id);
CREATE INDEX idx_product_ingredients_is_highlighted ON product_ingredients(is_highlighted) WHERE is_highlighted = TRUE;

-- ============================================================================
-- WISHLISTS
-- ============================================================================

CREATE TABLE wishlists (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

-- Indexes
CREATE INDEX idx_wishlists_user_id ON wishlists(user_id);
CREATE INDEX idx_wishlists_product_id ON wishlists(product_id);

-- ============================================================================
-- CART ITEMS
-- ============================================================================

CREATE TABLE cart_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  session_id TEXT,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT cart_items_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_cart_items_user_id ON cart_items(user_id);
CREATE INDEX idx_cart_items_session_id ON cart_items(session_id);
CREATE INDEX idx_cart_items_variant_id ON cart_items(variant_id);

-- Trigger for updated_at
CREATE TRIGGER update_cart_items_updated_at
  BEFORE UPDATE ON cart_items
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PROMO CODES
-- ============================================================================

CREATE TABLE promo_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  discount_type discount_type NOT NULL,
  discount_value NUMERIC(10,2) NOT NULL CHECK (discount_value >= 0),
  min_order_rub NUMERIC(10,2) CHECK (min_order_rub IS NULL OR min_order_rub >= 0),
  usage_limit INTEGER CHECK (usage_limit IS NULL OR usage_limit > 0),
  used_count INTEGER DEFAULT 0 CHECK (used_count >= 0),
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT promo_codes_usage_check CHECK (used_count <= COALESCE(usage_limit, used_count + 1))
);

-- Indexes
CREATE INDEX idx_promo_codes_code ON promo_codes(code);
CREATE INDEX idx_promo_codes_is_active ON promo_codes(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_promo_codes_expires_at ON promo_codes(expires_at);

-- Trigger for updated_at
CREATE TRIGGER update_promo_codes_updated_at
  BEFORE UPDATE ON promo_codes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment promo code usage
CREATE OR REPLACE FUNCTION increment_promo_code_usage(promo_code_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE promo_codes
  SET used_count = used_count + 1
  WHERE id = promo_code_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- ORDERS
-- ============================================================================

CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending',
  total_rub NUMERIC(10,2) NOT NULL CHECK (total_rub >= 0),
  promo_code_id UUID REFERENCES promo_codes(id) ON DELETE SET NULL,
  discount_rub NUMERIC(10,2) DEFAULT 0 CHECK (discount_rub >= 0),
  yookassa_payment_id TEXT,
  yookassa_payment_url TEXT,
  shipping_address JSONB,
  shipping_method shipping_method,
  tracking_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_yookassa_payment_id ON orders(yookassa_payment_id);

-- Trigger for updated_at
CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ORDER ITEMS
-- ============================================================================

CREATE TABLE order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price_rub_at_purchase NUMERIC(10,2) NOT NULL CHECK (price_rub_at_purchase >= 0),
  product_snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_variant_id ON order_items(variant_id);

-- ============================================================================
-- REVIEWS
-- ============================================================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title TEXT,
  body TEXT,
  skin_type skin_type,
  is_verified_purchase BOOLEAN DEFAULT FALSE,
  helpful_count INTEGER DEFAULT 0 CHECK (helpful_count >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(product_id, user_id)
);

-- Indexes
CREATE INDEX idx_reviews_product_id ON reviews(product_id);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_created_at ON reviews(created_at);

-- Trigger for updated_at
CREATE TRIGGER update_reviews_updated_at
  BEFORE UPDATE ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to increment helpful count
CREATE OR REPLACE FUNCTION increment_review_helpful(review_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE reviews
  SET helpful_count = helpful_count + 1
  WHERE id = review_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- QUIZ RESULTS
-- ============================================================================

CREATE TABLE quiz_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  answers JSONB NOT NULL,
  skin_type_result skin_type NOT NULL,
  recommended_product_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT quiz_results_user_or_session CHECK (
    (user_id IS NOT NULL AND session_id IS NULL) OR
    (user_id IS NULL AND session_id IS NOT NULL) OR
    (user_id IS NOT NULL AND session_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_quiz_results_user_id ON quiz_results(user_id);
CREATE INDEX idx_quiz_results_session_id ON quiz_results(session_id);
CREATE INDEX idx_quiz_results_skin_type ON quiz_results(skin_type_result);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_results ENABLE ROW LEVEL SECURITY;

-- Helper function to check admin role.
-- SECURITY DEFINER bypasses RLS on profiles, preventing infinite recursion
-- when policies on other tables need to check if the current user is an admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- Profiles policies
CREATE POLICY "Profiles: Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Profiles: Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Profiles: Admin can read all profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

-- Brands policies (public read, admin write)
CREATE POLICY "Brands: Public read"
  ON brands FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Brands: Admin can insert"
  ON brands FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Brands: Admin can update"
  ON brands FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Brands: Admin can delete"
  ON brands FOR DELETE
  USING (public.is_admin());

-- Categories policies (public read, admin write)
CREATE POLICY "Categories: Public read"
  ON categories FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Categories: Admin can insert"
  ON categories FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Categories: Admin can update"
  ON categories FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Categories: Admin can delete"
  ON categories FOR DELETE
  USING (public.is_admin());

-- Products policies (public read, admin write)
CREATE POLICY "Products: Public read active products"
  ON products FOR SELECT
  TO PUBLIC
  USING (is_active = TRUE);

CREATE POLICY "Products: Admin can read all"
  ON products FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Products: Admin can insert"
  ON products FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Products: Admin can update"
  ON products FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Products: Admin can delete"
  ON products FOR DELETE
  USING (public.is_admin());

-- Product variants policies (public read, admin write)
CREATE POLICY "Product variants: Public read"
  ON product_variants FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Product variants: Admin can write"
  ON product_variants FOR ALL
  USING (public.is_admin());

-- Product images policies (public read, admin write)
CREATE POLICY "Product images: Public read"
  ON product_images FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Product images: Admin can write"
  ON product_images FOR ALL
  USING (public.is_admin());

-- Product ingredients policies (public read, admin write)
CREATE POLICY "Product ingredients: Public read"
  ON product_ingredients FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Product ingredients: Admin can write"
  ON product_ingredients FOR ALL
  USING (public.is_admin());

-- Wishlists policies (user only)
CREATE POLICY "Wishlists: Users can read own wishlist"
  ON wishlists FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Wishlists: Users can insert own items"
  ON wishlists FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Wishlists: Users can delete own items"
  ON wishlists FOR DELETE
  USING (auth.uid() = user_id);

-- Cart items policies
CREATE POLICY "Cart items: Users can read own cart"
  ON cart_items FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Cart items: Users can read session cart"
  ON cart_items FOR SELECT
  USING (session_id IS NOT NULL);

CREATE POLICY "Cart items: Users can insert own items"
  ON cart_items FOR INSERT
  WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Cart items: Users can update own items"
  ON cart_items FOR UPDATE
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Cart items: Users can delete own items"
  ON cart_items FOR DELETE
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Promo codes policies (public read active, admin write)
CREATE POLICY "Promo codes: Public read active"
  ON promo_codes FOR SELECT
  TO PUBLIC
  USING (is_active = TRUE AND (expires_at IS NULL OR expires_at > NOW()));

CREATE POLICY "Promo codes: Admin can read all"
  ON promo_codes FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Promo codes: Admin can write"
  ON promo_codes FOR ALL
  USING (public.is_admin());

-- Orders policies
CREATE POLICY "Orders: Users can read own orders"
  ON orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Orders: Admin can read all"
  ON orders FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Orders: Users can insert own orders"
  ON orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders: Admin can update"
  ON orders FOR UPDATE
  USING (public.is_admin());

-- Order items policies
CREATE POLICY "Order items: Users can read own items"
  ON order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

CREATE POLICY "Order items: Admin can read all"
  ON order_items FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Order items: Admin can insert"
  ON order_items FOR INSERT
  WITH CHECK (public.is_admin());

-- Reviews policies
CREATE POLICY "Reviews: Public read"
  ON reviews FOR SELECT
  TO PUBLIC
  USING (TRUE);

CREATE POLICY "Reviews: Users can insert own reviews"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Reviews: Users can update own reviews"
  ON reviews FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviews: Users can delete own reviews"
  ON reviews FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Reviews: Admin can delete any"
  ON reviews FOR DELETE
  USING (public.is_admin());

-- Quiz results policies
CREATE POLICY "Quiz results: Users can read own results"
  ON quiz_results FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Quiz results: Users can insert"
  ON quiz_results FOR INSERT
  WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Quiz results: Users can update own"
  ON quiz_results FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert sample brands
INSERT INTO brands (name, slug, origin_country, description, is_featured) VALUES
('COSRX', 'cosrx', 'KR', 'Корейский бренд с фокусом на простые и эффективные формулы', TRUE),
('Beauty of Joseon', 'beauty-of-joseon', 'KR', 'Корейский бренд с традиционными ингредиентами', TRUE),
('La Roche-Posay', 'la-roche-posay', 'FR', 'Французская дерматологическая косметика', TRUE),
('Vichy', 'vichy', 'FR', 'Французская термальная косметика', TRUE),
('The Ordinary', 'the-ordinary', 'CA', 'Канадский бренд с простыми и доступными сыворотками', TRUE),
('Paula''s Choice', 'paulas-choice', 'US', 'Американский бренд научно обоснованной косметики', TRUE),
('Some By Mi', 'some-by-mi', 'KR', 'Корейский бренд с натуральными ингредиентами', FALSE),
('Purito', 'purito', 'KR', 'Корейский бренд с чистыми формулами', FALSE),
('CeraVe', 'cerave', 'US', 'Американская дерматологическая косметика', TRUE),
('Bioderma', 'bioderma', 'FR', 'Французская дерматологическая косметика', FALSE);

-- Insert sample categories
INSERT INTO categories (name_ru, name_en, slug, sort_order) VALUES
('Уход за лицом', 'Face Care', 'uhod-za-litsom', 1),
('Очищение', 'Cleansing', 'ochishchenie', 2),
('Тонеры', 'Toners', 'tonery', 3),
('Сыворотки', 'Serums', 'syvorotki', 4),
('Кремы', 'Creams', 'kremy', 5),
('Маски', 'Masks', 'maski', 6),
('SPF', 'Sunscreen', 'spf', 7),
('Уход за глазами', 'Eye Care', 'uhod-za-glazami', 8),
('Макияж', 'Makeup', 'makiyazh', 9),
('Для тела', 'Body Care', 'dlya-tela', 10);

-- Insert subcategories
INSERT INTO categories (name_ru, name_en, slug, parent_id, sort_order)
SELECT 'Гидрофильное масло', 'Cleansing Oil', 'gidrofilnoe-maslo', id, 1
FROM categories WHERE slug = 'ochishchenie';

INSERT INTO categories (name_ru, name_en, slug, parent_id, sort_order)
SELECT 'Пенка для умывания', 'Cleansing Foam', 'penka-dlya-umyvaniya', id, 2
FROM categories WHERE slug = 'ochishchenie';

-- ============================================================================
-- COMPLETION
-- ============================================================================

-- Verify setup
SELECT 'Database schema created successfully' AS status;
