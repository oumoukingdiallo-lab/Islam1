import { useState, useEffect, useCallback } from 'react';
import { Search, ChevronDown, MapPin, Phone, Package, CreditCard } from 'lucide-react';
import { formatKz, STATUS_LABELS, STATUS_STYLES, PAYMENT_LABELS, PAYMENT_STYLES } from '@/lib/data';
import { Badge, Skeleton } from '@/lib/ui';
import { supabase, type OrderRow } from '@/lib/supabase';
import type { OrderStatus } from '@/lib/types';

type TabId = OrderStatus | 'all';

const TABS: { id: TabId; label: string }[] = [
  { id: 'all', label: 'Toutes' },
  { id: 'pending', label: 'En attente' },
  { id: 'confirmed', label: 'Confirmées' },
  { id: 'shipped', label: 'Expédiées' },
  { id: 'delivered', label: 'Livrées' },
  { id: 'cancelled', label: 'Annulées' },
];

const ALL_STATUSES: OrderStatus[] = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'];

const NEXT_STATUS: Record<OrderStatus, OrderStatus | null> = {
  pending: 'confirmed',
  confirmed: 'shipped',
  shipped: 'delivered',
  delivered: null,
  cancelled: null,
};

export function OrdersPage({ storeId, onToast }: { storeId: string | null; onToast: (m: string, t?: 'success' | 'error') => void }) {
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>('all');
  const [query, setQuery] = useState('');
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('orders').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    setOrders((data as OrderRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const filtered = orders.filter((o) => {
    const matchTab = tab === 'all' || o.status === tab;
    const q = query.toLowerCase();
    return matchTab && (!q || o.customer_name.toLowerCase().includes(q) || o.id.toLowerCase().includes(q) || o.product_name.toLowerCase().includes(q));
  });

  const counts: Record<string, number> = { all: orders.length };
  orders.forEach((o) => { counts[o.status] = (counts[o.status] ?? 0) + 1; });

  const updateStatus = async (id: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === id ? { ...o, status } : o)));
    setOpenMenu(null);
    const { error } = await supabase.from('orders').update({ status }).eq('id', id);
    if (error) { onToast('Erreur lors de la mise à jour', 'error'); load(); return; }
    onToast(`Commande ${id.slice(0, 8).toUpperCase()} → ${STATUS_LABELS[status]}`);
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Commandes & Logistique</h1>
        <p className="text-sm text-ink-500 mt-0.5">Suivez et gérez les commandes de vos clients.</p>
      </div>

      <div className="flex items-center bg-white border border-ink-200 rounded-xl px-3 py-2.5 shadow-soft mb-4">
        <Search className="w-5 h-5 text-ink-400 mr-2" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par client, commande ou produit…" className="bg-transparent outline-none text-sm flex-1" />
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
        {TABS.map((t) => (
          <button key={t.id} onClick={() => setTab(t.id)} className={`px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition flex items-center gap-2 ${tab === t.id ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
            {t.label}
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-white/20' : 'bg-ink-100 text-ink-500'}`}>{counts[t.id] ?? 0}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <Package className="w-10 h-10 text-ink-300 mx-auto mb-2" />
          <p className="text-sm font-medium text-ink-600">Aucune commande pour le moment.</p>
          <p className="text-xs text-ink-400 mt-1">Partagez votre lien de boutique pour recevoir vos premières commandes.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-400 border-b border-ink-100">
                  <th className="px-5 py-3 font-semibold">Commande</th>
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Produit</th>
                  <th className="px-5 py-3 font-semibold">Livraison</th>
                  <th className="px-5 py-3 font-semibold">Paiement</th>
                  <th className="px-5 py-3 font-semibold text-right">Montant</th>
                  <th className="px-5 py-3 font-semibold text-right">Statut</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition">
                    <td className="px-5 py-3.5 font-semibold text-ink-800">{o.id.slice(0, 8).toUpperCase()}</td>
                    <td className="px-5 py-3.5">
                      <p className="font-medium text-ink-800">{o.customer_name}</p>
                      <p className="text-xs text-ink-400 flex items-center gap-1"><Phone className="w-3 h-3" />{o.customer_phone}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600 max-w-[180px]">
                      <p className="truncate">{o.product_name}</p>
                      <p className="text-xs text-ink-400">{o.product_type === 'digital' ? 'Digital' : 'Physique'}</p>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600">
                      {o.delivery_city || o.city ? <><p className="flex items-center gap-1 text-xs"><MapPin className="w-3 h-3 text-ink-400" />{o.delivery_city ?? o.city}</p>{o.address && <p className="text-xs text-ink-400 truncate max-w-[150px]">{o.address}</p>}</> : <span className="text-xs text-ink-300">—</span>}
                    </td>
                    <td className="px-5 py-3.5">
                      <Badge className={PAYMENT_STYLES[o.payment_method] ?? 'bg-ink-100 text-ink-600 ring-ink-200'}>
                        <CreditCard className="w-3 h-3" />
                        {PAYMENT_LABELS[o.payment_method] ?? o.payment_method}
                      </Badge>
                    </td>
                    <td className="px-5 py-3.5 text-right font-semibold text-ink-900">{formatKz(o.total_aoa || o.amount)}</td>
                    <td className="px-5 py-3.5 text-right">
                      <StatusMenu order={o} open={openMenu === o.id} onToggle={() => setOpenMenu(openMenu === o.id ? null : o.id)} onUpdate={updateStatus} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <EmptyState />}
          </div>

          {/* Mobile cards */}
          <div className="md:hidden space-y-3">
            {filtered.map((o) => (
              <div key={o.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-ink-900">{o.id.slice(0, 8).toUpperCase()}</p>
                    <p className="text-xs text-ink-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <Badge className={STATUS_STYLES[o.status]}>{STATUS_LABELS[o.status]}</Badge>
                </div>
                <p className="font-medium text-ink-800 text-sm">{o.customer_name}</p>
                <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5"><Package className="w-3 h-3" />{o.product_name}</p>
                {(o.delivery_city || o.city) && <p className="text-xs text-ink-500 flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" />{o.address}, {o.delivery_city ?? o.city}</p>}
                <div className="flex items-center justify-between mt-2">
                  <Badge className={PAYMENT_STYLES[o.payment_method] ?? 'bg-ink-100 text-ink-600 ring-ink-200'}>{PAYMENT_LABELS[o.payment_method] ?? o.payment_method}</Badge>
                  <span className="font-display font-bold text-base text-ink-900">{formatKz(o.total_aoa || o.amount)}</span>
                </div>
                <div className="flex items-center justify-end mt-3 pt-3 border-t border-ink-100">
                  <StatusMenu order={o} open={openMenu === o.id} onToggle={() => setOpenMenu(openMenu === o.id ? null : o.id)} onUpdate={updateStatus} />
                </div>
              </div>
            ))}
            {filtered.length === 0 && <EmptyState />}
          </div>
        </>
      )}
    </div>
  );
}

function StatusMenu({ order, open, onToggle, onUpdate }: {
  order: OrderRow; open: boolean; onToggle: () => void; onUpdate: (id: string, s: OrderStatus) => void;
}) {
  const next = NEXT_STATUS[order.status];

  return (
    <div className="relative inline-block">
      <button onClick={onToggle} className="inline-flex items-center gap-1">
        <Badge className={STATUS_STYLES[order.status]}>{STATUS_LABELS[order.status]}</Badge>
        <ChevronDown className="w-3.5 h-3.5 text-ink-400" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-20" onClick={onToggle} />
          <div className="absolute right-0 mt-1 z-30 bg-white rounded-xl shadow-pop border border-ink-100 py-1 min-w-[160px] animate-scale-in origin-top-right">
            {ALL_STATUSES.map((s) => (
              <button key={s} onClick={() => onUpdate(order.id, s)} className={`w-full text-left px-3 py-2 text-xs font-medium hover:bg-ink-50 flex items-center gap-2 ${s === order.status ? 'text-ink-900 font-semibold' : 'text-ink-600'}`}>
                <span className={`w-2 h-2 rounded-full ${STATUS_STYLES[s].split(' ')[0]}`} />
                {STATUS_LABELS[s]}
                {s === order.status && <span className="ml-auto text-brand-600">✓</span>}
              </button>
            ))}
            {next && (
              <div className="border-t border-ink-100 mt-1 pt-1">
                <button onClick={() => onUpdate(order.id, next)} className="w-full text-left px-3 py-2 text-xs font-semibold text-brand-600 hover:bg-brand-50">
                  → Passer à : {STATUS_LABELS[next]}
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-16">
      <Package className="w-10 h-10 text-ink-300 mx-auto mb-2" />
      <p className="text-sm text-ink-400 font-medium">Aucune commande dans cette catégorie.</p>
    </div>
  );
}
