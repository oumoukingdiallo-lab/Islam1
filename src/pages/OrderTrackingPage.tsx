import { useState } from 'react';
import { Search, Package, Truck, Check, Clock, X, MapPin, Phone, ArrowRight, Loader2 } from 'lucide-react';
import { supabase, type OrderRow } from '@/lib/supabase';
import { formatKz, STATUS_LABELS, STATUS_STYLES } from '@/lib/data';
import { Badge, Spinner, useToast } from '@/lib/ui';
import { navigate } from '@/lib/router';

const STATUS_ICON: Record<string, typeof Clock> = {
  pending: Clock,
  confirmed: Check,
  shipped: Truck,
  delivered: Check,
  cancelled: X,
};

const STATUS_FLOW: Record<string, string[]> = {
  pending: ['Commande reçue', 'En attente de confirmation'],
  confirmed: ['Commande reçue', 'Confirmée', 'Préparation en cours'],
  shipped: ['Commande reçue', 'Confirmée', 'Expédiée', 'En livraison'],
  delivered: ['Commande reçue', 'Confirmée', 'Expédiée', 'Livrée'],
  cancelled: ['Commande reçue', 'Annulée'],
};

export function OrderTrackingPage() {
  const { toast, Toaster } = useToast();
  const [search, setSearch] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [searched, setSearched] = useState(false);

  const track = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim() && !phone.trim()) { toast('Saisissez un numéro ou un téléphone', 'error'); return; }
    setLoading(true);
    setSearched(true);

    let query = supabase.from('orders').select('*');
    if (search.trim()) {
      const idUpper = search.trim().toUpperCase();
      const { data } = await supabase.from('orders').select('*').ilike('id', `%${search.trim()}%`);
      setOrders((data as OrderRow[]) ?? []);
    } else {
      const phoneQuery = `%${phone.trim()}%`;
      const { data } = await supabase.from('orders').select('*').ilike('customer_phone', phoneQuery);
      setOrders((data as OrderRow[]) ?? []);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="bg-gradient-to-br from-brand-700 to-ink-900 text-white py-12 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-3 py-1 text-xs font-semibold mb-4">
            <Truck className="w-3.5 h-3.5" /> Suivi de commande Kbizá
          </div>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl mb-3">Suivez votre commande</h1>
          <p className="text-brand-100/80 text-sm">Saisissez votre numéro de commande ou votre téléphone +244 pour voir le statut de votre livraison.</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-6">
        <div className="bg-white rounded-2xl shadow-card p-5 md:p-6 mb-6">
          <form onSubmit={track} className="space-y-3">
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Numéro de commande</span>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ex: A1B2C3D4" className="w-full pl-10 pr-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
              </div>
            </label>
            <div className="flex items-center gap-2 text-xs text-ink-400 font-semibold">OU</div>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Téléphone (+244)</span>
              <div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-xl focus-within:border-brand-500">
                <span className="text-ink-500 font-medium text-sm">🇦🇴 +244</span>
                <input value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" placeholder="9XX XXX XXX" className="flex-1 bg-transparent outline-none text-sm" />
              </div>
            </label>
            <button type="submit" disabled={loading} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Suivre ma commande</>}
            </button>
          </form>
        </div>

        {searched && !loading && orders.length === 0 && (
          <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-ink-200">
            <Package className="w-10 h-10 text-ink-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-ink-600">Aucune commande trouvée.</p>
            <p className="text-xs text-ink-400 mt-1">Vérifiez votre numéro ou votre numéro de téléphone.</p>
          </div>
        )}

        {orders.length > 0 && (
          <div className="space-y-4 pb-12">
            {orders.map((o) => {
              const Icon = STATUS_ICON[o.status] ?? Clock;
              const steps = STATUS_FLOW[o.status] ?? [];
              const currentStepIndex = steps.length - 1;
              return (
                <div key={o.id} className="bg-white rounded-2xl shadow-card overflow-hidden">
                  <div className="p-5 border-b border-ink-100">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs text-ink-400">Commande N°</p>
                        <p className="font-display font-bold text-lg text-ink-900">{o.id.slice(0, 8).toUpperCase()}</p>
                      </div>
                      <Badge className={STATUS_STYLES[o.status]}>
                        <Icon className="w-3.5 h-3.5" /> {STATUS_LABELS[o.status]}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-5">
                    <div className="space-y-3 mb-4">
                      <div className="flex justify-between text-sm"><span className="text-ink-500">Produit</span><span className="font-semibold text-ink-900">{o.product_name}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-ink-500">Quantité</span><span className="font-semibold text-ink-900">{o.quantity}</span></div>
                      <div className="flex justify-between text-sm"><span className="text-ink-500">Total</span><span className="font-bold text-ink-900">{formatKz(o.total_aoa || o.amount)}</span></div>
                      {o.delivery_city && <div className="flex justify-between text-sm"><span className="text-ink-500 flex items-center gap-1"><MapPin className="w-3 h-3" /> Livraison</span><span className="font-semibold text-ink-900">{o.delivery_city}{o.delivery_province ? ', ' + o.delivery_province : ''}</span></div>}
                      <div className="flex justify-between text-sm"><span className="text-ink-500">Date</span><span className="font-semibold text-ink-900">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                    </div>

                    <div className="pt-4 border-t border-ink-100">
                      <p className="text-xs font-bold uppercase tracking-wide text-ink-400 mb-3">Progression</p>
                      <div className="space-y-2">
                        {steps.map((step, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${i <= currentStepIndex ? 'bg-brand-600 text-white' : 'bg-ink-100 text-ink-400'}`}>
                              {i < currentStepIndex ? <Check className="w-3 h-3" /> : i === currentStepIndex ? <Icon className="w-3 h-3" /> : i + 1}
                            </div>
                            <span className={`text-sm ${i <= currentStepIndex ? 'font-semibold text-ink-900' : 'text-ink-400'}`}>{step}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {Toaster}
    </div>
  );
}
