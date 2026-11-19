import { useState, useEffect, useCallback } from 'react';
import { Megaphone, MessageCircle, Share2, Copy, Plus, Trash2, Link as LinkIcon } from 'lucide-react';
import { formatKz, marketingTemplates } from '@/lib/data';
import { useToast, Spinner } from '@/lib/ui';
import { supabase, type ProductRow, type MarketingCampaignRow } from '@/lib/supabase';

const PLATFORMS = [
  { id: 'whatsapp', label: 'WhatsApp Business', icon: MessageCircle, tint: 'bg-green-50 text-green-600' },
  { id: 'facebook', label: 'Facebook / Instagram', icon: Share2, tint: 'bg-blue-50 text-blue-600' },
  { id: 'tiktok', label: 'Script Vidéo TikTok', icon: Megaphone, tint: 'bg-pink-50 text-pink-600' },
] as const;

export function MarketingPage({ storeId, storeSlug }: { storeId: string | null; storeSlug: string | null }) {
  const { toast, Toaster } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [selected, setSelected] = useState<ProductRow | null>(null);
  const [platform, setPlatform] = useState<string>('whatsapp');
  const [generated, setGenerated] = useState<string[]>([]);
  const [genLoading, setGenLoading] = useState(false);
  const [campaigns, setCampaigns] = useState<MarketingCampaignRow[]>([]);

  const loadProducts = useCallback(async () => {
    if (!storeId) return;
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId);
    setProducts((data as ProductRow[]) ?? []);
    if (data && data.length > 0 && !selected) setSelected(data[0] as ProductRow);
  }, [storeId, selected]);

  const loadCampaigns = useCallback(async () => {
    const { data } = await supabase.from('marketing_campaigns').select('*').order('created_at', { ascending: false });
    setCampaigns((data as MarketingCampaignRow[]) ?? []);
  }, []);

  useEffect(() => { loadProducts(); loadCampaigns(); }, [loadProducts, loadCampaigns]);

  const generate = () => {
    if (!selected) { toast('Sélectionnez un produit', 'error'); return; }
    setGenLoading(true);
    setGenerated([]);
    setTimeout(() => {
      const price = selected.type === 'digital'
        ? (selected.pricing_model === 'free' ? 'Gratuit' : formatKz(selected.original_price ?? selected.promo_price ?? 0))
        : formatKz(selected.sale_price ?? 0);
      const link = `${window.location.origin}/#/p/${selected.slug ?? ''}`;
      const filled = marketingTemplates.map((t) => t.replace('{product}', selected.name).replace('{price}', price).replace('{link}', link));
      setGenerated(filled);
      setGenLoading(false);
      toast('3 accroches générées');
    }, 1100);
  };

  const copyText = (text: string, i: number) => { navigator.clipboard?.writeText(text); toast(`Accroche ${i + 1} copiée`); };
  const shareWhatsApp = (text: string) => { window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank'); };

  const saveCampaign = async () => {
    if (!selected || !storeId) { toast('Sélectionnez un produit', 'error'); return; }
    const link = `${window.location.origin}/#/p/${selected.slug ?? ''}`;
    const { error } = await supabase.from('marketing_campaigns').insert({
      store_id: storeId, product_id: selected.id, platform: platform as MarketingCampaignRow['platform'],
      generated_copy: generated[0] ?? '', tracking_link: link,
    });
    if (error) { toast('Erreur', 'error'); return; }
    toast('Campagne sauvegardée');
    loadCampaigns();
  };

  const deleteCampaign = async (c: MarketingCampaignRow) => {
    await supabase.from('marketing_campaigns').delete().eq('id', c.id);
    loadCampaigns();
    toast('Campagne supprimée');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Marketing & Pubs IA</h1>
        <p className="text-sm text-ink-500 mt-0.5">Générez des publicités prêtes à l'emploi pour vos produits.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
          <h2 className="font-display font-bold text-base text-ink-900 mb-1">Générateur de publicités</h2>
          <p className="text-xs text-ink-500 mb-4">Sélectionnez un produit et un canal, puis générez.</p>

          <label className="block mb-4">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Produit à promouvoir</span>
            <select value={selected?.id ?? ''} onChange={(e) => setSelected(products.find((p) => p.id === e.target.value) ?? null)} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm bg-white">
              {products.length === 0 && <option value="">Aucun produit — créez-en d'abord</option>}
              {products.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.type === 'digital' ? 'Digital' : 'Physique'}</option>)}
            </select>
          </label>

          <span className="block text-xs font-semibold text-ink-600 mb-2">Canal de diffusion</span>
          <div className="grid grid-cols-3 gap-2 mb-5">
            {PLATFORMS.map((pf) => {
              const Icon = pf.icon;
              return (
                <button key={pf.id} onClick={() => setPlatform(pf.id)} className={`flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 transition ${platform === pf.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200 hover:border-ink-300'}`}>
                  <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${pf.tint}`}><Icon className="w-4 h-4" /></span>
                  <span className="text-[10px] font-semibold text-ink-600 text-center leading-tight">{pf.label.split(' ')[0]}</span>
                </button>
              );
            })}
          </div>

          <button onClick={generate} disabled={genLoading || !selected} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-card">
            <Megaphone className="w-4 h-4" /> {genLoading ? 'Génération…' : 'Générer le texte publicitaire'}
          </button>
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
                <button onClick={() => shareWhatsApp(text)} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" /> Partager</button>
              </div>
              <p className="text-sm text-ink-700 leading-relaxed whitespace-pre-wrap">{text}</p>
              <button onClick={() => copyText(text, i)} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-ink-600 bg-ink-50 hover:bg-ink-100 py-2 rounded-lg transition"><Copy className="w-3.5 h-3.5" /> Copier</button>
            </div>
          ))}
          {generated.length > 0 && (
            <button onClick={saveCampaign} className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
              <Plus className="w-4 h-4" /> Sauvegarder la campagne
            </button>
          )}
        </div>
      </div>

      {campaigns.length > 0 && (
        <div>
          <h2 className="font-display font-bold text-base text-ink-900 mb-3">Campagnes sauvegardées ({campaigns.length})</h2>
          <div className="space-y-2">
            {campaigns.map((c) => {
              const pf = PLATFORMS.find((p) => p.id === c.platform);
              const Icon = pf?.icon ?? Megaphone;
              return (
                <div key={c.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${pf?.tint ?? 'bg-ink-100 text-ink-600'}`}><Icon className="w-4 h-4" /></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-ink-900">{c.generated_copy?.slice(0, 80)}…</p>
                    <p className="text-xs text-ink-400 mt-0.5 flex items-center gap-1"><LinkIcon className="w-3 h-3" /> {c.tracking_link}</p>
                  </div>
                  <button onClick={() => deleteCampaign(c)} className="p-2 text-ink-400 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {Toaster}
    </div>
  );
}
