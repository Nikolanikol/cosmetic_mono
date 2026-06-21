-- Add color_hex to product_variants for color swatch display
alter table product_variants add column color_hex text;

-- New makeup categories for TIRTIR products
insert into categories (name_ru, slug, sort_order) values
  ('Кушон', 'cushion', 10),
  ('Праймер', 'primer', 11),
  ('Тональный крем', 'foundation', 12),
  ('Консилер', 'concealer', 13),
  ('Губы', 'lips', 14),
  ('Румяна', 'blush', 15),
  ('Хайлайтер', 'highlighter', 16),
  ('Фиксатор макияжа', 'setting-spray', 17);
