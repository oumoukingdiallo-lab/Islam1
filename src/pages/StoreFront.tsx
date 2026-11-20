import { useState, useEffect, useMemo } from 'react';
import {
  MapPin, Phone, Package, Download, ShoppingCart, Check, Lock, FileText, Video, CalendarClock, KeyRound, Layers, CreditCard, Loader2,
} from 'lucide-react';
import { supabase, type Store, type ProductRow, type OrderRow } from '@/lib/supabase';
import { formatKz, ANGOLA_CITIES, ANGOLA_PROVINCES } from '@/lib/data';
import { Spinner, useToast, Badge } from '@/lib/ui';
import { navigate } from '@/lib/router';

const DIGITAL_TYPE_ICON: Record<string, typeof FileText> = {
  file: FileText, course: Video, coaching: CalendarClock, license: KeyRound, bundle: Layers,
};

type PayMethod = 'multicaixa_sim' | 'card_sim' | 'cod';

export function StoreFront({ slug }: { slug: string }) {
  const { toast, Toaster } = useToast();
  const [store, setStore] = useState<Store | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'physical' | 'digital'>('all');
  const [buying, setBuying] = useState<ProductRow | null>(null);

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('stores').select('*').eq('slug', slug).maybeSingle();
      if (s) {
        setStore(s as Store);
        const { data: ps } = await supabase.from('products').select('*').eq('store_id', (s as Store).id).eq('is_published', true);
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
        <p className="text-sm text-ink-500 mt-1">Cette boutique n'existe pas ou n'est plus disponible.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {store.announcement_text && (
        <div className="text-center text-sm font-medium py-2 px-4 text-white" style={{ backgroundColor: accent }}>
          {store.announcement_text}
        </div>
      )}

      <div className="h-32 md:h-40" style={{ backgroundColor: accent }}>
        {store.banner_url && <img src={store.banner_url} alt="" className="w-full h-full object-cover" />}
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-10 md:-mt-12 pb-12">
        <div className="bg-white rounded-2xl shadow-card p-5 mb-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white border-4 border-white shadow flex items-center justify-center font-display font-extrabold text-2xl shrink-0" style={{ color: accent }}>
              {store.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full rounded-2xl object-cover" /> : store.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-display font-extrabold text-xl md:text-2xl text-ink-900 truncate">{store.name}</h1>
              {store.tagline && <p className="text-sm text-ink-500 truncate">{store.tagline}</p>}
              <p className="text-xs text-ink-400 mt-0.5">{products.length} produits · Angola 🇦🇴 · Paiement en Kwanza</p>
            </div>
          </div>
        </div>

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
                <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft overflow-hidden hover:shadow-card transition group cursor-pointer" onClick={() => navigate(`/p/${p.slug}`)}>
                  <div className="relative aspect-square overflow-hidden bg-ink-100">
                    {p.square_image_url || p.image_url ? (
                      <img src={p.square_image_url ?? p.image_url ?? ''} alt={p.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
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
                    {p.subtitle && <p className="text-xs text-ink-500 mt-0.5 line-clamp-1">{p.subtitle}</p>}
                    <div className="mt-2 flex items-baseline gap-1.5">
                      {p.type === 'digital' && p.pricing_model === 'promo' && p.original_price && (
                        <span className="text-xs text-ink-400 line-through">{formatKz(p.original_price)}</span>
                      )}
                      <span className="font-display font-bold text-base" style={{ color: accent }}>{price === 0 ? 'Gratuit' : formatKz(price)}</span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); setBuying(p); }}
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

      {buying && (
        <CheckoutModal product={buying} store={store} accent={accent} onClose={() => setBuying(null)} onToast={toast} />
      )}

      {Toaster}
    </div>
  );
}

function CheckoutModal({ product, store, accent, onClose, onToast }: {
  product: ProductRow;
  store: Store;
  accent: string;
  onClose: () => void;
  onToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');
  const [address, setAddress] = useState('');
  const [payMethod, setPayMethod] = useState<PayMethod>('cod');
  const [packQty, setPackQty] = useState(1);
  const [phase, setPhase] = useState<'form' | 'processing' | 'success'>('form');
  const [orderId, setOrderId] = useState('');

  const isPhysical = product.type === 'physical';
  const basePrice = getEffectivePrice(product);
  const packs = product.ai_landing_blocks?.packs ?? [];
  const selectedPack = packs.find((pk) => pk.qty === packQty);
  const subtotal = selectedPack ? selectedPack.price : basePrice * packQty;
  const shippingFee = isPhysical ? store.default_shipping_fee : 0;
  const total = subtotal + shippingFee;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPhase('processing');

    const order: Partial<OrderRow> = {
      store_id: store.id,
      product_id: product.id,
      product_name: product.name,
      product_title: product.name,
      product_type: product.type,
      quantity: packQty,
      variant_label: selectedPack?.label ?? null,
      customer_name: customerName,
      customer_phone: `+244 ${customerPhone}`,
      customer_email: customerEmail || null,
      city: isPhysical ? city : null,
      delivery_city: isPhysical ? city : null,
      delivery_province: isPhysical ? province : null,
      address: isPhysical ? address : null,
      amount: total,
      subtotal_aoa: subtotal,
      shipping_fee_aoa: shippingFee,
      total_aoa: total,
      status: 'pending',
      payment_method: payMethod,
      payment_status_simulated: payMethod === 'cod' ? 'Paiement à la livraison' : 'Simulé - Payé',
    };

    await new Promise((r) => setTimeout(r, 1500));

    const { data, error } = await supabase.from('orders').insert(order).select().maybeSingle();
    if (error) {
      setPhase('form');
      onToast('Erreur lors de la commande', 'error');
      return;
    }
    setOrderId(data?.id ?? '');
    setPhase('success');
    onToast('Commande confirmée avec succès');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
      <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative bg-white w-full md:max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl shadow-pop animate-slide-up md:animate-scale-in">
        {phase === 'success' ? (
          <div className="p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4">
              <Check className="w-7 h-7" />
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900">Commande confirmée !</h3>
            <p className="text-xs text-ink-400 mt-1">Reçu N° {orderId.slice(0, 8).toUpperCase()}</p>
            <div className="bg-ink-50 rounded-xl p-4 mt-4 text-left text-sm">
              <div className="flex justify-between py-1"><span className="text-ink-500">Produit</span><span className="font-semibold text-ink-900">{product.name}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-500">Quantité</span><span className="font-semibold text-ink-900">{packQty}</span></div>
              <div className="flex justify-between py-1"><span className="text-ink-500">Total</span><span className="font-semibold text-ink-900">{formatKz(total)}</span></div>
            </div>
            <p className="text-sm text-ink-500 mt-4">
              {product.type === 'digital' && product.file_url
                ? 'Votre accès est prêt. Cliquez ci-dessous pour télécharger votre fichier.'
                : 'Le vendeur a été notifié et vous contactera bientôt pour la livraison.'}
            </p>
            {product.type === 'digital' && product.file_url && (
              <a
                href={product.file_url}
                download
                className="mt-5 inline-flex items-center gap-2 text-white font-semibold px-5 py-3 rounded-xl transition"
                style={{ backgroundColor: accent }}
              >
                <Download className="w-4 h-4" /> Télécharger le fichier
              </a>
            )}
            {product.type === 'digital' && product.digital_delivery_config?.post_purchase_instructions && (
              <p className="mt-3 text-xs text-ink-500 bg-ink-50 rounded-xl p-3">{product.digital_delivery_config.post_purchase_instructions}</p>
            )}
            <button onClick={onClose} className="block mx-auto mt-4 text-sm font-semibold text-ink-500 hover:text-ink-800">
              Fermer
            </button>
          </div>
        ) : phase === 'processing' ? (
          <div className="p-12 text-center">
            <Loader2 className="w-10 h-10 mx-auto mb-4 animate-spin" style={{ color: accent }} />
            <h3 className="font-display font-bold text-base text-ink-900">Traitement du paiement…</h3>
            <p className="text-sm text-ink-500 mt-2">
              {payMethod === 'cod' ? 'Validation de votre commande…' : payMethod === 'multicaixa_sim' ? 'Connexion à Multicaixa Express (simulation)…' : 'Validation de la carte bancaire (simulation)…'}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-ink-400">
              <Lock className="w-3 h-3" /> Paiement 100% sécurisé (mode simulation)
            </div>
          </div>
        ) : (
          <div className="p-5">
            <h3 className="font-display font-bold text-lg text-ink-900 mb-1">
              {isPhysical ? 'Commander' : 'Obtenir ce produit'}
            </h3>
            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-100">
              {(product.square_image_url || product.image_url) && <img src={product.square_image_url ?? product.image_url ?? ''} alt="" className="w-12 h-12 rounded-lg object-cover" />}
              <div className="flex-1">
                <p className="font-semibold text-sm text-ink-900">{product.name}</p>
                <p className="text-sm font-bold" style={{ color: accent }}>{basePrice === 0 ? 'Gratuit' : formatKz(basePrice)}</p>
              </div>
            </div>

            <form onSubmit={submit} className="space-y-3">
              <Input label="Nom complet" value={customerName} onChange={setCustomerName} required placeholder="Votre nom" />
              <div>
                <label className="block text-xs font-semibold text-ink-600 mb-1.5">Téléphone</label>
                <div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
                  <span className="text-ink-500 font-medium text-sm">🇦🇴 +244</span>
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} required type="tel" placeholder="9XX XXX XXX" className="flex-1 bg-transparent outline-none text-sm" />
                </div>
              </div>

              {isPhysical ? (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Province</label>
                    <select value={province} onChange={(e) => setProvince(e.target.value)} required className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm bg-white">
                      <option value="">Choisir…</option>
                      {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Ville de livraison</label>
                    <select value={city} onChange={(e) => setCity(e.target.value)} required className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm bg-white">
                      <option value="">Choisir…</option>
                      {ANGOLA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ink-600 mb-1.5">Adresse de livraison</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-ink-400" />
                      <textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} placeholder="Quartier, rue, numéro…" className="w-full pl-10 pr-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm resize-none" />
                    </div>
                  </div>

                  {packs.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-ink-600 mb-1.5">Choisir un pack</label>
                      <div className="grid grid-cols-3 gap-2">
                        {packs.map((pk) => (
                          <button type="button" key={pk.qty} onClick={() => setPackQty(pk.qty)} className={`py-2 rounded-xl border-2 text-center transition ${packQty === pk.qty ? 'border-ink-900 bg-ink-50' : 'border-ink-200 text-ink-500'}`}>
                            <p className="text-[10px] font-semibold">{pk.label}</p>
                            <p className="text-xs font-bold mt-0.5">{formatKz(pk.price)}</p>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <Input label="E-mail (pour la livraison)" value={customerEmail} onChange={setCustomerEmail} required type="email" placeholder="vous@exemple.com" />
              )}

              <div>
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Mode de paiement</span>
                <div className="grid grid-cols-1 gap-2">
                  {([['multicaixa_sim', 'Multicaixa Express (Simulation)'], ['card_sim', 'Carte Visa/Mastercard (Simulation)'], ['cod', 'Paiement à la livraison (COD)']] as const).map(([v, l]) => (
                    <button type="button" key={v} onClick={() => setPayMethod(v)} className={`flex items-center gap-2 py-2.5 px-3 rounded-xl border-2 text-xs font-semibold transition ${payMethod === v ? 'border-ink-900 bg-ink-50' : 'border-ink-200 text-ink-500'}`}>
                      <CreditCard className="w-4 h-4" />
                      {l}
                      {payMethod === v && <Check className="w-3.5 h-3.5 ml-auto text-brand-600" />}
                    </button>
                  ))}
                </div>
              </div>

              {isPhysical && (
                <div className="bg-ink-50 rounded-xl p-3 text-sm space-y-1">
                  <div className="flex justify-between"><span className="text-ink-500">Sous-total</span><span className="font-semibold text-ink-900">{formatKz(subtotal)}</span></div>
                  <div className="flex justify-between"><span className="text-ink-500">Livraison</span><span className="font-semibold text-ink-900">{formatKz(shippingFee)}</span></div>
                  <div className="flex justify-between pt-1 border-t border-ink-200"><span className="text-ink-700 font-semibold">Total</span><span className="font-bold text-ink-900">{formatKz(total)}</span></div>
                </div>
              )}

              <button
                type="submit"
                className="w-full text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition"
                style={{ backgroundColor: accent }}
              >
                {isPhysical ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                {isPhysical ? 'Confirmer la commande' : 'Payer et recevoir'}
              </button>
            </form>

            {product.type === 'digital' && product.file_protected && (
              <p className="mt-3 text-center text-[11px] text-ink-400 flex items-center justify-center gap-1">
                <Lock className="w-3 h-3" /> Fichier protégé contre le piratage
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function getEffectivePrice(p: ProductRow): number {
  if (p.type === 'digital') {
    if (p.pricing_model === 'free') return 0;
    if (p.pricing_model === 'promo' && p.promo_price != null) return p.promo_price;
    return p.original_price ?? p.sale_price ?? 0;
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
