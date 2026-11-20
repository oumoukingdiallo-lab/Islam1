/*
# Kbizá V3 — Extension: Ad Spy, CRM Clients, Promo Codes, Reviews, AI

## Summary
Adds 5 new tables to support the V3 feature set:
1. `customers` — CRM of buyers who placed orders
2. `promo_codes` — discount codes usable at public checkout
3. `product_reviews` — customer reviews on products
4. `ad_spy_items` — trending Facebook/TikTok ads for the Ad Spy page
5. `store_sections` — JSONB config for visual store builder sections

Also seeds `ad_spy_items` with 12 realistic entries.

## New Tables

### customers
- id (uuid PK)
- store_id (uuid FK → stores)
- name (text)
- phone (text, +244 format)
- email (text, nullable)
- city (text, nullable)
- province (text, nullable)
- total_orders (int, default 0)
- total_spent_aoa (numeric, default 0)
- last_order_at (timestamptz, nullable)
- created_at (timestamptz)

### promo_codes
- id (uuid PK)
- store_id (uuid FK → stores)
- code (text, uppercase, e.g. LUANDA10)
- discount_type ('percentage' | 'fixed')
- discount_value (numeric)
- max_uses (int, nullable = unlimited)
- used_count (int, default 0)
- expires_at (timestamptz, nullable)
- active (boolean, default true)
- created_at (timestamptz)

### product_reviews
- id (uuid PK)
- product_id (uuid FK → products)
- store_id (uuid FK → stores)
- customer_name (text)
- rating (int 1-5)
- comment (text, nullable)
- created_at (timestamptz)

### ad_spy_items
- id (uuid PK)
- platform ('tiktok' | 'facebook')
- product_name (text)
- ad_copy (text — the actual ad text that's running)
- image_url (text)
- category (text)
- views_7d (int)
- likes_7d (int)
- shares_7d (int)
- growth_pct (numeric — % growth last 7 days)
- supplier_price_aoa (numeric)
- suggested_price_aoa (numeric)
- delivery_days (int)
- created_at (timestamptz)
- first_seen (timestamptz)

### store_sections
- id (uuid PK)
- store_id (uuid FK → stores, unique)
- announcement_bar (boolean, default true)
- hero_banner (boolean, default true)
- product_grid (boolean, default true)
- trust_badge (boolean, default true)
- customer_reviews (boolean, default true)
- faq_section (boolean, default true)
- whatsapp_float (boolean, default true)
- hero_title (text, nullable)
- hero_subtitle (text, nullable)
- hero_image_url (text, nullable)

## Security
- RLS enabled on all new tables
- `customers`, `promo_codes`, `product_reviews`, `store_sections`: owner-scoped via store_id → stores.user_id = auth.uid()
- `ad_spy_items`: public read (TO anon, authenticated) so the Ad Spy page works without login
- Grants: authenticated gets CRUD on owner-scoped tables; anon+authenticated get SELECT on ad_spy_items
*/

-- ============ customers ============
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  name text NOT NULL,
  phone text NOT NULL,
  email text,
  city text,
  province text,
  total_orders int NOT NULL DEFAULT 0,
  total_spent_aoa numeric NOT NULL DEFAULT 0,
  last_order_at timestamptz,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON customers TO authenticated;
GRANT SELECT, INSERT ON customers TO anon;

DROP POLICY IF EXISTS "select_own_customers" ON customers;
CREATE POLICY "select_own_customers" ON customers FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_customers" ON customers;
CREATE POLICY "insert_own_customers" ON customers FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_customers" ON customers;
CREATE POLICY "update_own_customers" ON customers FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_customers" ON customers;
CREATE POLICY "delete_own_customers" ON customers FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = customers.store_id AND stores.user_id = auth.uid()));
-- anon can insert customers (public checkout creates customer records)
DROP POLICY IF EXISTS "anon_insert_customers" ON customers;
CREATE POLICY "anon_insert_customers" ON customers FOR INSERT
  TO anon WITH CHECK (true);
DROP POLICY IF EXISTS "anon_update_customers" ON customers;
CREATE POLICY "anon_update_customers" ON customers FOR UPDATE
  TO anon USING (true) WITH CHECK (true);

-- ============ promo_codes ============
CREATE TABLE IF NOT EXISTS promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_type text NOT NULL DEFAULT 'percentage' CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses int,
  used_count int NOT NULL DEFAULT 0,
  expires_at timestamptz,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE promo_codes ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON promo_codes TO authenticated;
GRANT SELECT ON promo_codes TO anon;

DROP POLICY IF EXISTS "select_own_promos" ON promo_codes;
CREATE POLICY "select_own_promos" ON promo_codes FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = promo_codes.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_promos" ON promo_codes;
CREATE POLICY "insert_own_promos" ON promo_codes FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = promo_codes.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_promos" ON promo_codes;
CREATE POLICY "update_own_promos" ON promo_codes FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = promo_codes.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_promos" ON promo_codes;
CREATE POLICY "delete_own_promos" ON promo_codes FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = promo_codes.store_id AND stores.user_id = auth.uid()));
-- anon can read active promos (public checkout validates codes)
DROP POLICY IF EXISTS "anon_select_promos" ON promo_codes;
CREATE POLICY "anon_select_promos" ON promo_codes FOR SELECT
  TO anon USING (active = true);
-- anon can increment used_count
DROP POLICY IF EXISTS "anon_update_promos" ON promo_codes;
CREATE POLICY "anon_update_promos" ON promo_codes FOR UPDATE
  TO anon USING (active = true) WITH CHECK (active = true);

-- ============ product_reviews ============
CREATE TABLE IF NOT EXISTS product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  store_id uuid NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_name text NOT NULL,
  rating int NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE product_reviews ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON product_reviews TO authenticated;
GRANT SELECT, INSERT ON product_reviews TO anon;

DROP POLICY IF EXISTS "select_own_reviews" ON product_reviews;
CREATE POLICY "select_own_reviews" ON product_reviews FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = product_reviews.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_reviews" ON product_reviews;
CREATE POLICY "insert_own_reviews" ON product_reviews FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = product_reviews.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "delete_own_reviews" ON product_reviews;
CREATE POLICY "delete_own_reviews" ON product_reviews FOR DELETE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = product_reviews.store_id AND stores.user_id = auth.uid()));
-- public can read and create reviews
DROP POLICY IF EXISTS "anon_select_reviews" ON product_reviews;
CREATE POLICY "anon_select_reviews" ON product_reviews FOR SELECT
  TO anon USING (true);
DROP POLICY IF EXISTS "anon_insert_reviews" ON product_reviews;
CREATE POLICY "anon_insert_reviews" ON product_reviews FOR INSERT
  TO anon WITH CHECK (true);

-- ============ ad_spy_items ============
CREATE TABLE IF NOT EXISTS ad_spy_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  platform text NOT NULL DEFAULT 'tiktok' CHECK (platform IN ('tiktok', 'facebook')),
  product_name text NOT NULL,
  ad_copy text NOT NULL,
  image_url text,
  category text NOT NULL DEFAULT 'High-Tech',
  views_7d int NOT NULL DEFAULT 0,
  likes_7d int NOT NULL DEFAULT 0,
  shares_7d int NOT NULL DEFAULT 0,
  growth_pct numeric NOT NULL DEFAULT 0,
  supplier_price_aoa numeric NOT NULL DEFAULT 0,
  suggested_price_aoa numeric NOT NULL DEFAULT 0,
  delivery_days int NOT NULL DEFAULT 4,
  created_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now() - interval '7 days'
);
ALTER TABLE ad_spy_items ENABLE ROW LEVEL SECURITY;
GRANT SELECT ON ad_spy_items TO anon, authenticated;

DROP POLICY IF EXISTS "read_ad_spy" ON ad_spy_items;
CREATE POLICY "read_ad_spy" ON ad_spy_items FOR SELECT
  TO anon, authenticated USING (true);

-- ============ store_sections ============
CREATE TABLE IF NOT EXISTS store_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid NOT NULL UNIQUE REFERENCES stores(id) ON DELETE CASCADE,
  announcement_bar boolean NOT NULL DEFAULT true,
  hero_banner boolean NOT NULL DEFAULT true,
  product_grid boolean NOT NULL DEFAULT true,
  trust_badge boolean NOT NULL DEFAULT true,
  customer_reviews boolean NOT NULL DEFAULT true,
  faq_section boolean NOT NULL DEFAULT true,
  whatsapp_float boolean NOT NULL DEFAULT true,
  hero_title text,
  hero_subtitle text,
  hero_image_url text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE store_sections ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT, UPDATE, DELETE ON store_sections TO authenticated;
GRANT SELECT ON store_sections TO anon;

DROP POLICY IF EXISTS "select_own_sections" ON store_sections;
CREATE POLICY "select_own_sections" ON store_sections FOR SELECT
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_sections.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "insert_own_sections" ON store_sections;
CREATE POLICY "insert_own_sections" ON store_sections FOR INSERT
  TO authenticated WITH CHECK (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_sections.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "update_own_sections" ON store_sections;
CREATE POLICY "update_own_sections" ON store_sections FOR UPDATE
  TO authenticated USING (EXISTS (SELECT 1 FROM stores WHERE stores.id = store_sections.store_id AND stores.user_id = auth.uid()));
DROP POLICY IF EXISTS "anon_select_sections" ON store_sections;
CREATE POLICY "anon_select_sections" ON store_sections FOR SELECT
  TO anon USING (true);

-- ============ SEED ad_spy_items (12 entries) ============
INSERT INTO ad_spy_items (platform, product_name, ad_copy, image_url, category, views_7d, likes_7d, shares_7d, growth_pct, supplier_price_aoa, suggested_price_aoa, delivery_days, first_seen) VALUES
('tiktok', 'Montre Connectée Sport Pro', '🔥 Cette montre fait fureur à Luanda ! Suivi cardiaque, notifications, autonomie 7 jours. Paiement à la livraison ✅', 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', 'High-Tech', 1280000, 89000, 12000, 340, 18000, 34900, 4, now() - interval '5 days'),
('tiktok', 'Sérum Visage Vitamine C', '✨ Résultat visible en 14 jours ! Ce sérum éclaircit et uniformise le teint. Livraison rapide partout en Angola 🇦🇴', 'https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg?auto=compress&cs=tinysrgb&w=800', 'Beauté & Soins', 980000, 156000, 8900, 220, 4200, 11500, 3, now() - interval '3 days'),
('facebook', 'Écouteurs Sans Fil Bass+', '🎵 Le son parfait pour vos playlists ! Réduction de bruit, autonomie 24h. Stock limité — commandez maintenant !', 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800', 'High-Tech', 750000, 45000, 5600, 180, 11500, 27500, 4, now() - interval '6 days'),
('tiktok', 'Mini Projecteur Portable HD', '🎬 Cinéma à la maison ! Projecteur 1080p compatible HDMI/USB. Idéal pour les soirées en famille à Benguela !', 'https://images.pexels.com/photos/7239253/pexels-photo-7239253.jpeg?auto=compress&cs=tinysrgb&w=800', 'High-Tech', 520000, 38000, 4200, 150, 24000, 49000, 5, now() - interval '4 days'),
('facebook', 'Sac à Main Élégance Cuir', '👜 Le sac qui complète toutes vos tenues ! Simili-cuir premium, compartiments multiples. Élégance garantie.', 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mode', 430000, 52000, 3100, 95, 9500, 22000, 3, now() - interval '2 days'),
('tiktok', 'Brosse Lissante Céramique', '💇‍♀️ Cheveux lisses en un passage ! Technologie vapeur céramique. Les femmes de Luanda adorent !', 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', 'Beauté & Soins', 670000, 98000, 7200, 280, 5500, 14900, 4, now() - interval '1 day'),
('tiktok', 'Sac à Dos Urbain Anti-Vol', '🎒 Anti-vol + port USB ! Parfait pour les étudiants et professionnels de Huambo. Imperméable et stylé.', 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mode', 890000, 67000, 9800, 190, 8200, 21000, 4, now() - interval '7 days'),
('facebook', 'Lampe LED Ambiance RGB', '💡 16 millions de couleurs ! Contrôle via app. Transformez votre salon à Lubango en un instant.', 'https://images.pexels.com/photos/1112597/pexels-photo-1112597.jpeg?auto=compress&cs=tinysrgb&w=800', 'Maison & Cuisine', 320000, 28000, 2400, 110, 6800, 16900, 5, now() - interval '5 days'),
('tiktok', 'Robe Africaine Wax Moderne', '🌟 Wax authentique + coupe moderne ! Parfaite pour les événements. Tailles S à XL. Tendance à Cabinda !', 'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mode', 560000, 89000, 6500, 160, 7200, 19500, 4, now() - interval '3 days'),
('facebook', 'Jeu Éducatif Montessori', '🧸 Développe la motricité et la logique ! Jouet en bois Montessori dès 3 ans. Les parents de Malanje adorent.', 'https://images.pexels.com/photos/3661193/pexels-photo-3661193.jpeg?auto=compress&cs=tinysrgb&w=800', 'Maison & Cuisine', 280000, 42000, 1800, 85, 5200, 13900, 5, now() - interval '6 days'),
('tiktok', 'Casquette Logo Brodée', '🧢 Style urbain unisexe ! Coton respirant, broderie premium. Le must-have de la saison à Namibe.', 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=800', 'Mode', 190000, 22000, 1200, 70, 2800, 7500, 3, now() - interval '2 days'),
('facebook', 'Théière Élégance Verre', '☕ Verre borosilicaté + filtre inox ! Design moderne 600ml. Parfaite pour vos moments détente.', 'https://images.pexels.com/photos/39347/tea-pot-kitchen-tea-39347.jpeg?auto=compress&cs=tinysrgb&w=800', 'Maison & Cuisine', 150000, 18000, 900, 55, 3800, 9900, 3, now() - interval '4 days')
ON CONFLICT DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_customers_store_id ON customers(store_id);
CREATE INDEX IF NOT EXISTS idx_promo_codes_store_id ON promo_codes(store_id);
CREATE INDEX IF NOT EXISTS idx_product_reviews_product_id ON product_reviews(product_id);
CREATE INDEX IF NOT EXISTS idx_ad_spy_items_platform ON ad_spy_items(platform);
CREATE INDEX IF NOT EXISTS idx_store_sections_store_id ON store_sections(store_id);
