import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ============ TYPES V2 ============

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  city: string | null;
  province: string | null;
  currency: string;
  created_at: string;
}

export interface Store {
  id: string;
  user_id: string;
  name: string;
  slug: string;
  tagline: string | null;
  description: string | null;
  logo_url: string | null;
  banner_url: string | null;
  accent_color: string;
  announcement_text: string | null;
  whatsapp_number: string | null;
  default_shipping_fee: number;
  created_at: string;
}

export interface AiLandingBlocks {
  hero_subtitle?: string;
  benefits?: { icon: string; title: string; text: string }[];
  specs?: { key: string; value: string }[];
  packs?: { qty: number; label: string; price: number; discount: number; badge?: string }[];
  reviews?: { name: string; city: string; rating: number; text: string }[];
  guarantee?: string;
}

export interface DigitalDeliveryConfig {
  file_name?: string;
  access_url?: string;
  post_purchase_instructions?: string;
  watermark?: boolean;
  hide_sales_count?: boolean;
}

export interface ProductRow {
  id: string;
  user_id: string;
  store_id: string | null;
  type: 'physical' | 'digital';
  // Common
  name: string;
  slug: string | null;
  subtitle: string | null;
  category: string | null;
  description: string | null;
  active: boolean;
  is_published: boolean;
  sales_count: number;
  created_at: string;
  // Pricing
  sale_price: number | null;
  compare_at_price_aoa: number | null;
  cost_price_aoa: number | null;
  supplier_price: number | null;
  suggested_price: number | null;
  original_price: number | null;
  promo_price: number | null;
  // Visuals
  image_url: string | null;
  square_image_url: string | null;
  banner_url: string | null;
  banner_image_url: string | null;
  gallery_urls: string[];
  // AI landing page blocks (physical)
  ai_landing_blocks: AiLandingBlocks;
  // Variants & FAQ & custom fields
  variants: { label: string; price_modifier: number }[];
  faq: { q: string; a: string }[];
  custom_checkout_fields: { label: string; required: boolean }[];
  // Digital-specific
  digital_type: 'file' | 'course' | 'coaching' | 'license' | 'bundle' | null;
  pricing_model: 'one_time' | 'promo' | 'free';
  file_url: string | null;
  file_protected: boolean;
  digital_delivery_config: DigitalDeliveryConfig;
  cta_text: string | null;
  // Physical-specific
  delivery_days: number | null;
  stock: number | null;
  source_url: string | null;
  trend: 'hot' | 'new' | 'standard';
}

export interface OrderRow {
  id: string;
  store_id: string | null;
  product_id: string | null;
  product_name: string;
  product_title: string | null;
  product_type: 'physical' | 'digital';
  quantity: number;
  variant_label: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  city: string | null;
  delivery_city: string | null;
  delivery_province: string | null;
  address: string | null;
  amount: number;
  subtotal_aoa: number;
  shipping_fee_aoa: number;
  total_aoa: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  payment_method: 'cod' | 'transfer' | 'multicaixa_sim' | 'card_sim';
  payment_status_simulated: string | null;
  created_at: string;
}

export interface MarketingCampaignRow {
  id: string;
  user_id: string;
  store_id: string | null;
  product_id: string | null;
  platform: 'whatsapp' | 'facebook' | 'instagram' | 'tiktok' | 'google';
  generated_copy: string | null;
  tracking_link: string | null;
  created_at: string;
}

export interface CustomerRow {
  id: string;
  store_id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  province: string | null;
  total_orders: number;
  total_spent_aoa: number;
  last_order_at: string | null;
  created_at: string;
}

export interface PromoCodeRow {
  id: string;
  store_id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  expires_at: string | null;
  active: boolean;
  created_at: string;
}

export interface ProductReviewRow {
  id: string;
  product_id: string;
  store_id: string;
  customer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface AdSpyItemRow {
  id: string;
  platform: 'tiktok' | 'facebook';
  product_name: string;
  ad_copy: string;
  image_url: string;
  category: string;
  views_7d: number;
  likes_7d: number;
  shares_7d: number;
  growth_pct: number;
  supplier_price_aoa: number;
  suggested_price_aoa: number;
  delivery_days: number;
  created_at: string;
  first_seen: string;
}

export interface StoreSectionsRow {
  id: string;
  store_id: string;
  announcement_bar: boolean;
  hero_banner: boolean;
  product_grid: boolean;
  trust_badge: boolean;
  customer_reviews: boolean;
  faq_section: boolean;
  whatsapp_float: boolean;
  hero_title: string | null;
  hero_subtitle: string | null;
  hero_image_url: string | null;
  updated_at: string;
}

export interface AiGenerateResult {
  hero_subtitle?: string;
  description?: string;
  benefits?: { icon: string; title: string; text: string }[];
  specs?: { key: string; value: string }[];
  packs?: { qty: number; label: string; price: number; discount: number; badge?: string }[];
  reviews?: { name: string; city: string; rating: number; text: string }[];
  guarantee?: string;
  faq?: { q: string; a: string }[];
  variants?: string[];
  store_name?: string;
  tagline?: string;
  hero_title?: string;
  hero_subtitle?: string;
  script?: string;
  caption?: string;
  hashtags?: string;
  _source?: string;
}

export async function callAiGenerate(body: {
  type: 'product_landing' | 'marketing_copy' | 'store_builder' | 'ad_script';
  productName?: string;
  productType?: 'physical' | 'digital';
  digitalType?: string;
  price?: number;
  category?: string;
  niche?: string;
  platform?: 'whatsapp' | 'facebook' | 'tiktok';
}): Promise<AiGenerateResult> {
  const apiUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-generate`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (anonKey) {
    headers['Authorization'] = `Bearer ${anonKey}`;
  }
  const res = await fetch(apiUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => 'Erreur inconnue');
    throw new Error(`IA: ${errText}`);
  }
  const data = await res.json();
  if (data.error) throw new Error(data.error);
  return data as AiGenerateResult;
}
