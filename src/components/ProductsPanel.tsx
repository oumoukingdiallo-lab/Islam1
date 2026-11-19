import { useState, useEffect, useCallback } from 'react';
import {
  Search, Flame, Sparkles, TrendingUp, Plus, Truck, Check, Package, FileText, Video,
  CalendarClock, KeyRound, Layers, Wand2, Sparkle, Trash2, ExternalLink,
} from 'lucide-react';
import { products as catalogProducts, CATEGORIES, formatKz } from '@/lib/data';
import { Modal } from '@/components/Modal';
import { Badge, useToast, Skeleton } from '@/lib/ui';
import { supabase, type ProductRow } from '@/lib/supabase';
import { DigitalProductWizard } from '@/components/DigitalProductWizard';
import { MagicImport } from '@/components/MagicImport';
import type { Product } from '@/lib/types';

const TREND_META = {
  hot: { label: 'Tendance', icon: Flame, cls: 'bg-rose-100 text-rose-600 ring-rose-200' },
  new: { label: 'Nouveau', icon: Sparkles, cls: 'bg-blue-100 text-blue-600 ring-blue-200' },
  standard: { label: 'Populaire', icon: TrendingUp, cls: 'bg-ink-100 text-ink-600 ring-ink-200' },
};

const DIGITAL_TYPE_ICON: Record<string, typeof FileText> = {
  file: FileText, course: Video, coaching: CalendarClock, license: KeyRound, bundle: Layers,
};

type SubTab = 'products' | 'catalog' | 'import';

export function ProductsPanel({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const [sub, setSub] = useState<SubTab>('products');
  const [myProducts, setMyProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [detail, setDetail] = useState<ProductRow | null>(null);

  // Catalogue dropshipping
  const [query, setQuery] = useState('');
  const [cat, setCat] = useState('Tout');
  const [importing, setImporting] = useState<Product | null>(null);
  const [salePrice, setSalePrice] = useState(0);

  const loadProducts = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    setMyProducts((data as ProductRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredCatalog = catalogProducts.filter((p) => {
    const matchCat = cat === 'Tout' || p.category === cat;
    return matchCat && p.name.toLowerCase().includes(query.toLowerCase());
  });

  const importCatalogProduct = async () => {
    if (!importing || !storeId) return;
    const { error } = await supabase.from('products').insert({
      store_id: storeId,
      type: 'physical',
      name: importing.name,
      description: importing.description,
      category: importing.category,
      image_url: importing.image,
      supplier_price: importing.supplierPrice,
      sale_price: salePrice,
      suggested_price: importing.suggestedPrice,
      delivery_days: importing.deliveryDays,
      stock: importing.stock,
      active: true,
      trend: importing.trend,
    });
    if (error) { toast('Erreur lors de l’importation', 'error'); return; }
    toast(`${importing.name} ajouté à votre boutique`);
    setImporting(null);
    loadProducts();
  };

  const toggleActive = async (p: ProductRow) => {
    const { error } = await supabase.from('products').update({ active: !p.active }).eq('id', p.id);
    if (error) { toast('Erreur', 'error'); return; }
    loadProducts();
  };

  const deleteProduct = async (p: ProductRow) => {
    const { error } = await supabase.from('products').delete().eq('id', p.id);
    if (error) { toast('Erreur lors de la suppression', 'error'); return; }
    toast('Produit supprimé');
    loadProducts();
  };

  return (
    <div>
      {/* Action bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={() => setWizardOpen(true)}
          className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-card"
        >
          <Plus className="w-4 h-4" /> Créer un produit digital
        </button>
        <button
          onClick={() => setImportOpen(true)}
          className="bg-ink-900 hover:bg-ink-800 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition"
        >
          <Wand2 className="w-4 h-4" /> Importation Magique
        </button>
      </div>

      {/* Sub-tabs */}
      <div className="flex p-1 bg-ink-100 rounded-xl mb-5 max-w-lg">
        {([['products', `Mes produits (${myProducts.length})`], ['catalog', 'Catalogue dropshipping'], ['import', 'Importation Magique']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => setSub(v)}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition whitespace-nowrap ${sub === v ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* My products */}
      {sub === 'products' && (
        loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[0,1,2,3].map((i) => <Skeleton key={i} className="h-64 rounded-2xl" />)}
          </div>
        ) : myProducts.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-ink-200">
            <Package className="w-10 h-10 text-ink-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-ink-600">Aucun produit dans votre boutique.</p>
            <p className="text-xs text-ink-400 mt-1">Créez un produit digital ou importez depuis le catalogue dropshipping.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {myProducts.map((p) => {
              const DigIcon = DIGITAL_TYPE_ICON[p.digital_type ?? 'file'];
              const price = p.type === 'digital' ? (p.pricing_model === 'free' ? 0 : p.pricing_model === 'promo' ? (p.promo_price ?? 0) : (p.original_price ?? 0)) : (p.sale_price ?? 0);
              return (
                <div key={p.id} className={`bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden transition ${!p.active ? 'opacity-60' : 'hover:shadow-card'}`}>
                  <div className="relative aspect-square overflow-hidden bg-ink-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {p.type === 'digital' ? <DigIcon className="w-10 h-10 text-ink-300" /> : <Package className="w-10 h-10 text-ink-300" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={p.type === 'digital' ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-brand-100 text-brand-700 ring-brand-200'}>
                        {p.type === 'digital' ? 'Digital' : 'Physique'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="text-[10px] font-semibold text-ink-400 uppercase">{p.category ?? p.type}</p>
                    <h3 className="font-semibold text-sm text-ink-900 mt-0.5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {p.type === 'digital' && p.pricing_model === 'promo' && p.original_price && (
                        <span className="text-xs text-ink-400 line-through">{formatKz(p.original_price)}</span>
                      )}
                      <span className="font-display font-bold text-base text-ink-900">{price === 0 ? 'Gratuit' : formatKz(price)}</span>
                    </div>
                    <div className="mt-3 flex gap-1.5">
                      <button onClick={() => setDetail(p)} className="flex-1 bg-ink-100 hover:bg-ink-200 text-ink-700 text-xs font-semibold py-2 rounded-lg transition">Détails</button>
                      <button onClick={() => toggleActive(p)} className={`px-2.5 py-2 rounded-lg text-xs font-semibold transition ${p.active ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                        {p.active ? 'Masquer' : 'Activer'}
                      </button>
                      <button onClick={() => deleteProduct(p)} className="p-2 text-ink-400 hover:text-rose-500 bg-ink-50 rounded-lg transition">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}

      {/* Catalog dropshipping */}
      {sub === 'catalog' && (
        <div>
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
            {filteredCatalog.map((p) => {
              const Trend = TREND_META[p.trend].icon;
              const alreadyIn = myProducts.some((mp) => mp.name === p.name);
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden hover:shadow-card transition group">
                  <div className="relative aspect-square overflow-hidden bg-ink-100">
                    <img src={p.image} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                    <div className="absolute top-2 left-2">
                      <Badge className={TREND_META[p.trend].cls}><Trend className="w-3 h-3" /> {TREND_META[p.trend].label}</Badge>
                    </div>
                    {alreadyIn && <div className="absolute top-2 right-2 w-7 h-7 rounded-full bg-brand-500 text-white flex items-center justify-center shadow-card"><Check className="w-4 h-4" /></div>}
                  </div>
                  <div className="p-3 md:p-4">
                    <p className="text-[10px] font-semibold text-ink-400 uppercase">{p.category}</p>
                    <h3 className="font-semibold text-sm text-ink-900 mt-0.5 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    <div className="mt-2 flex items-baseline gap-1.5">
                      <span className="font-display font-bold text-base text-ink-900">{formatKz(p.supplierPrice)}</span>
                      <span className="text-[11px] text-ink-400">fournisseur</span>
                    </div>
                    <div className="mt-1 flex items-center gap-1 text-[11px] font-semibold text-brand-600">
                      <TrendingUp className="w-3.5 h-3.5" /> Marge conseillée : {Math.round(((p.suggestedPrice - p.supplierPrice) / p.suggestedPrice) * 100)}%
                    </div>
                    <button onClick={() => { setImporting(p); setSalePrice(p.suggestedPrice); }} className="mt-3 w-full bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5">
                      {alreadyIn ? 'Voir détails' : 'Ajouter à ma boutique'} {!alreadyIn && <Plus className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Import magic shortcut */}
      {sub === 'import' && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-ink-200 p-10 text-center">
          <Wand2 className="w-10 h-10 text-brand-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-base text-ink-900">Importation Magique</h3>
          <p className="text-sm text-ink-500 mt-1 max-w-md mx-auto">
            Collez un lien fournisseur ou téléversez une photo de produit. Kbizá génère automatiquement une fiche produit complète : titre accrocheur, description optimisée et prix suggéré en Kwanza.
          </p>
          <button onClick={() => setImportOpen(true)} className="mt-4 bg-brand-600 hover:bg-brand-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition shadow-card">
            Lancer l’Importation Magique
          </button>
        </div>
      )}

      {/* Detail modal */}
      <Modal open={!!detail} onClose={() => setDetail(null)} title="Détails du produit" size="lg">
        {detail && (
          <div>
            <div className="flex flex-col md:flex-row gap-5">
              <div className="md:w-1/2">
                <div className="aspect-square rounded-2xl overflow-hidden bg-ink-100">
                  {detail.image_url ? <img src={detail.image_url} alt="" className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center">
                      {detail.type === 'digital' ? (() => { const I = DIGITAL_TYPE_ICON[detail.digital_type ?? 'file']; return <I className="w-12 h-12 text-ink-300" />; })() : <Package className="w-12 h-12 text-ink-300" />}
                    </div>
                  )}
                </div>
              </div>
              <div className="md:w-1/2 space-y-3">
                <div className="flex items-center gap-2">
                  <Badge className={detail.type === 'digital' ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-brand-100 text-brand-700 ring-brand-200'}>
                    {detail.type === 'digital' ? 'Produit Digital' : 'Produit Physique'}
                  </Badge>
                  {detail.trend && detail.trend !== 'standard' && <Badge className={TREND_META[detail.trend].cls}>{TREND_META[detail.trend].label}</Badge>}
                </div>
                <h2 className="font-display font-bold text-xl text-ink-900">{detail.name}</h2>
                {detail.description && <p className="text-sm text-ink-600 leading-relaxed whitespace-pre-wrap">{detail.description}</p>}

                {detail.type === 'physical' && (
                  <div className="flex items-center gap-2 text-sm text-ink-600 bg-brand-50 rounded-xl px-3 py-2.5">
                    <Truck className="w-4 h-4 text-brand-600" /> Livraison estimée : <strong className="text-ink-900">{detail.delivery_days ?? 4} jours</strong> en Angola
                  </div>
                )}

                {detail.faq && detail.faq.length > 0 && (
                  <div className="bg-ink-50 rounded-xl p-3">
                    <p className="text-xs font-semibold text-ink-700 mb-2">FAQ</p>
                    {detail.faq.map((f, i) => (
                      <div key={i} className="mb-2 last:mb-0">
                        <p className="text-xs font-semibold text-ink-800">Q: {f.q}</p>
                        <p className="text-xs text-ink-600">R: {f.a}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {detail.type === 'physical' ? (
                    <>
                      <div className="bg-ink-50 rounded-xl p-3"><p className="text-xs text-ink-400">Prix fournisseur</p><p className="font-bold text-ink-900">{formatKz(detail.supplier_price ?? 0)}</p></div>
                      <div className="bg-brand-50 rounded-xl p-3"><p className="text-xs text-brand-600">Prix de vente</p><p className="font-bold text-brand-700">{formatKz(detail.sale_price ?? 0)}</p></div>
                    </>
                  ) : (
                    <>
                      <div className="bg-ink-50 rounded-xl p-3"><p className="text-xs text-ink-400">Tarification</p><p className="font-bold text-ink-900">{detail.pricing_model === 'free' ? 'Gratuit' : detail.pricing_model === 'promo' ? 'Promo' : 'Paiement unique'}</p></div>
                      <div className="bg-brand-50 rounded-xl p-3"><p className="text-xs text-brand-600">Prix</p><p className="font-bold text-brand-700">{getDigitalPrice(detail) === 0 ? 'Gratuit' : formatKz(getDigitalPrice(detail))}</p></div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Catalog import modal */}
      <Modal open={!!importing} onClose={() => setImporting(null)} title="Importer ce produit" size="md">
        {importing && (
          <div className="space-y-4">
            <div className="aspect-video rounded-xl overflow-hidden bg-ink-100">
              <img src={importing.image} alt="" className="w-full h-full object-cover" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900">{importing.name}</h3>
            <p className="text-sm text-ink-600">{importing.description}</p>
            <div className="flex items-center gap-2 text-sm text-ink-600 bg-brand-50 rounded-xl px-3 py-2.5">
              <Truck className="w-4 h-4 text-brand-600" /> Livraison : {importing.deliveryDays} jours en Angola
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-ink-50 rounded-xl p-3"><p className="text-xs text-ink-400">Prix fournisseur</p><p className="font-bold text-ink-900">{formatKz(importing.supplierPrice)}</p></div>
              <div className="bg-brand-50 rounded-xl p-3"><p className="text-xs text-brand-600">Prix conseillé</p><p className="font-bold text-brand-700">{formatKz(importing.suggestedPrice)}</p></div>
            </div>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Votre prix de vente (Kz)</span>
              <input type="number" value={salePrice} onChange={(e) => setSalePrice(Number(e.target.value))} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm font-semibold" />
              <p className="text-xs mt-1.5 text-ink-500">Marge : <strong className="text-brand-600">{Math.round(((salePrice - importing.supplierPrice) / salePrice) * 100)}%</strong> · Bénéfice : <strong className="text-brand-600">{formatKz(salePrice - importing.supplierPrice)}</strong></p>
            </label>
            <button onClick={importCatalogProduct} disabled={salePrice <= importing.supplierPrice} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-card">
              <Plus className="w-4 h-4" /> Importer dans ma boutique
            </button>
          </div>
        )}
      </Modal>

      <DigitalProductWizard open={wizardOpen} onClose={() => setWizardOpen(false)} storeId={storeId} onCreated={loadProducts} />
      <MagicImport open={importOpen} onClose={() => setImportOpen(false)} storeId={storeId} onCreated={loadProducts} />
      {Toaster}
    </div>
  );
}

function getDigitalPrice(p: ProductRow): number {
  if (p.pricing_model === 'free') return 0;
  if (p.pricing_model === 'promo' && p.promo_price != null) return p.promo_price;
  return p.original_price ?? 0;
}
