import { useState, useMemo } from 'react';
import { Search, Flame, Sparkles, TrendingUp, Plus, Truck, Check } from 'lucide-react';
import { products as catalogProducts, CATEGORIES, formatKz } from '@/lib/data';
import { Modal } from '@/components/Modal';
import { Badge, useToast, Spinner } from '@/lib/ui';
import { supabase, type AiLandingBlocks } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import type { Product } from '@/lib/types';

const TREND_META = {
  hot: { label: 'Tendance', icon: Flame, cls: 'bg-rose-100 text-rose-600 ring-rose-200' },
  new: { label: 'Nouveau', icon: Sparkles, cls: 'bg-blue-100 text-blue-600 ring-blue-200' },
  standard: { label: 'Populaire', icon: TrendingUp, cls: 'bg-ink-100 text-ink-600 ring-ink-200' },
};

export function CatalogPage({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Tout');
  const [importing, setImporting] = useState<Product | null>(null);
  const [salePrice, setSalePrice] = useState(0);
  const [loading, setLoading] = useState(false);

  const filtered = useMemo(() => catalogProducts.filter((p) => {
    const matchCat = cat === 'Tout' || p.category === cat;
    return matchCat && p.name.toLowerCase().includes(query.toLowerCase());
  }), [query, cat]);

  const startImport = (p: Product) => { setImporting(p); setSalePrice(p.suggestedPrice); };

  const doImport = async () => {
    if (!importing || !storeId) return;
    setLoading(true);
    const slug = importing.name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5);
    const aiBlocks: AiLandingBlocks = {
      benefits: [
        { icon: 'check', title: 'Qualité supérieure', text: 'Matériaux premium garantis' },
        { icon: 'truck', title: 'Livraison rapide', text: `Livraison en ${importing.deliveryDays} jours` },
        { icon: 'shield', title: 'Garantie 30 jours', text: 'Satisfait ou remboursé' },
      ],
      packs: [
        { qty: 1, label: '1 Unité', price: salePrice, discount: 0 },
        { qty: 2, label: '2 Unités (-15%)', price: Math.round(salePrice * 2 * 0.85), discount: 15, badge: 'Populaire' },
        { qty: 3, label: '3 Unités (-25%)', price: Math.round(salePrice * 3 * 0.75), discount: 25, badge: 'Meilleure offre' },
      ],
      reviews: [
        { name: 'João Manuel', city: 'Luanda', rating: 5, text: 'Produit excellent, livraison rapide !' },
        { name: 'Helena da Silva', city: 'Benguela', rating: 5, text: 'Qualité au top, je recommande !' },
      ],
    };
    const { error } = await supabase.from('products').insert({
      store_id: storeId, type: 'physical', name: importing.name, slug,
      category: importing.category, description: importing.description,
      square_image_url: importing.image, image_url: importing.image,
      cost_price_aoa: importing.supplierPrice, supplier_price: importing.supplierPrice,
      sale_price: salePrice, suggested_price: importing.suggestedPrice,
      stock: importing.stock, delivery_days: importing.deliveryDays,
      trend: importing.trend, ai_landing_blocks: aiBlocks,
      is_published: true, active: true,
      faq: [
        { q: 'Délais de livraison ?', a: `Livraison en ${importing.deliveryDays} jours en Angola.` },
        { q: 'Paiement ?', a: 'Paiement à la livraison ou transfert local.' },
      ],
    });
    setLoading(false);
    if (error) { toast('Erreur lors de l\'importation', 'error'); return; }
    toast(`${importing.name} importé avec succès`);
    setImporting(null);
    navigate('/produits');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Catalogue Dropshipping</h1>
        <p className="text-sm text-ink-500 mt-0.5">{catalogProducts.length} produits gagnants adaptés au marché angolais — importez en 1 clic.</p>
      </div>

      <div className="flex flex-col gap-3 mb-5">
        <div className="flex items-center bg-white border border-ink-200 rounded-xl px-3 py-2.5 shadow-soft">
          <Search className="w-5 h-5 text-ink-400 mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit gagnant…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
          {CATEGORIES.map((c) => (
            <button key={c} onClick={() => setCat(c)} className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition ${cat === c ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}>{c}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {filtered.map((p) => {
          const Trend = TREND_META[p.trend].icon;
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden hover:shadow-card transition group">
              <div className="relative aspect-square overflow-hidden bg-ink-100">
                <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                <div className="absolute top-2 left-2"><Badge className={TREND_META[p.trend].cls}><Trend className="w-3 h-3" /> {TREND_META[p.trend].label}</Badge></div>
              </div>
              <div className="p-3 md:p-4">
                <p className="text-[10px] font-semibold text-ink-400 uppercase">{p.category}</p>
                <h3 className="font-semibold text-sm text-ink-900 mt-0.5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                <div className="mt-2 flex items-baseline gap-1.5">
                  <span className="font-display font-bold text-base text-ink-900">{formatKz(p.supplierPrice)}</span>
                  <span className="text-[11px] text-ink-400">fournisseur</span>
                </div>
                <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-600"><TrendingUp className="w-3.5 h-3.5" /> Marge : {Math.round(((p.suggestedPrice - p.supplierPrice) / p.suggestedPrice) * 100)}%</div>
                <div className="mt-1 flex items-center gap-1 text-[11px] text-ink-500"><Truck className="w-3.5 h-3.5" /> {p.deliveryDays} jours</div>
                <button onClick={() => startImport(p)} className="mt-3 w-full bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Importer</button>
              </div>
            </div>
          );
        })}
      </div>

      <Modal open={!!importing} onClose={() => setImporting(null)} title="Importer ce produit" size="md">
        {importing && (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-ink-100"><img src={importing.image} alt="" className="w-full h-full object-cover" /></div>
            <h3 className="font-display font-bold text-lg text-ink-900">{importing.name}</h3>
            <p className="text-sm text-ink-600">{importing.description}</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ink-50 rounded-xl p-3"><p className="text-xs text-ink-400">Prix fournisseur</p><p className="font-bold text-ink-900">{formatKz(importing.supplierPrice)}</p></div>
              <div className="bg-brand-50 rounded-xl p-3"><p className="text-xs text-brand-600">Prix conseillé</p><p className="font-bold text-brand-700">{formatKz(importing.suggestedPrice)}</p></div>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Votre prix de vente (Kz)</span>
              <input type="number" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm font-semibold" />
              <p className="text-xs mt-1.5 text-ink-500">Marge : <strong className="text-brand-600">{formatKz(salePrice - importing.supplierPrice)}</strong> ({Math.round(((salePrice - importing.supplierPrice) / salePrice) * 100)}%)</p>
            </label>
            <button onClick={doImport} disabled={loading || salePrice <= importing.supplierPrice} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-card">
              {loading ? <Spinner className="w-5 h-5" /> : <><Check className="w-4 h-4" /> Importer dans ma boutique</>}
            </button>
          </div>
        )}
      </Modal>

      {Toaster}
    </div>
  );
}
