import { useState, useEffect, useCallback } from 'react';
import {
  Search, Plus, Copy, ExternalLink, Pencil, Trash2, Eye, EyeOff,
  Package, FileText, Video, CalendarClock, KeyRound, Layers, ShoppingBag,
} from 'lucide-react';
import { formatKz } from '@/lib/data';
import { Badge, Skeleton, useToast } from '@/lib/ui';
import { supabase, type ProductRow } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import { Modal } from '@/components/Modal';

const DIGITAL_ICON: Record<string, typeof FileText> = {
  file: FileText, course: Video, coaching: CalendarClock, license: KeyRound, bundle: Layers,
};

type FilterTab = 'all' | 'digital' | 'physical' | 'published' | 'draft';

export function ProductsPage({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [tab, setTab] = useState<FilterTab>('all');
  const [deleteTarget, setDeleteTarget] = useState<ProductRow | null>(null);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('products').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    setProducts((data as ProductRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const filtered = products.filter((p) => {
    const q = query.toLowerCase();
    const matchQ = !q || p.name.toLowerCase().includes(q);
    if (tab === 'all') return matchQ;
    if (tab === 'digital') return p.type === 'digital' && matchQ;
    if (tab === 'physical') return p.type === 'physical' && matchQ;
    if (tab === 'published') return p.is_published && matchQ;
    if (tab === 'draft') return !p.is_published && matchQ;
    return matchQ;
  });

  const copyLink = (p: ProductRow) => {
    const url = `${window.location.origin}/#/p/${p.slug}`;
    navigator.clipboard?.writeText(url);
    toast('Lien public copié');
  };

  const openPublic = (p: ProductRow) => {
    if (p.slug) window.open(`#/p/${p.slug}`, '_blank');
  };

  const togglePublished = async (p: ProductRow) => {
    const { error } = await supabase.from('products').update({ is_published: !p.is_published, active: !p.is_published }).eq('id', p.id);
    if (error) { toast('Erreur', 'error'); return; }
    toast(p.is_published ? 'Produit mis en brouillon' : 'Produit publié');
    load();
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const { error } = await supabase.from('products').delete().eq('id', deleteTarget.id);
    setDeleteTarget(null);
    if (error) { toast('Erreur lors de la suppression', 'error'); return; }
    toast('Produit supprimé');
    load();
  };

  const getEffectivePrice = (p: ProductRow): number => {
    if (p.type === 'digital') {
      if (p.pricing_model === 'free') return 0;
      if (p.pricing_model === 'promo' && p.promo_price != null) return p.promo_price;
      return p.original_price ?? 0;
    }
    return p.sale_price ?? 0;
  };

  const getMargin = (p: ProductRow): string => {
    const price = getEffectivePrice(p);
    const cost = p.type === 'digital' ? 0 : (p.cost_price_aoa ?? p.supplier_price ?? 0);
    if (price === 0) return '—';
    const margin = price - cost;
    const pct = Math.round((margin / price) * 100);
    return `${formatKz(margin)} (${pct}%)`;
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Mes Produits</h1>
          <p className="text-sm text-ink-500 mt-0.5">{products.length} produit(s) au total</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('/produits/nouveau?type=digital')} className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-card">
            <Plus className="w-4 h-4" /> Produit Digital
          </button>
          <button onClick={() => navigate('/produits/nouveau?type=physical')} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-card">
            <Plus className="w-4 h-4" /> Produit Physique IA
          </button>
        </div>
      </div>

      <div className="flex items-center bg-white border border-ink-200 rounded-xl px-3 py-2.5 shadow-soft mb-4">
        <Search className="w-5 h-5 text-ink-400 mr-2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher un produit…" className="bg-transparent outline-none text-sm flex-1" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {([['all', 'Tous'], ['digital', 'Digitaux'], ['physical', 'Physiques'], ['published', 'Publiés'], ['draft', 'Brouillons']] as const).map(([v, l]) => (
          <button key={v} onClick={() => setTab(v)} className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition ${tab === v ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}>{l}</button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <Package className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-600">Aucun produit dans cette catégorie.</p>
          <p className="text-xs text-ink-400 mt-1">Créez votre premier produit pour commencer à vendre.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((p) => {
            const Icon = p.type === 'digital' ? (DIGITAL_ICON[p.digital_type ?? 'file'] ?? FileText) : ShoppingBag;
            const price = getEffectivePrice(p);
            return (
              <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-3 md:p-4 flex items-center gap-3 md:gap-4 hover:shadow-card transition">
                <div className="w-14 h-14 md:w-16 md:h-16 rounded-xl overflow-hidden bg-ink-100 shrink-0">
                  {p.square_image_url || p.image_url ? (
                    <img src={p.square_image_url ?? p.image_url ?? ''} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center"><Icon className="w-6 h-6 text-ink-300" /></div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <Badge className={p.type === 'digital' ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-brand-100 text-brand-700 ring-brand-200'}>
                      <Icon className="w-3 h-3" /> {p.type === 'digital' ? 'Digital' : 'Physique'}
                    </Badge>
                    {p.is_published && <Badge className="bg-brand-50 text-brand-600 ring-brand-100">Publié</Badge>}
                  </div>
                  <h3 className="font-semibold text-sm text-ink-900 truncate">{p.name}</h3>
                  <div className="flex items-center gap-2 text-xs text-ink-500 mt-0.5">
                    <span className="font-bold text-ink-800">{price === 0 ? 'Gratuit' : formatKz(price)}</span>
                    {p.compare_at_price_aoa && p.compare_at_price_aoa > 0 && <span className="line-through text-ink-400">{formatKz(p.compare_at_price_aoa)}</span>}
                    <span className="text-ink-300">·</span>
                    <span>Marge : {getMargin(p)}</span>
                    <span className="text-ink-300">·</span>
                    <span>{p.sales_count ?? 0} vente(s)</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button onClick={() => togglePublished(p)} title={p.is_published ? 'Mettre en brouillon' : 'Publier'} className={`p-2 rounded-lg transition ${p.is_published ? 'text-amber-600 bg-amber-50 hover:bg-amber-100' : 'text-brand-600 bg-brand-50 hover:bg-brand-100'}`}>
                    {p.is_published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button onClick={() => copyLink(p)} title="Copier le lien public" className="p-2 rounded-lg text-ink-500 bg-ink-50 hover:bg-ink-100 transition">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button onClick={() => openPublic(p)} title="Ouvrir la page publique" className="p-2 rounded-lg text-ink-500 bg-ink-50 hover:bg-ink-100 transition">
                    <ExternalLink className="w-4 h-4" />
                  </button>
                  <button onClick={() => navigate(`/produits/modifier/${p.id}`)} title="Modifier" className="p-2 rounded-lg text-blue-600 bg-blue-50 hover:bg-blue-100 transition">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => setDeleteTarget(p)} title="Supprimer" className="p-2 rounded-lg text-rose-500 bg-rose-50 hover:bg-rose-100 transition">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Supprimer le produit" size="sm">
        <p className="text-sm text-ink-600 mb-5">Êtes-vous sûr de vouloir supprimer « {deleteTarget?.name} » ? Cette action est irréversible.</p>
        <div className="flex gap-2">
          <button onClick={() => setDeleteTarget(null)} className="flex-1 bg-ink-100 hover:bg-ink-200 text-ink-700 font-semibold py-2.5 rounded-xl text-sm transition">Annuler</button>
          <button onClick={confirmDelete} className="flex-1 bg-rose-500 hover:bg-rose-600 text-white font-semibold py-2.5 rounded-xl text-sm transition">Supprimer</button>
        </div>
      </Modal>

      {Toaster}
    </div>
  );
}
