import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Wallet, Package, Eye, ArrowUpRight, Search, Bell, Copy, PlusCircle, FileText,
  ShoppingBag, ExternalLink, MessageCircle,
} from 'lucide-react';
import { formatKz, STATUS_LABELS, STATUS_STYLES, PAYMENT_LABELS, PAYMENT_STYLES } from '@/lib/data';
import { Skeleton, Badge, useToast } from '@/lib/ui';
import { supabase, type OrderRow, type ProductRow } from '@/lib/supabase';
import { navigate } from '@/lib/router';
import type { OrderStatus } from '@/lib/types';

type Period = 'today' | '7d' | '30d' | 'all';

export function DashboardPage({ userName, storeId, storeSlug }: { userName: string; storeId: string | null; storeSlug: string | null }) {
  const { toast, Toaster } = useToast();
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const [ordRes, prodRes] = await Promise.all([
      supabase.from('orders').select('*').eq('store_id', storeId).order('created_at', { ascending: false }),
      supabase.from('products').select('*').eq('store_id', storeId),
    ]);
    setOrders((ordRes.data as OrderRow[]) ?? []);
    setProducts((prodRes.data as ProductRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const now = new Date();
  const periodStart = new Date();
  if (period === 'today') periodStart.setHours(0, 0, 0, 0);
  else if (period === '7d') periodStart.setDate(now.getDate() - 7);
  else if (period === '30d') periodStart.setDate(now.getDate() - 30);
  else periodStart.setFullYear(2000);

  const periodOrders = orders.filter((o) => new Date(o.created_at) >= periodStart && o.status !== 'cancelled');
  const totalRevenue = periodOrders.reduce((s, o) => s + (o.total_aoa || o.amount), 0);
  const pendingCount = orders.filter((o) => o.status === 'pending').length;
  const digitalProducts = products.filter((p) => p.type === 'digital').length;
  const physicalProducts = products.filter((p) => p.type === 'physical').length;
  const publishedCount = products.filter((p) => p.is_published).length;

  // Net profit
  const netProfit = periodOrders.reduce((s, o) => {
    const p = products.find((pr) => pr.id === o.product_id);
    const cost = p?.type === 'digital' ? 0 : (p?.cost_price_aoa ?? p?.supplier_price ?? 0);
    return s + ((o.total_aoa || o.amount) - cost * (o.quantity ?? 1) - (o.shipping_fee_aoa ?? 0));
  }, 0);

  const avgBasket = periodOrders.length > 0 ? Math.round(totalRevenue / periodOrders.length) : 0;
  const cityCounts: Record<string, number> = {};
  periodOrders.forEach((o) => { const c = o.delivery_city ?? o.city ?? ''; if (c) cityCounts[c] = (cityCounts[c] ?? 0) + 1; });
  const topCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '—';
  const digitalRevenue = periodOrders.filter((o) => o.product_type === 'digital').reduce((s, o) => s + (o.total_aoa || o.amount), 0);
  const physicalRevenue = totalRevenue - digitalRevenue;
  const totalRev = totalRevenue || 1;

  const kpis = [
    { label: 'Chiffre d\'affaires', value: formatKz(totalRevenue), icon: Wallet, tint: 'bg-brand-50 text-brand-600' },
    { label: 'Bénéfice net estimé', value: formatKz(netProfit), icon: TrendingUp, tint: 'bg-blue-50 text-blue-600' },
    { label: 'Commandes totales', value: `${orders.length}`, sub: pendingCount > 0 ? `${pendingCount} à traiter` : undefined, icon: Package, tint: 'bg-violet-50 text-violet-600' },
    { label: 'Catalogue actif', value: `${publishedCount}`, sub: `${digitalProducts} digitaux · ${physicalProducts} physiques`, icon: ShoppingBag, tint: 'bg-amber-50 text-amber-600' },
  ];

  const chartData = buildChartData(orders, period);
  const storeUrl = storeSlug ? `${window.location.origin}/#/s/${storeSlug}` : '';

  const copyStoreLink = () => { if (storeUrl) { navigator.clipboard?.writeText(storeUrl); toast('Lien de la boutique copié'); } };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <p className="text-sm text-ink-500 font-medium">Bonjour, {userName.split(' ')[0]} 👋</p>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-semibold"><span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" /> Boutique en ligne</span>
          </div>
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Tableau de bord</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(`/s/${storeSlug ?? ''}`)} className="bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 text-sm font-semibold px-3 py-2.5 rounded-xl flex items-center gap-2 transition"><ExternalLink className="w-4 h-4" /> Voir ma boutique</button>
          <div className="flex p-1 bg-white border border-ink-200 rounded-xl">
            {([['today', 'Auj.'], ['7d', '7j'], ['30d', '30j'], ['all', 'Tout']] as const).map(([v, l]) => (
              <button key={v} onClick={() => setPeriod(v)} className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition ${period === v ? 'bg-ink-900 text-white' : 'text-ink-500'}`}>{l}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-6">
        <QuickAction icon={FileText} label="Créer un Produit Digital" desc="Style Chariow — E-books, formations, coaching" tint="bg-violet-600" onClick={() => navigate('/produits/nouveau?type=digital')} />
        <QuickAction icon={ShoppingBag} label="Créer un Produit Physique IA" desc="Style Adafrik — Page de vente Shopify" tint="bg-brand-600" onClick={() => navigate('/produits/nouveau?type=physical')} />
        <QuickAction icon={Copy} label="Copier le lien de ma boutique" desc={storeUrl || 'Aucune boutique'} tint="bg-ink-900" onClick={copyStoreLink} />
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl p-4 md:p-5 border border-ink-100 shadow-soft hover:shadow-card transition animate-fade-in">
              <div className="flex items-center justify-between mb-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${k.tint}`}><Icon className="w-5 h-5" /></div>
              </div>
              {loading ? <Skeleton className="h-7 w-24 mb-1" /> : <p className="font-display font-bold text-xl md:text-2xl text-ink-900 tracking-tight">{k.value}</p>}
              <p className="text-xs text-ink-500 font-medium mt-0.5">{k.label}</p>
              {k.sub && <p className="text-[10px] text-ink-400 mt-0.5">{k.sub}</p>}
            </div>
          );
        })}
      </div>

      {/* Chart + side panel */}
      <div className="grid lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        <div className="lg:col-span-2 bg-white rounded-2xl p-5 border border-ink-100 shadow-soft">
          <h2 className="font-display font-bold text-base text-ink-900 mb-4">Revenus & Commandes (7 jours)</h2>
          <SalesChart data={chartData} accent="#059669" />
        </div>
        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
            <h3 className="font-display font-bold text-sm text-ink-900 mb-3">Répartition des ventes</h3>
            <div className="space-y-3">
              <div><div className="flex justify-between text-xs mb-1"><span className="text-ink-500">Produits Digitaux</span><span className="font-semibold text-ink-900">{Math.round((digitalRevenue / totalRev) * 100)}%</span></div><div className="h-2 bg-ink-100 rounded-full overflow-hidden"><div className="h-full bg-violet-500 rounded-full" style={{ width: `${(digitalRevenue / totalRev) * 100}%` }} /></div></div>
              <div><div className="flex justify-between text-xs mb-1"><span className="text-ink-500">Produits Physiques</span><span className="font-semibold text-ink-900">{Math.round((physicalRevenue / totalRev) * 100)}%</span></div><div className="h-2 bg-ink-100 rounded-full overflow-hidden"><div className="h-full bg-brand-500 rounded-full" style={{ width: `${(physicalRevenue / totalRev) * 100}%` }} /></div></div>
            </div>
            <div className="mt-4 space-y-2 pt-3 border-t border-ink-100">
              <div className="flex justify-between text-sm"><span className="text-ink-500">Panier moyen</span><span className="font-semibold text-ink-900">{formatKz(avgBasket)}</span></div>
              <div className="flex justify-between text-sm"><span className="text-ink-500">Ville la plus active</span><span className="font-semibold text-ink-900">{topCity}</span></div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent orders */}
      <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <h2 className="font-display font-bold text-base text-ink-900">Dernières commandes</h2>
          <button onClick={() => navigate('/commandes')} className="text-xs font-semibold text-brand-600 hover:underline">Voir tout</button>
        </div>
        {loading ? <div className="p-5 space-y-3">{[0,1,2].map((i) => <Skeleton key={i} className="h-12 w-full" />)}</div> : orders.length === 0 ? (
          <div className="text-center py-12 text-ink-400"><Package className="w-10 h-10 text-ink-300 mx-auto mb-2" /><p className="text-sm font-medium">Aucune commande pour le moment.</p><p className="text-xs mt-1">Partagez votre lien de boutique pour recevoir vos premières commandes.</p></div>
        ) : (
          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-xs text-ink-400 border-b border-ink-100"><th className="px-5 py-3 font-semibold">N°</th><th className="px-5 py-3 font-semibold">Client</th><th className="px-5 py-3 font-semibold">Produit</th><th className="px-5 py-3 font-semibold hidden md:table-cell">Ville</th><th className="px-5 py-3 font-semibold text-right">Montant</th><th className="px-5 py-3 font-semibold hidden lg:table-cell">Paiement</th><th className="px-5 py-3 font-semibold text-right">Statut</th></tr></thead>
              <tbody>
                {orders.slice(0, 5).map((o) => (
                  <tr key={o.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-ink-800">{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3.5"><p className="font-medium text-ink-800">{o.customer_name}</p><p className="text-xs text-ink-400">{o.customer_phone}</p></td>
                    <td className="px-5 py-3.5"><div className="flex items-center gap-1.5"><Badge className={o.product_type === 'digital' ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-brand-100 text-brand-700 ring-brand-200'}>{o.product_type === 'digital' ? 'Digital' : 'Physique'}</Badge><span className="text-ink-600 truncate max-w-[120px]">{o.product_name}</span></div></td>
                    <td className="px-5 py-3.5 text-ink-600 hidden md:table-cell">{o.delivery_city ?? o.city ?? '—'}</td>
                    <td className="px-5 py-3.5 text-right font-semibold text-ink-900">{formatKz(o.total_aoa || o.amount)}</td>
                    <td className="px-5 py-3.5 hidden lg:table-cell"><Badge className={PAYMENT_STYLES[o.payment_method] ?? 'bg-ink-100 text-ink-600 ring-ink-200'}>{PAYMENT_LABELS[o.payment_method] ?? o.payment_method}</Badge></td>
                    <td className="px-5 py-3.5 text-right"><Badge className={STATUS_STYLES[o.status as OrderStatus]}>{STATUS_LABELS[o.status as OrderStatus]}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {Toaster}
    </div>
  );
}

function QuickAction({ icon: Icon, label, desc, tint, onClick }: { icon: typeof FileText; label: string; desc: string; tint: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4 text-left hover:shadow-card transition group">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-3 ${tint} text-white`}><Icon className="w-5 h-5" /></div>
      <p className="font-semibold text-sm text-ink-900 group-hover:text-brand-600 transition">{label}</p>
      <p className="text-xs text-ink-500 mt-0.5 truncate">{desc}</p>
    </button>
  );
}

function buildChartData(orders: OrderRow[], period: Period) {
  const days: { label: string; revenue: number; count: number }[] = [];
  const labels = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const start = new Date(d); start.setHours(0, 0, 0, 0);
    const end = new Date(d); end.setHours(23, 59, 59, 999);
    const dayOrders = orders.filter((o) => { const od = new Date(o.created_at); return od >= start && od <= end && o.status !== 'cancelled'; });
    days.push({ label: labels[d.getDay()], revenue: dayOrders.reduce((s, o) => s + (o.total_aoa || o.amount), 0), count: dayOrders.length });
  }
  return days;
}

function SalesChart({ data, accent }: { data: { label: string; revenue: number; count: number }[]; accent: string }) {
  const maxRev = Math.max(...data.map((d) => d.revenue), 1);
  const [hover, setHover] = useState<number | null>(null);
  return (
    <div className="flex items-end justify-between gap-2 md:gap-3 h-48 md:h-56">
      {data.map((d, i) => {
        const h = (d.revenue / maxRev) * 100;
        const active = hover === i;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group" onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
            <div className="relative w-full flex items-end justify-center h-full">
              {active && d.revenue > 0 && <div className="absolute -top-2 z-10 bg-ink-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg whitespace-nowrap shadow-pop"><p style={{ color: accent }}>{formatKz(d.revenue)}</p><p className="text-ink-300 text-[10px]">{d.count} commande(s)</p></div>}
              <div className="w-1/2 max-w-[20px] rounded-t-md transition-all duration-300" style={{ height: `${Math.max(h, 2)}%`, backgroundColor: accent, opacity: active ? 1 : 0.7 }} />
            </div>
            <span className="text-[11px] font-medium text-ink-400">{d.label}</span>
          </div>
        );
      })}
    </div>
  );
}


