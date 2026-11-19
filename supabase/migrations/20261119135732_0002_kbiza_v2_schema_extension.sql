/*
# Kbizá V2 — Extension complète du schéma

## Description
Étend le schéma existant pour supporter les tunnels Chariow (digital) et Adafrik (physique),
les pages publiques produit/boutique, le simulateur de paiement, et les paramètres avancés.
Aucune donnée existante n'est perdue — uniquement ajout de colonnes et d'une nouvelle table.

## Changements
1. `profiles` : ajout de city, province
2. `stores` : ajout de tagline, description, announcement_text, whatsapp_number, default_shipping_fee
3. `products` : ajout de slug, subtitle, compare_at_price_aoa, cost_price_aoa, square_image_url,
   banner_image_url, gallery_urls, ai_landing_blocks, variants, custom_checkout_fields,
   digital_delivery_config, cta_text, is_published, sales_count
   + colonne `slug` unique
4. `orders` : ajout de quantity, variant_label, delivery_province, subtotal_aoa, shipping_fee_aoa,
   total_aoa, payment_status_simulated, et élargissement de order_status / payment_method
5. `marketing_campaigns` : nouvelle table (remplace ad_campaigns pour le V2)
6. Index sur products.slug et orders pour recherche

## Sécurité
- RLS déjà activée — nouvelles colonnes héritent des policies existantes
- marketing_campaigns : même pattern que ad_campaigns (CRUD propriétaire + auth.uid())
- Aucune policy destructrice
*/

-- =====================
-- 1. PROFILES — ajout city, province
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'city') THEN
    ALTER TABLE public.profiles ADD COLUMN city text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'province') THEN
    ALTER TABLE public.profiles ADD COLUMN province text;
  END IF;
END $$;

-- =====================
-- 2. STORES — ajout champs vitrine avancée
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'tagline') THEN
    ALTER TABLE public.stores ADD COLUMN tagline text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'description') THEN
    ALTER TABLE public.stores ADD COLUMN description text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'announcement_text') THEN
    ALTER TABLE public.stores ADD COLUMN announcement_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'whatsapp_number') THEN
    ALTER TABLE public.stores ADD COLUMN whatsapp_number text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stores' AND column_name = 'default_shipping_fee') THEN
    ALTER TABLE public.stores ADD COLUMN default_shipping_fee integer DEFAULT 2500;
  END IF;
END $$;

-- =====================
-- 3. PRODUCTS — ajout champs complets V2
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'slug') THEN
    ALTER TABLE public.products ADD COLUMN slug text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'subtitle') THEN
    ALTER TABLE public.products ADD COLUMN subtitle text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'compare_at_price_aoa') THEN
    ALTER TABLE public.products ADD COLUMN compare_at_price_aoa integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cost_price_aoa') THEN
    ALTER TABLE public.products ADD COLUMN cost_price_aoa integer;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'square_image_url') THEN
    ALTER TABLE public.products ADD COLUMN square_image_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'banner_image_url') THEN
    ALTER TABLE public.products ADD COLUMN banner_image_url text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'gallery_urls') THEN
    ALTER TABLE public.products ADD COLUMN gallery_urls jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'ai_landing_blocks') THEN
    ALTER TABLE public.products ADD COLUMN ai_landing_blocks jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'variants') THEN
    ALTER TABLE public.products ADD COLUMN variants jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'custom_checkout_fields') THEN
    ALTER TABLE public.products ADD COLUMN custom_checkout_fields jsonb DEFAULT '[]'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'digital_delivery_config') THEN
    ALTER TABLE public.products ADD COLUMN digital_delivery_config jsonb DEFAULT '{}'::jsonb;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'cta_text') THEN
    ALTER TABLE public.products ADD COLUMN cta_text text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'is_published') THEN
    ALTER TABLE public.products ADD COLUMN is_published boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'sales_count') THEN
    ALTER TABLE public.products ADD COLUMN sales_count integer DEFAULT 0;
  END IF;
END $$;

-- Index unique sur slug (mais autorise NULL pour backward compat)
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_slug_unique ON public.products(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_products_slug ON public.products(slug);

-- =====================
-- 4. ORDERS — ajout champs complets V2
-- =====================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'quantity') THEN
    ALTER TABLE public.orders ADD COLUMN quantity integer DEFAULT 1;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'variant_label') THEN
    ALTER TABLE public.orders ADD COLUMN variant_label text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'delivery_province') THEN
    ALTER TABLE public.orders ADD COLUMN delivery_province text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal_aoa') THEN
    ALTER TABLE public.orders ADD COLUMN subtotal_aoa integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_fee_aoa') THEN
    ALTER TABLE public.orders ADD COLUMN shipping_fee_aoa integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'total_aoa') THEN
    ALTER TABLE public.orders ADD COLUMN total_aoa integer DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'payment_status_simulated') THEN
    ALTER TABLE public.orders ADD COLUMN payment_status_simulated text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'product_title') THEN
    ALTER TABLE public.orders ADD COLUMN product_title text;
  END IF;
END $$;

-- Élargir les contraintes order_status et payment_method avec DROP + recréer le CHECK
-- On utilise une approche sécurisée: on ne modifie la contrainte que si elle existe
DO $$
BEGIN
  -- Supprimer l'ancienne contrainte CHECK sur status si elle existe
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_status_check' AND conrelid = 'orders'::regclass) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_status_check;
  END IF;
END $$;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending','shipped','delivered','cancelled','confirmed'));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check' AND conrelid = 'orders'::regclass) THEN
    ALTER TABLE public.orders DROP CONSTRAINT orders_payment_method_check;
  END IF;
END $$;
ALTER TABLE public.orders ADD CONSTRAINT orders_payment_method_check
  CHECK (payment_method IN ('cod','transfer','multicaixa_sim','card_sim'));

-- Rendre product_title non-null par défaut (utiliser COALESCE via application)
-- On ne change pas la contrainte NOT NULL existante sur product_name

-- =====================
-- 5. MARKETING_CAMPAIGNS — nouvelle table V2
-- =====================
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  store_id uuid REFERENCES public.stores(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
  platform text NOT NULL DEFAULT 'whatsapp' CHECK (platform IN ('whatsapp','facebook','instagram','tiktok','google')),
  generated_copy text,
  tracking_link text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_campaigns TO authenticated;

CREATE INDEX IF NOT EXISTS idx_mc_user_id ON public.marketing_campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_mc_store_id ON public.marketing_campaigns(store_id);

DROP POLICY IF EXISTS "select_own_mc" ON public.marketing_campaigns;
CREATE POLICY "select_own_mc" ON public.marketing_campaigns
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_mc" ON public.marketing_campaigns;
CREATE POLICY "insert_own_mc" ON public.marketing_campaigns
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "update_own_mc" ON public.marketing_campaigns;
CREATE POLICY "update_own_mc" ON public.marketing_campaigns
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_mc" ON public.marketing_campaigns;
CREATE POLICY "delete_own_mc" ON public.marketing_campaigns
  FOR DELETE TO authenticated USING (auth.uid() = user_id);
