import { useState, useEffect, useCallback } from 'react';
import { Users, Search, MessageCircle, MapPin, Phone, ShoppingBag, TrendingUp, Loader2 } from 'lucide-react';
import { supabase, type CustomerRow, type OrderRow } from '@/lib/supabase';
import { formatKz } from '@/lib/data';
import { Badge, Skeleton, useToast } from '@/lib/ui';

export function ClientsPage({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const [customers, setCustomers] = useState<CustomerRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState<'spent' | 'orders' | 'recent'>('spent');

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('customers').select('*').eq('store_id', storeId).order('total_spent_aoa', { ascending: false });
    setCustomers((data as CustomerRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const filtered = customers.filter((c) => {
    const q = query.toLowerCase();
    return !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.city ?? '').toLowerCase().includes(q);
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === 'spent') return b.total_spent_aoa - a.total_spent_aoa;
    if (sortBy === 'orders') return b.total_orders - a.total_orders;
    return new Date(b.last_order_at ?? b.created_at).getTime() - new Date(a.last_order_at ?? a.created_at).getTime();
  });

  const totalRevenue = customers.reduce((s, c) => s + Number(c.total_spent_aoa), 0);
  const avgBasket = customers.length > 0 ? totalRevenue / customers.length : 0;

  const contactWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/\D/g, '');
    const msg = encodeURIComponent(`Bonjour ${name}, c'est ${'votre boutique'} Kbizá. Merci pour votre confiance !`);
    window.open(`https://wa.me/${cleanPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="px-4 md:px-8 lg:px-10 py-6 max-w-[1440px] mx-auto">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Users className="w-7 h-7 text-brand-600" />
          <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Clients & CRM</h1>
        </div>
        <p className="text-sm text-ink-500 mt-0.5">Vos clients enregistrés automatiquement lors de leurs commandes.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
        <StatCard label="Clients total" value={`${customers.length}`} icon={Users} tint="bg-brand-50 text-brand-600" />
        <StatCard label="CA total clients" value={formatKz(totalRevenue)} icon={TrendingUp} tint="bg-blue-50 text-blue-600" />
        <StatCard label="Panier moyen" value={formatKz(avgBasket)} icon={ShoppingBag} tint="bg-violet-50 text-violet-600" />
        <StatCard label="Commandes/client" value={customers.length > 0 ? (customers.reduce((s, c) => s + c.total_orders, 0) / customers.length).toFixed(1) : '0'} icon={ShoppingBag} tint="bg-amber-50 text-amber-600" />
      </div>

      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <div className="flex items-center bg-white border border-ink-200 rounded-xl px-3 py-2.5 shadow-soft flex-1">
          <Search className="w-5 h-5 text-ink-400 mr-2" />
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Rechercher par nom, téléphone ou ville…" className="bg-transparent outline-none text-sm flex-1" />
        </div>
        <select value={sortBy} onChange={(e) => setSortBy(e.target.value as typeof sortBy)} className="px-3 py-2.5 border border-ink-200 rounded-xl text-sm font-semibold bg-white outline-none focus:border-brand-500">
          <option value="spent">Trier par montant dépensé</option>
          <option value="orders">Trier par nombre de commandes</option>
          <option value="recent">Trier par dernière commande</option>
        </select>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[0,1,2,3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-xl" />)}
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <Users className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-600">Aucun client pour le moment.</p>
          <p className="text-xs text-ink-400 mt-1">Les clients apparaîtront automatiquement dès la première commande.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden">
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-ink-400 border-b border-ink-100">
                  <th className="px-5 py-3 font-semibold">Client</th>
                  <th className="px-5 py-3 font-semibold">Téléphone</th>
                  <th className="px-5 py-3 font-semibold">Ville / Province</th>
                  <th className="px-5 py-3 font-semibold text-center">Commandes</th>
                  <th className="px-5 py-3 font-semibold text-right">Total dépensé</th>
                  <th className="px-5 py-3 font-semibold">Dernière commande</th>
                  <th className="px-5 py-3 font-semibold text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((c) => (
                  <tr key={c.id} className="border-b border-ink-50 last:border-0 hover:bg-ink-50/50 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{c.name.charAt(0).toUpperCase()}</div>
                        <span className="font-semibold text-ink-900">{c.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-ink-600"><span className="flex items-center gap-1 text-xs"><Phone className="w-3 h-3 text-ink-400" />{c.phone}</span></td>
                    <td className="px-5 py-3.5 text-ink-600 text-xs">{c.city ? `${c.city}${c.province ? ', ' + c.province : ''}` : '—'}</td>
                    <td className="px-5 py-3.5 text-center"><Badge className="bg-ink-100 text-ink-700 ring-ink-200">{c.total_orders}</Badge></td>
                    <td className="px-5 py-3.5 text-right font-bold text-ink-900">{formatKz(Number(c.total_spent_aoa))}</td>
                    <td className="px-5 py-3.5 text-xs text-ink-500">{c.last_order_at ? new Date(c.last_order_at).toLocaleDateString('fr-FR') : '—'}</td>
                    <td className="px-5 py-3.5 text-right">
                      <button onClick={() => contactWhatsApp(c.phone, c.name)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700 bg-brand-50 hover:bg-brand-100 px-2.5 py-1.5 rounded-lg transition">
                        <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3 p-3">
            {sorted.map((c) => (
              <div key={c.id} className="bg-ink-50 rounded-xl p-3">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-sm font-bold">{c.name.charAt(0).toUpperCase()}</div>
                    <div>
                      <p className="font-semibold text-sm text-ink-900">{c.name}</p>
                      <p className="text-xs text-ink-400 flex items-center gap-1"><Phone className="w-3 h-3" />{c.phone}</p>
                    </div>
                  </div>
                  <Badge className="bg-ink-100 text-ink-700 ring-ink-200">{c.total_orders} cmd</Badge>
                </div>
                {c.city && <p className="text-xs text-ink-500 flex items-center gap-1 mb-2"><MapPin className="w-3 h-3" />{c.city}{c.province ? ', ' + c.province : ''}</p>}
                <div className="flex items-center justify-between">
                  <span className="font-bold text-ink-900">{formatKz(Number(c.total_spent_aoa))}</span>
                  <button onClick={() => contactWhatsApp(c.phone, c.name)} className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 bg-brand-50 px-2.5 py-1.5 rounded-lg">
                    <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {Toaster}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, tint }: { label: string; value: string; icon: typeof Users; tint: string }) {
  return (
    <div className="bg-white rounded-2xl p-4 md:p-5 border border-ink-100 shadow-soft">
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${tint}`}><Icon className="w-5 h-5" /></div>
      <p className="font-display font-bold text-xl md:text-2xl text-ink-900 tracking-tight">{value}</p>
      <p className="text-xs text-ink-500 font-medium mt-0.5">{label}</p>
    </div>
  );
}
