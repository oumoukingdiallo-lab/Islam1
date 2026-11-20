import { useState, useEffect, useMemo } from 'react';
import {
  Radar, Search, TrendingUp, Eye, Heart, Share2, Rocket, Loader2,
  TiktokIcon, Facebook, Flame,
} from 'lucide-react';
import { supabase, type AdSpyItemRow, callAiGenerate } from '@/lib/supabase';
import { formatKz } from '@/lib/data';
import { Badge, Skeleton, useToast } from '@/lib/ui';
import { navigate } from '@/lib/router';
import { useAuth } from '@/lib/auth';

const PLATFORMS = [
  { id: 'all', label: 'Toutes' },
  { id: 'tiktok', label: 'TikTok Ads' },
  { id: 'facebook', label: 'Facebook Ads' },
] as const;

const PERIODS = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 jours' },
  { id: '30d', label: '30 jours' },
] as const;

const CATEGORIES = ['Toutes', 'Beauté & Soins', 'High-Tech', 'Maison & Cuisine', 'Mode', 'Santé'];

const SORTS = [
  { id: 'score', label: 'Meilleur score 7j' },
  { id: 'views', label: 'Plus vues' },
  { id: 'margin', label: 'Forte marge en Kz' },
] as const;

function formatNum(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
  return `${n}`;
}

export function AdSpyPage({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const { store } = useAuth();
  const [items, setItems] = useState<AdSpyItemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [platform, setPlatform] = useState<string>('all');
  const [period, setPeriod] = useState<string>('7d');
  const [category, setCategory] = useState<string>('Toutes');
  const [sort, setSort] = useState<string>('score');
  const [query, setQuery] = useState('');
  const [importing, setImporting] = useState<AdSpyItemRow | null>(null);
  const [importStep, setImportStep] = useState<'idle' | 'generating' | 'done'>('idle');

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('ad_spy_items').select('*').order('views_7d', { ascending: false });
      setItems((data as AdSpyItemRow[]) ?? []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => {
    let result = items;
    if (platform !== 'all') result = result.filter((i) => i.platform === platform);
    if (category !== 'Toutes') result = result.filter((i) => i.category === category);
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((i) => i.product_name.toLowerCase().includes(q) || i.ad_copy.toLowerCase().includes(q));
    }
    if (sort === 'views') result = [...result].sort((a, b) => b.views_7d - a.views_7d);
    else if (sort === 'margin') result = [...result].sort((a, b) => (b.suggested_price_aoa - b.supplier_price_aoa) - (a.suggested_price_aoa - a.supplier_price_aoa));
    else result = [...result].sort((a, b) => b.growth_pct - a.growth_pct);
    return result;
  }, [items, platform, category, query, sort]);

  const importWithAI = async (item: AdSpyItemRow) => {
    if (!storeId) { toast('Créez d\'abord votre boutique', 'error'); return; }
    setImporting(item);
    setImportStep('generating');
    try {
      const aiResult = await callAiGenerate({
        type: 'product_landing',
        productType: 'physical',
        productName: item.product_name,
        price: item.suggested_price_aoa,
        category: item.category,
      });
      const slug = item.product_name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5);
      const { error } = await supabase.from('products').insert({
        store_id: storeId,
        type: 'physical',
        name: item.product_name,
        slug,
        category: item.category,
        sale_price: item.suggested_price_aoa,
        cost_price_aoa: item.supplier_price_aoa,
        compare_at_price_aoa: Math.round(item.suggested_price_aoa * 1.3),
        stock: 100,
        image_url: item.image_url,
        square_image_url: item.image_url,
        is_published: false,
        active: false,
        delivery_days: item.delivery_days,
        ai_landing_blocks: aiResult,
        subtitle: aiResult.hero_subtitle ?? null,
        description: aiResult.description ?? null,
        faq: aiResult.faq ?? [],
      });
      if (error) throw error;
      setImportStep('done');
      toast('Produit importé avec page de vente IA générée');
    } catch (err) {
      toast('Erreur lors de l\'import', 'error');
      setImporting(null);
      setImportStep('idle');
    }
  };

  return (
    <div className="px-4 md:px-8 lg:px-10 py-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Radar className="w-7 h-7 text-brand-600" />
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Ad Spy — Pubs Gagnantes</h1>
        </div>
        <p className="text-sm text-ink-500 mt-0.5">Espionnez les produits et publicités qui cartonnent sur TikTok et Facebook. Importez en 1 clic avec une page de vente générée par l'IA.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 mb-5 space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex items-center bg-ink-50 rounded-xl px-3 py-2.5 flex-1">
            <Search className="w-4 h-4 text-ink-400 mr-2" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit ou une publicité…" className="bg-transparent outline-none text-sm flex-1" />
          </div>
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="px-3 py-2.5 border border-ink-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-brand-500">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterGroup label="Plateforme" options={PLATFORMS} value={platform} onChange={setPlatform} />
          <FilterGroup label="Période" options={PERIODS} value={period} onChange={setPeriod} />
          <div className="flex gap-1.5 flex-wrap">
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${category === c ? 'bg-ink-900 text-white' : 'bg-ink-50 text-ink-500 hover:bg-ink-100'}`}>{c}</button>
            ))}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2,3,4,5].map((i) => <Skeleton key={i} className="h-80 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <Radar className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-600">Aucune publicité trouvée.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((item) => {
            const margin = item.suggested_price_aoa - item.supplier_price_aoa;
            const marginPct = Math.round((margin / item.suggested_price_aoa) * 100);
            return (
              <div key={item.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden hover:shadow-card transition group">
                <div className="relative aspect-video overflow-hidden bg-ink-100">
                  <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                  <div className="absolute top-2 left-2">
                    <Badge className={item.platform === 'tiktok' ? 'bg-ink-900 text-white ring-ink-700' : 'bg-blue-600 text-white ring-blue-500'}>
                      {item.platform === 'tiktok' ? <Flame className="w-3 h-3" /> : <Facebook className="w-3 h-3" />}
                      {item.platform === 'tiktok' ? 'TikTok' : 'Facebook'}
                    </Badge>
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge className="bg-white/90 text-brand-700 ring-brand-200">
                      <TrendingUp className="w-3 h-3" /> +{item.growth_pct}%
                    </Badge>
                  </div>
                </div>
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-semibold text-sm text-ink-900 line-clamp-1">{item.product_name}</h3>
                    <p className="text-[10px] font-medium text-ink-400 uppercase tracking-wide">{item.category}</p>
                  </div>

                  <div className="bg-ink-50 rounded-xl p-2.5">
                    <p className="text-xs text-ink-600 line-clamp-3 italic">"{item.ad_copy}"</p>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-ink-50 rounded-lg py-1.5">
                      <Eye className="w-3.5 h-3.5 text-ink-400 mx-auto" />
                      <p className="text-xs font-bold text-ink-900 mt-0.5">{formatNum(item.views_7d)}</p>
                      <p className="text-[9px] text-ink-400">Vues 7j</p>
                    </div>
                    <div className="bg-ink-50 rounded-lg py-1.5">
                      <Heart className="w-3.5 h-3.5 text-ink-400 mx-auto" />
                      <p className="text-xs font-bold text-ink-900 mt-0.5">{formatNum(item.likes_7d)}</p>
                      <p className="text-[9px] text-ink-400">Likes 7j</p>
                    </div>
                    <div className="bg-ink-50 rounded-lg py-1.5">
                      <Share2 className="w-3.5 h-3.5 text-ink-400 mx-auto" />
                      <p className="text-xs font-bold text-ink-900 mt-0.5">{formatNum(item.shares_7d)}</p>
                      <p className="text-[9px] text-ink-400">Partages</p>
                    </div>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <div><p className="text-[10px] text-ink-400">Fournisseur</p><p className="text-sm font-bold text-ink-700">{formatKz(item.supplier_price_aoa)}</p></div>
                    <div className="ml-auto text-right"><p className="text-[10px] text-ink-400">Vente conseillée</p><p className="text-sm font-bold text-brand-600">{formatKz(item.suggested_price_aoa)}</p></div>
                  </div>
                  <div className="flex items-center justify-between bg-brand-50 rounded-lg px-3 py-1.5">
                    <span className="text-xs text-ink-600">Marge estimée</span>
                    <span className="text-sm font-bold text-brand-700">{formatKz(margin)} ({marginPct}%)</span>
                  </div>

                  <button
                    onClick={() => importWithAI(item)}
                    disabled={importing?.id === item.id}
                    className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-xs font-semibold py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition"
                  >
                    {importing?.id === item.id && importStep === 'generating' ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Génération IA en cours…</>
                    ) : importing?.id === item.id && importStep === 'done' ? (
                      <><Radar className="w-4 h-4" /> Importé — Voir mes produits</>
                    ) : (
                      <><Rocket className="w-4 h-4" /> Importer + Créer la page IA</>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {importing && importStep === 'done' && (
        <div className="fixed bottom-4 right-4 z-50 bg-white rounded-2xl shadow-pop border border-ink-100 p-4 max-w-sm animate-slide-up">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center"><Rocket className="w-4 h-4" /></div>
            <div>
              <p className="text-sm font-bold text-ink-900">Produit importé avec succès</p>
              <p className="text-xs text-ink-500">La page de vente a été générée par l'IA.</p>
            </div>
          </div>
          <button onClick={() => navigate('/produits')} className="w-full bg-ink-900 hover:bg-ink-800 text-white text-xs font-semibold py-2 rounded-lg transition">Voir dans Mes Produits</button>
        </div>
      )}

      {Toaster}
    </div>
  );
}

function FilterGroup({ label, options, value, onChange }: {
  label: string;
  options: readonly { id: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-bold uppercase tracking-wide text-ink-300">{label}</span>
      <div className="flex p-0.5 bg-ink-100 rounded-lg">
        {options.map((o) => (
          <button key={o.id} onClick={() => onChange(o.id)} className={`px-2.5 py-1 text-xs font-semibold rounded-md transition ${value === o.id ? 'bg-white text-ink-900 shadow-sm' : 'text-ink-500'}`}>{o.label}</button>
        ))}
      </div>
    </div>
  );
}
