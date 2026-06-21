-- Rename _ru suffixed columns to language-neutral names
-- Primary language is English; translations (name_ru, etc.) will be added later

ALTER TABLE products RENAME COLUMN name_ru TO name;
ALTER TABLE products RENAME COLUMN description_ru TO description;
ALTER TABLE categories RENAME COLUMN name_ru TO name;
ALTER TABLE product_variants RENAME COLUMN name_ru TO name;
