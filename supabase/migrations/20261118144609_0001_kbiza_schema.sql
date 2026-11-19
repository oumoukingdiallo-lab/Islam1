/*
# Kbizá — Schéma complet de la base de données

## Description
Crée le schéma complet de l'application Kbizá : plateforme de dropshipping (produits physiques)
et de vente de produits digitaux pour les entrepreneurs en Angola. Devise : Kwanza (AOA).

## Tables créées
1. `profiles` — profils utilisateurs (nom, téléphone +244, email, devise)
2. `stores` — boutiques des utilisateurs (nom, slug unique, couleur, logo, bannière)
3. `products` — produits unifiés (physiques dropshipping ET digitaux Chariow)
4. `orders` — commandes clients (physiques et digitales)
5. `ad_campaigns` — campagnes publicitaires créées par l'utilisateur
6. `promo_codes` — codes de réduction applicables sur la boutique

## Storage
- Bucket `kbiza-assets` : logos de boutique, vignettes, bannières, fichiers digitaux

## Sécurité
- RLS activée sur toutes les tables
- profiles/stores/products/ad_campaigns/promo_codes : CRUD propriétaire (authenticated, auth.uid())
- stores + products actifs : lecture publique (anon) pour la vitrine publique
- orders : le vendeur voit ses commandes ; un visiteur (anon) peut créer une commande
- Grants explicites sur chaque table pour les rôles concernés

## Notes importantes
- user_id DEFAULT auth.uid() sur toutes les tables propriétaires
- Email confirmation OFF (Supabase default conservé)
- Les policies stores/products SELECT public permettent la vitrine /boutique/:slug
*/

-- =====================
-- 1. TABLE: profiles
-- =====================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  phone text,
  email text,
  currency text NOT NULL DEFAULT 'AOA',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

DROP POLICY IF EXISTS "select_own_profile" ON public.profiles;
CREATE POLICY "select_own_profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON public.profiles;
CREATE POLICY "insert_own_profile" ON public.profiles
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON public.profiles;
CREATE POLICY "update_own_profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- =====================
-- 2. TABLE: stores
-- =====================
CREATE TABLE IF NOT EXISTS public.stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  accent_color text NOT NULL DEFAULT '#059669',
  logo_url text,
  banner_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stores ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.stores TO authenticated;
GRANT SELECT ON public.stores TO anon;

DROP POLICY IF EXISTS "select_own_stores" ON public.stores;
CREATE POLICY "select_own_stores" ON public.stores
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_stores" ON public.stores;
CREATE POLICY "insert_own_stores" ON public.stores
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_stores" ON public.stores;
CREATE POLICY "update_own_stores" ON public.stores
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_stores" ON public.stores;
CREATE POLICY "delete_own_stores" ON public.stores
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lecture publique de la vitrine (anon)
DROP POLICY IF EXISTS "anon_select_stores" ON public.stores;
CREATE POLICY "anon_select_stores" ON public.stores
  FOR SELECT TO anon USING (true);

-- =====================
-- 3. TABLE: products
-- =====================
CREATE TABLE IF NOT EXISTS public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'physical' CHECK (type IN ('physical','digital')),
  -- Champs communs
  name text NOT NULL,
  description text,
  category text,
  image_url text,
  banner_url text,
  active boolean NOT NULL DEFAULT true,
  trend text DEFAULT 'standard' CHECK (trend IN ('hot','new','standard')),
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Produits physiques (dropshipping)
  supplier_price integer,
  sale_price integer,
  suggested_price integer,
  delivery_days integer,
  stock integer,
  source_url text,
  -- Produits digitaux
  digital_type text CHECK (digital_type IN ('file','course','coaching','license','bundle')),
  pricing_model text DEFAULT 'one_time' CHECK (pricing_model IN ('one_time','promo','free')),
  original_price integer,
  promo_price integer,
  file_url text,
  file_protected boolean DEFAULT false,
  faq jsonb DEFAULT '[]'::jsonb
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;

CREATE INDEX IF NOT EXISTS idx_products_store_id ON public.products(store_id);
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(type);
CREATE INDEX IF NOT EXISTS idx_products_user_id ON public.products(user_id);

DROP POLICY IF EXISTS "select_own_products" ON public.products;
CREATE POLICY "select_own_products" ON public.products
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_products" ON public.products;
CREATE POLICY "insert_own_products" ON public.products
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_products" ON public.products;
CREATE POLICY "update_own_products" ON public.products
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_products" ON public.products;
CREATE POLICY "delete_own_products" ON public.products
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lecture publique des produits actifs (vitrine)
DROP POLICY IF EXISTS "anon_select_active_products" ON public.products;
CREATE POLICY "anon_select_active_products" ON public.products
  FOR SELECT TO anon USING (active = true);

-- =====================
-- 4. TABLE: orders
-- =====================
CREATE TABLE IF NOT EXISTS public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text NOT NULL,
  product_type text NOT NULL DEFAULT 'physical',
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  customer_email text,
  city text,
  address text,
  amount integer NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','shipped','delivered','cancelled')),
  payment_method text DEFAULT 'cod' CHECK (payment_method IN ('cod','transfer')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.orders TO authenticated;
GRANT INSERT ON public.orders TO anon;

CREATE INDEX IF NOT EXISTS idx_orders_store_id ON public.orders(store_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);

-- Le vendeur voit les commandes de sa boutique
DROP POLICY IF EXISTS "select_own_orders" ON public.orders;
CREATE POLICY "select_own_orders" ON public.orders
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid())
  );

-- Le vendeur peut mettre à jour le statut
DROP POLICY IF EXISTS "update_own_orders" ON public.orders;
CREATE POLICY "update_own_orders" ON public.orders
  FOR UPDATE TO authenticated USING (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid())
  ) WITH CHECK (
    EXISTS (SELECT 1 FROM public.stores s WHERE s.id = orders.store_id AND s.user_id = auth.uid())
  );

-- Un visiteur (anon) peut créer une commande (vitrine publique)
DROP POLICY IF EXISTS "anon_insert_orders" ON public.orders;
CREATE POLICY "anon_insert_orders" ON public.orders
  FOR INSERT TO anon WITH CHECK (true);

-- Un visiteur authentifié peut aussi commander
DROP POLICY IF EXISTS "auth_insert_orders" ON public.orders;
CREATE POLICY "auth_insert_orders" ON public.orders
  FOR INSERT TO authenticated WITH CHECK (true);

-- =====================
-- 5. TABLE: ad_campaigns
-- =====================
CREATE TABLE IF NOT EXISTS public.ad_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  product_name text,
  platform text NOT NULL DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp','facebook','instagram','google')),
  budget integer DEFAULT 0,
  ad_text text,
  tracking_link text,
  status text DEFAULT 'active' CHECK (status IN ('active','paused','ended')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ad_campaigns ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ad_campaigns TO authenticated;

DROP POLICY IF EXISTS "select_own_campaigns" ON public.ad_campaigns;
CREATE POLICY "select_own_campaigns" ON public.ad_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_campaigns" ON public.ad_campaigns;
CREATE POLICY "insert_own_campaigns" ON public.ad_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_campaigns" ON public.ad_campaigns;
CREATE POLICY "update_own_campaigns" ON public.ad_campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_campaigns" ON public.ad_campaigns;
CREATE POLICY "delete_own_campaigns" ON public.ad_campaigns
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =====================
-- 6. TABLE: promo_codes
-- =====================
CREATE TABLE IF NOT EXISTS public.promo_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  code text NOT NULL,
  discount_percent integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promo_codes ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.promo_codes TO authenticated;
GRANT SELECT ON public.promo_codes TO anon;

DROP POLICY IF EXISTS "select_own_promos" ON public.promo_codes;
CREATE POLICY "select_own_promos" ON public.promo_codes
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_promos" ON public.promo_codes;
CREATE POLICY "insert_own_promos" ON public.promo_codes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_promos" ON public.promo_codes;
CREATE POLICY "update_own_promos" ON public.promo_codes
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_promos" ON public.promo_codes;
CREATE POLICY "delete_own_promos" ON public.promo_codes
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Lecture publique (vitrine : vérifier un code promo)
DROP POLICY IF EXISTS "anon_select_promos" ON public.promo_codes;
CREATE POLICY "anon_select_promos" ON public.promo_codes
  FOR SELECT TO anon USING (active = true);

-- =====================
-- 7. STORAGE BUCKET
-- =====================
INSERT INTO storage.buckets (id, name, public)
VALUES ('kbiza-assets', 'kbiza-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Politiques storage : un utilisateur authentifié gère ses fichiers
DROP POLICY IF EXISTS "auth_upload_assets" ON storage.objects;
CREATE POLICY "auth_upload_assets" ON storage.objects
  FOR INSERT TO authenticated WITH CHECK (bucket_id = 'kbiza-assets');

DROP POLICY IF EXISTS "auth_update_assets" ON storage.objects;
CREATE POLICY "auth_update_assets" ON storage.objects
  FOR UPDATE TO authenticated USING (bucket_id = 'kbiza-assets');

DROP POLICY IF EXISTS "auth_delete_assets" ON storage.objects;
CREATE POLICY "auth_delete_assets" ON storage.objects
  FOR DELETE TO authenticated USING (bucket_id = 'kbiza-assets');

-- Lecture publique des fichiers (logos, vignettes, bannières publiques)
DROP POLICY IF EXISTS "anon_read_assets" ON storage.objects;
CREATE POLICY "anon_read_assets" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'kbiza-assets');
