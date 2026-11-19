import { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, Mail, Package, Download, ShoppingCart, Check, Lock, FileText, Video, CalendarClock, KeyRound, Layers, Tag,
} from 'lucide-react';
import { supabase, type Store, type ProductRow, type OrderRow } from '@/lib/supabase';
import { formatKz, ANGOLA_CITIES } from '@/lib/data';
import { Spinner, useToast, Badge } from '@/lib/ui';

const DIGITAL_TYPE_ICON: Record<string, typeof FileText> = {
  file: FileText, course: Video, coaching: CalendarClock, license: KeyRound, bundle: Layers,
};

export function StoreFront({ slug }: { slug: string }) {
  const { toast, Toaster } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [buying, setBuying] = useState<ProductRow | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Formulaire
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'transfer'>('cod');

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle();
      if (s) {
        setStore(s as Store);
        const { data: ps } = await supabase.from('products').select('*').eq('store_id', (s as Store).id).eq('active', true);
        setProducts((ps as ProductRow[]) ?? []);
      }
      setLoading(false);
    })();
  }, [slug]);

  const filtered = useMemo(() => {
    if (filter === 'all') return products;
    return products.filter((p) => p.type === filter);
  }, [products, filter]);

  const accent = store?.accent_color ?? '#059669';

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buying || !store) return;
    setSubmitting(true);
    const amount = getEffectivePrice(buying);
    const order: Partial<OrderRow> = {
      store_id: store.id,
      product_id: buying.id,
      product_name: buying.name,
      product_type: buying.type,
      customer_name: customerName,
      customer_phone: `+244 ${customerPhone}`,
      customer_email: customerEmail || null,
      city: buying.type === 'physical' ? city : null,
      address: buying.type === 'physical' ? address : null,
      amount,
      status: 'pending',
      payment_method: buying.type === 'physical' ? paymentMethod : 'transfer',
    };
    const { error } = await supabase.from('orders').insert(order);
    setSubmitting(false);
    if (error) { toast('Erreur lors de la commande', 'error'); return; }
    setSuccess(true);
    toast('Commande envoyée avec succès');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <Spinner className="w-8 h-8 text-brand-600" />
      </div>
    );
  }

  if (!store) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50 px-6 text-center">
        <Package className="w-12 h-12 text-ink-300 mb-3" />
        <h1 className="font-display font-bold text-xl text-ink-900">Boutique introuvable</h1>
        <p className="text-sm text-ink-500 mt-1">Cette boutique n’existe pas ou n’est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Banner */}
      <div className="h-32 md:h-40" style={{ backgroundColor: accent }}>
        {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-12 pb-12">
        {/* Store header */}
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow flex items-center justify-center font-display font-extrabold text-2xl shrink-0" style={{ color: accent }}>
              {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : store.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-extrabold text-xl md:text-2xl text-ink-900 truncate">{store.name}</h1>
              <p className="text-sm text-ink-500">{products.length} produits · Angola 🇦🇴 · Paiement en Kwanza</p>
            </div>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-5">
          {([['all', 'Tout'], ['physical', 'Produits physiques'], ['digital', 'Produits digitaux']] as const).map(([v, l]) => (
            <button
              key={v}
              onClick={() => setFilter(v)}
              className={`px-4 py-2 text-sm font-semibold rounded-xl transition ${filter === v ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}
            >
              {l}
            </button>
          ))}
        </div>

        {/* Products grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-ink-400">
            <Package className="w-10 h-10 text-ink-300 mx-auto mb-2" />
            <p className="font-medium">Aucun produit disponible pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {filtered.map((p) => {
              const price = getEffectivePrice(p);
              const DigIcon = DIGITAL_TYPE_ICON[p.digital_type ?? 'file'];
              return (
                <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden hover:shadow-card transition group">
                  <div className="relative aspect-square overflow-hidden bg-ink-100">
                    {p.image_url ? (
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: `${accent}15` }}>
                        {p.type === 'digital' ? <DigIcon className="w-10 h-10" style={{ color: accent }} /> : <Package className="w-10 h-10 text-ink-300" />}
                      </div>
                    )}
                    <div className="absolute top-2 left-2">
                      <Badge className={p.type === 'digital' ? 'bg-violet-100 text-violet-700 ring-violet-200' : 'bg-brand-100 text-brand-700 ring-brand-200'}>
                        {p.type === 'digital' ? <DigIcon className="w-3 h-3" /> : <Package className="w-3 h-3" />}
                        {p.type === 'digital' ? 'Digital' : 'Physique'}
                      </Badge>
                    </div>
                  </div>
                  <div className="p-3 md:p-4">
                    <h3 className="font-semibold text-sm text-ink-900 line-clamp-2 min-h-[2.5rem]">{p.name}</h3>
                    {p.description && <p className="text-xs text-ink-500 mt-1 line-clamp-2">{p.description}</p>}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {p.type === 'digital' && p.pricing_model === 'promo' && p.original_price && (
                        <span className="text-xs text-ink-400 line-through">{formatKz(p.original_price)}</span>
                      )}
                      <span className="font-display font-bold text-base" style={{ color: accent }}>{price === 0 ? 'Gratuit' : formatKz(price)}</span>
                    </div>
                    <button
                      onClick={() => { setBuying(p); setSuccess(false); }}
                      className="mt-3 w-full text-white text-xs font-semibold py-2 rounded-lg transition flex items-center justify-center gap-1.5"
                      style={{ backgroundColor: accent }}
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      {p.type === 'digital' ? 'Obtenir maintenant' : 'Commander'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Checkout modal */}
      {buying && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => setBuying(null)} />
          <div className="relative bg-white w-full md:max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl shadow-pop animate-slide-up md:animate-scale-in">
            {success ? (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
                  <Check className="w-7 h-7" />
                </div>
                <h3 className="font-display font-bold text-lg text-ink-900">Commande confirmée !</h3>
                <p className="text-sm text-ink-500 mt-2">
                  {buying.type === 'digital' && buying.file_url
                    ? 'Votre accès est prêt. Cliquez ci-dessous pour télécharger votre fichier.'
                    : 'Le vendeur a été notifié et vous contactera bientôt pour la livraison.'}
                </p>
                {buying.type === 'digital' && buying.file_url && (
                  <a
                    href={buying.file_url}
                    download
                    className="mt-5 inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-xl transition"
                    style={{ backgroundColor: accent }}
                  >
                    <Download className="w-4 h-4" /> Télécharger le fichier
                  </a>
                )}
                <button onClick={() => setBuying(null)} className="block mx-auto mt-4 text-sm font-semibold text-ink-500 hover:text-ink-800">
                  Fermer
                </button>
              </div>
            ) : (
              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-ink-900 mb-1">
                  {buying.type === 'digital' ? 'Obtenir ce produit' : 'Commander'}
                </h3>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-100">
                  {buying.image_url && <img src={buying.image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-ink-900">{buying.name}</p>
                    <p className="text-sm font-bold" style={{ color: accent }}>{getEffectivePrice(buying) === 0 ? 'Gratuit' : formatKz(getEffectivePrice(buying))}</p>
                  </div>
                </div>

                <form onSubmit={submitOrder} className="space-y-3">
                  <Input label="Nom complet" value={customerName} onChange={setCustomerName} required placeholder="Votre nom" />
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Téléphone</label>
                    <div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                      <span className="text-ink-500 font-medium text-sm">🇦🇴 +244</span>
                      <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required type="tel" placeholder="9XX XXX XXX" className="flex-1 bg-transparent outline-none text-sm" />
                    </div>
                  </div>

                  {buying.type === 'digital' ? (
                    <Input label="E-mail (pour la livraison)" value={customerEmail} onChange={setCustomerEmail} required type="email" placeholder="vous@exemple.com" />
                  ) : (
                    <>
                      <label className="block">
                        <span className="block text-xs font-semibold text-ink-600 mb-1.5">Ville de livraison</span>
                        <select value={city} onChange={(e) => setCity(e.target.value)} required className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm bg-white">
                          <option value="">Choisir…</option>
                          {ANGOLA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </label>
                      <div>
                        <label className="block text-xs font-semibold text-ink-600 mb-1.5">Adresse de livraison</label>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-3 w-4 h-4 text-ink-400" />
                          <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} placeholder="Quartier, rue, numéro…" className="w-full pl-10 pr-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm resize-none" />
                        </div>
                      </div>
                      <div>
                        <span className="block text-xs font-semibold text-ink-600 mb-1.5">Mode de paiement</span>
                        <div className="grid grid-cols-2 gap-2">
                          {([['cod', 'Paiement à la livraison'], ['transfer', 'Transfert local']] as const).map(([v, l]) => (
                            <button type="button" key={v} onClick={() => setPaymentMethod(v)} className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition ${paymentMethod === v ? 'border-ink-900 bg-ink-50' : 'border-ink-200 text-ink-500'}`}>{l}</button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
                    style={{ backgroundColor: accent }}
                  >
                    {submitting ? <Spinner className="w-5 h-5" /> : <>
                      {buying.type === 'digital' ? <Download className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                      {buying.type === 'digital' ? 'Confirmer et recevoir' : 'Confirmer la commande'}
                    </>}
                  </button>
                </form>

                {buying.type === 'digital' && buying.file_protected && (
                  <p className="mt-3 text-center text-[11px] text-ink-400 flex items-center justify-center gap-1">
                    <Lock className="w-3 h-3" /> Fichier protégé contre le piratage
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {Toaster}
    </div>
  );
}

function getEffectivePrice(p: ProductRow): number {
  if (p.type === 'digital') {
    if (p.pricing_model === 'free') return 0;
    if (p.pricing_model === 'promo' && p.promo_price != null) return p.promo_price;
    return p.original_price ?? 0;
  }
  return p.sale_price ?? 0;
}

function Input({ label, value, onChange, required, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; required?: boolean; placeholder?: string; type?: string;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        type={type}
        placeholder={placeholder}
        className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm"
      />
    </label>
  );
}
