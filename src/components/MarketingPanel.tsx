import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone, MessageCircle, Share2, Copy, Check, Plus, Tag, Trash2, Wallet, Link as LinkIcon,
} from 'lucide-react';
import { formatKz, marketingTemplates } from '@/lib/data';
import { useToast, Spinner } from '@/lib/ui';
import { supabase, type ProductRow, type AdCampaignRow, type PromoCodeRow } from '@/lib/supabase';

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle, tint: 'bg-green-50 text-green-600' },
  { id: 'facebook', label: 'Facebook', icon: Share2, tint: 'bg-blue-50 text-blue-600' },
  { id: 'instagram', label: 'Instagram', icon: Megaphone, tint: 'bg-pink-50 text-pink-600' },
  { id: 'google', label: 'Google', icon: LinkIcon, tint: 'bg-amber-50 text-amber-600' },
] as const;

export function MarketingPanel({ storeId, storeLink }: { storeId: string | null; storeLink: string }) {
  const { toast, Toaster } = useToast();
  const [tab, setTab] = useState<'ads' | 'campaigns' | 'promos'>('ads');
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ProductRow | null>(null);
  const [platform, setPlatform] = useState<string>('whatsapp');
  const [generated, setGenerated] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);

  // Campagnes
  const [campaigns, setCampaigns] = useState<AdCampaignRow[]>([]);
  const [budget, setBudget] = useState<number>(5000);

  // Promos
  const [promos, setPromos] = useState<PromoCodeRow[]>([]);
  const [promoCode, setPromoCode] = useState('');
  const [promoDiscount, setPromoDiscount] = useState(10);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).eq('active', true);
    setProducts((data as ProductRow[]) ?? []);
    if (data && data.length > 0 && !selectedProduct) setSelectedProduct(data[0] as ProductRow);
  }, [storeId, selectedProduct]);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase.from('ad_campaigns').select('*').order('created_at', { ascending: false });
    setCampaigns((data as AdCampaignRow[]) ?? []);
  }, []);

  const loadPromos = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase.from('promo_codes').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    setPromos((data as PromoCodeRow[]) ?? []);
  }, [storeId]);

  useEffect(() => { loadProducts(); loadCampaigns(); loadPromos(); }, [loadProducts, loadCampaigns, loadPromos]);

  const generate = () => {
    if (!selectedProduct) { toast('Sélectionnez un produit', 'error'); return; }
    setGenLoading(true);
    setGenerated([]);
    setTimeout(() => {
      const price = selectedProduct.type === 'digital'
        ? (selectedProduct.pricing_model === 'free' ? 'Gratuit' : formatKz(selectedProduct.original_price ?? selectedProduct.promo_price ?? 0))
        : formatKz(selectedProduct.sale_price ?? 0);
      const filled = marketingTemplates.map((t) => t.replace('{product}', selectedProduct.name).replace('{price}', price).replace('{link}', storeLink));
      setGenerated(filled);
      setGenLoading(false);
      toast('3 accroches générées');
    }, 1100);
  };

  const copyText = (text: string, i: number) => {
    navigator.clipboard?.writeText(text);
    toast(`Accroche ${i + 1} copiée`);
  };

  const shareWhatsApp = (text: string) => {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const createCampaign = async () => {
    if (!selectedProduct) { toast('Sélectionnez un produit', 'error'); return; }
    const tracking = `${storeLink}?utm_source=${platform}&utm_campaign=${Date.now().toString(36)}`;
    const adText = generated[0] ?? `${selectedProduct.name} — disponible maintenant ! ${storeLink}`;
    const { error } = await supabase.from('ad_campaigns').insert({
      product_id: selectedProduct.id,
      product_name: selectedProduct.name,
      platform: platform as AdCampaignRow['platform'],
      budget,
      ad_text: adText,
      tracking_link: tracking,
      status: 'active',
    });
    if (error) { toast('Erreur', 'error'); return; }
    toast('Campagne créée avec succès');
    loadCampaigns();
  };

  const deleteCampaign = async (c: AdCampaignRow) => {
    await supabase.from('ad_campaigns').delete().eq('id', c.id);
    loadCampaigns();
    toast('Campagne supprimée');
  };

  const createPromo = async () => {
    if (!storeId || !promoCode.trim()) { toast('Saisissez un code promo', 'error'); return; }
    const { error } = await supabase.from('promo_codes').insert({
      store_id: storeId,
      code: promoCode.toUpperCase(),
      discount_percent: promoDiscount,
      active: true,
    });
    if (error) { toast('Erreur', 'error'); return; }
    toast('Code promo créé');
    setPromoCode('');
    loadPromos();
  };

  const togglePromo = async (p: PromoCodeRow) => {
    await supabase.from('promo_codes').update({ active: !p.active }).eq('id', p.id);
    loadPromos();
  };

  const deletePromo = async (p: PromoCodeRow) => {
    await supabase.from('promo_codes').delete().eq('id', p.id);
    loadPromos();
    toast('Code supprimé');
  };

  return (
    <div>
      <div className="flex p-1 bg-ink-100 rounded-xl mb-5 max-w-lg">
        {([['ads', 'Générateur'], ['campaigns', `Campagnes (${campaigns.length})`], ['promos', `Codes promo (${promos.length})`]] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`flex-1 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${tab === v ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'}`}>{l}</button>
        ))}
      </div>

      {tab === 'ads' && (
        <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
            <h2 className="font-display font-bold text-base text-ink-900 mb-1">Générateur de publicités</h2>
            <p className="text-xs text-ink-500 mb-4">Créez des accroches marketing prêtes à coller.</p>

            <label className="block mb-4">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Produit à promouvoir</span>
              <select value={selectedProduct?.id ?? ''} onChange={(e) => setSelectedProduct(products.find((p) => p.id === e.target.value) ?? null)} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm bg-white">
                {products.length === 0 && <option value="">Aucun produit — ajoutez-en d’abord</option>}
                {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.type === 'digital' ? 'Digital' : 'Physique'}</option>)}
              </select>
            </label>

            <span className="block text-xs font-semibold text-ink-600 mb-2">Canal de diffusion</span>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {PLATFORMS.map((pf) => {
                const Icon = pf.icon;
                return (
                  <button key={pf.id} onClick={() => setPlatform(pf.id)} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${platform === pf.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-300'}`}>
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${pf.tint}`}><Icon className="w-4 h-4" /></span>
                    <span className="text-[10px] font-semibold text-ink-600">{pf.label}</span>
                  </button>
                );
              })}
            </div>

            <label className="block mb-5">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Budget publicitaire (Kz)</span>
              <input type="number" value={budget} onChange={(e) => setBudget(Number(e.target.value))} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
            </label>

            <button onClick={generate} disabled={genLoading || !selectedProduct} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-card">
              <Megaphone className="w-4 h-4" /> {genLoading ? 'Génération…' : 'Générer le texte publicitaire'}
            </button>

            {generated.length > 0 && (
              <button onClick={createCampaign} className="mt-3 w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
                <Plus className="w-4 h-4" /> Créer une campagne suivie
              </button>
            )}
          </div>

          <div className="space-y-3">
            <h3 className="font-display font-bold text-base text-ink-900">Accroches générées</h3>
            {genLoading && [0,1,2].map((i) => <div key={i} className="skeleton rounded-2xl h-28" />)}
            {!genLoading && generated.length === 0 && (
              <div className="bg-white rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
                <Megaphone className="w-8 h-8 text-ink-300 mx-auto mb-2" />
                <p className="text-sm text-ink-400">Vos publicités apparaîtront ici.</p>
              </div>
            )}
            {!genLoading && generated.map((text, i) => (
              <div key={i} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 animate-fade-in">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-ink-400">Variante {i + 1}</span>
                  <button onClick={() => shareWhatsApp(text)} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                    <MessageCircle className="w-3.5 h-3.5" /> Partager
                  </button>
                </div>
                <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{text}</p>
                <button onClick={() => copyText(text, i)} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-600 bg-ink-50 hover:bg-ink-100 py-2 rounded-lg transition">
                  <Copy className="w-3.5 h-3.5" /> Copier le texte
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'campaigns' && (
        <div>
          {campaigns.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-ink-200">
              <Megaphone className="w-10 h-10 text-ink-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-600">Aucune campagne pour le moment.</p>
              <p className="text-xs text-ink-400 mt-1">Générez une publicité et créez une campagne suivie.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map((c) => {
                const pf = PLATFORMS.find((p) => p.id === c.platform);
                const Icon = pf?.icon ?? Megaphone;
                return (
                  <div key={c.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${pf?.tint ?? 'bg-ink-100 text-ink-600'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-sm text-ink-900 truncate">{c.product_name ?? 'Campagne'}</p>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-ink-100 text-ink-600 font-semibold">{pf?.label}</span>
                      </div>
                      {c.ad_text && <p className="text-xs text-ink-500 line-clamp-2">{c.ad_text}</p>}
                      <div className="flex items-center gap-4 mt-2 text-xs text-ink-500">
                        <span className="flex items-center gap-1"><Wallet className="w-3.5 h-3.5" /> {formatKz(c.budget)}</span>
                        <span className="flex items-center gap-1"><LinkIcon className="w-3.5 h-3.5" /> Lien tracké</span>
                      </div>
                    </div>
                    <button onClick={() => deleteCampaign(c)} className="p-2 text-ink-400 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === 'promos' && (
        <div>
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 mb-5">
            <h2 className="font-display font-bold text-base text-ink-900 mb-1">Créer un code promo</h2>
            <p className="text-xs text-ink-500 mb-4">Offrez une réduction temporaire applicable sur votre boutique.</p>
            <div className="grid sm:grid-cols-3 gap-3 items-end">
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Code</span>
                <input value={promoCode} onChange={(e) => setPromoCode(e.target.value.toUpperCase())} placeholder="PROMO20" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm font-bold uppercase" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Réduction (%)</span>
                <input type="number" value={promoDiscount} onChange={(e) => setPromoDiscount(Number(e.target.value))} min={1} max={90} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
              </label>
              <button onClick={createPromo} className="bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2">
                <Plus className="w-4 h-4" /> Créer
              </button>
            </div>
          </div>

          {promos.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-ink-200">
              <Tag className="w-10 h-10 text-ink-300 mx-auto mb-2" />
              <p className="text-sm font-medium text-ink-600">Aucun code promo actif.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {promos.map((p) => (
                <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center"><Tag className="w-5 h-5" /></div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-ink-900">{p.code}</p>
                    <p className="text-xs text-ink-500">-{p.discount_percent}% · {p.active ? 'Actif' : 'Inactif'}</p>
                  </div>
                  <button onClick={() => togglePromo(p)} className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${p.active ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>{p.active ? 'Désactiver' : 'Activer'}</button>
                  <button onClick={() => deletePromo(p)} className="p-2 text-ink-400 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {Toaster}
    </div>
  );
}
