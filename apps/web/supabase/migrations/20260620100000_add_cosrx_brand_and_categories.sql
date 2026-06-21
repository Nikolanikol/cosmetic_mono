-- Add COSRX brand and new categories (sunscreen, haircare)
insert into brands (name, slug) values ('COSRX', 'cosrx')
on conflict (slug) do nothing;

insert into categories (name_ru, slug, sort_order) values
  ('Солнцезащита', 'sunscreen', 18),
  ('Уход за волосами', 'haircare', 19)
on conflict (slug) do nothing;
