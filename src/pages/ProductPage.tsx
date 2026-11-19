import { useState, useEffect } from 'react';
import {
  Package, FileText, Video, CalendarClock, KeyRound, Layers, Check, ChevronDown, Star,
  Truck, Shield, MapPin, Phone, Download, Lock, Loader2, ShoppingBag, ArrowLeft,
} from 'lucide-react';
import { supabase, type ProductRow, type Store as StoreType, type OrderRow } from '@/lib/supabase';
import { formatKz, ANGOLA_PROVINCES, ANGOLA_CITIES, PAYMENT_LABELS } from '@/lib/data';
import { Spinner, useToast, Badge } from '@/lib/ui';
import { navigate } from '@/lib/router';

const DIGITAL_ICON: Record<string, typeof FileText> = { file: FileText, course: Video, coaching: CalendarClock, license: KeyRound, bundle: Layers };
const PAYMENT_OPTIONS = [
  { id: 'multicaixa_sim', label: 'Multicaixa Express (Simulation)', desc: 'Paiement mobile sécurisé' },
  { id: 'card_sim', label: 'Carte Bancaire (Simulation)', desc: 'Visa / Mastercard' },
  { id: 'cod', label: 'Paiement à la livraison (COD)', desc: 'Espèces à la réception' },
];

export function ProductPage({ slug }: { slug: string }) {
  const { toast, Toaster } = useToast();
  const [product, setProduct] = useState<ProductRow | null>(null);
  const [store, setStore] = useState<StoreType | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paying, setPaying] = useState(false);
  const [success, setSuccess] = useState<{ orderId: string; total: number } | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [selectedPack, setSelectedPack] = useState(0);

  // Form
  const [custName, setCustName] = useState('');
  const [custPhone, setCustPhone] = useState('');
  const [custEmail, setCustEmail] = useState('');
  const [province, setProvince] = useState('');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [payment, setPayment] = useState('multicaixa_sim');
  const [customValues, setCustomValues] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const { data: p } = await supabase.from('products').select('*').eq('slug', slug).maybeSingle();
      if (!p) { setLoading(false); return; }
      const prod = p as ProductRow;
      setProduct(prod);
      if (prod.store_id) {
        const { data: s } = await supabase.from('stores').select('*').eq('id', prod.store_id).maybeSingle();
        if (s) setStore(s as StoreType);
      }
      setLoading(false);
    })();
  }, [slug]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-ink-50"><Spinner className="w-8 h-8 text-brand-600" /></div>;
  if (!product) return <div className="min-h-screen flex flex-col items-center justify-center bg-ink-50"><Package className="w-12 h-12 text-ink-300 mb-3" /><h1 className="font-display font-bold text-xl text-ink-900">Produit introuvable</h1><button onClick={() => navigate('/dashboard')} className="mt-4 text-brand-600 font-semibold">Retour</button></div>;

  const accent = store?.accent_color ?? '#059669';
  const isPhysical = product.type === 'physical';
  const price = isPhysical ? (product.sale_price ?? 0) : (product.pricing_model === 'free' ? 0 : product.pricing_model === 'promo' ? (product.promo_price ?? 0) : (product.original_price ?? 0));
  const blocks = product.ai_landing_blocks ?? {};
  const packs = blocks.packs ?? [];
  const effectivePack = packs[selectedPack];
  const subtotal = effectivePack ? effectivePack.price : price;
  const shippingFee = isPhysical ? (store?.default_shipping_fee ?? 2500) : 0;
  const total = isPhysical ? subtotal + shippingFee : subtotal;

  const submitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaying(true);
    await new Promise((r) => setTimeout(r, 1500));
    const orderId = 'CMD-' + Date.now().toString(36).toUpperCase().slice(-6);
    const order: Partial<OrderRow> = {
      store_id: product.store_id, product_id: product.id,
      product_name: product.name, product_title: product.name,
      product_type: product.type,
      quantity: effectivePack?.qty ?? 1,
      variant_label: effectivePack?.label ?? null,
      customer_name: custName, customer_phone: `+244 ${custPhone}`, customer_email: custEmail || null,
      delivery_city: isPhysical ? city : null, delivery_province: isPhysical ? province : null,
      address: isPhysical ? address : null,
      subtotal_aoa: subtotal, shipping_fee_aoa: shippingFee, total_aoa: total,
      amount: total, status: 'pending',
      payment_method: payment as OrderRow['payment_method'],
      payment_status_simulated: payment === 'cod' ? 'Paiement à la livraison' : 'Simulé - Payé',
    };
    const { error } = await supabase.from('orders').insert(order);
    setPaying(false);
    if (error) { toast('Erreur lors de la commande', 'error'); return; }
    setSuccess({ orderId, total });
    toast('Commande confirmée');
  };

  if (success) {
    return (
      <div className="min-h-screen bg-ink-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-card p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-16 h-16 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center mx-auto mb-4"><Check className="w-8 h-8" /></div>
          <h1 className="font-display font-bold text-xl text-ink-900">Commande confirmée !</h1>
          <p className="text-sm text-ink-500 mt-2">Reçu N° <strong className="text-ink-900">{success.orderId}</strong></p>
          <div className="bg-ink-50 rounded-xl p-4 mt-5 text-left space-y-2">
            <Row label="Produit" value={product.name} />
            <Row label="Quantité" value={`${effectivePack?.qty ?? 1} × ${effectivePack?.label ?? 'Unité'}`} />
            {isPhysical && <><Row label="Livraison" value={`${city}, ${province}`} /><Row label="Frais de livraison" value={formatKz(shippingFee)} /></>}
            <Row label="Mode de paiement" value={PAYMENT_LABELS[payment] ?? payment} />
            <div className="border-t border-ink-200 pt-2 mt-2"><Row label="Total payé" value={formatKz(success.total)} bold /></div>
          </div>
          {!isPhysical && product.digital_delivery_config && (
            <div className="bg-brand-50 rounded-xl p-4 mt-4 text-left">
              <p className="text-sm font-semibold text-brand-700 mb-2 flex items-center gap-1.5"><Download className="w-4 h-4" /> Accès à votre produit</p>
              {product.digital_delivery_config.access_url && (
                <a href={product.digital_delivery_config.access_url} target="_blank" rel="noopener" className="block w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm text-center transition">Télécharger / Accéder</a>
              )}
              {product.digital_delivery_config.post_purchase_instructions && <p className="text-xs text-ink-600 mt-2">{product.digital_delivery_config.post_purchase_instructions}</p>}
              {product.digital_delivery_config.watermark && <p className="text-[11px] text-ink-400 mt-2 flex items-center gap-1"><Lock className="w-3 h-3" /> Fichier protégé contre le piratage</p>}
            </div>
          )}
          <button onClick={() => navigate(`/s/${store?.slug ?? ''}`)} className="mt-5 w-full bg-ink-100 hover:bg-ink-200 text-ink-700 font-semibold py-2.5 rounded-xl text-sm transition">Retour à la boutique</button>
        </div>
        {Toaster}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Header bar */}
      <div className="bg-white border-b border-ink-100 sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <button onClick={() => navigate(`/s/${store?.slug ?? ''}`)} className="flex items-center gap-1.5 text-sm font-semibold text-ink-600 hover:text-ink-900"><ArrowLeft className="w-4 h-4" /> Retour</button>
          {store && <div className="flex items-center gap-2"><span className="font-display font-bold text-sm text-ink-900">{store.name}</span></div>}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {isPhysical ? (
          /* ===== PHYSICAL PAGE (Shopify style) ===== */
          <div className="grid lg:grid-cols-2 gap-6 md:gap-8">
            {/* Gallery */}
            <div>
              <div className="aspect-square rounded-2xl overflow-hidden bg-ink-100 shadow-soft mb-3">
                {product.square_image_url ? <img src={product.square_image_url} alt={product.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><ShoppingBag className="w-12 h-12 text-ink-300" /></div>}
              </div>
              <div className="grid grid-cols-4 gap-2">
                {(product.gallery_urls ?? []).map((url, i) => (
                  <div key={i} className="aspect-square rounded-lg overflow-hidden bg-ink-100"><img src={url} alt="" className="w-full h-full object-cover" /></div>
                ))}
              </div>
            </div>

            {/* Info */}
            <div>
              {product.compare_at_price_aoa && product.compare_at_price_aoa > price && (
                <Badge className="bg-rose-100 text-rose-700 ring-rose-200 mb-2">-{Math.round(((product.compare_at_price_aoa - price) / product.compare_at_price_aoa) * 100)}% Promo</Badge>
              )}
              <h1 className="font-display font-extrabold text-2xl text-ink-900">{product.name}</h1>
              {product.subtitle && <p className="text-sm text-ink-500 mt-1">{product.subtitle}</p>}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="font-display font-bold text-3xl" style={{ color: accent }}>{formatKz(price)}</span>
                {product.compare_at_price_aoa && <span className="text-lg text-ink-400 line-through">{formatKz(product.compare_at_price_aoa)}</span>}
              </div>

              {/* Packs */}
              {packs.length > 0 && (
                <div className="mt-5 space-y-2">
                  <p className="text-sm font-semibold text-ink-700">Choisissez votre pack :</p>
                  {packs.map((pk, i) => (
                    <button key={i} onClick={() => setSelectedPack(i)} className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition text-left ${selectedPack === i ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                      <div className="flex items-center gap-2">
                        <div className={`w-4 h-4 rounded-full border-2 ${selectedPack === i ? 'border-brand-600 bg-brand-600' : 'border-ink-300'}`} />
                        <div><p className="text-sm font-semibold text-ink-900">{pk.label}{pk.badge && <span className="ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-brand-600 text-white">{pk.badge}</span>}</p></div>
                      </div>
                      <span className="font-bold text-sm text-ink-900">{formatKz(pk.price)}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Benefits */}
              {blocks.benefits && blocks.benefits.length > 0 && (
                <div className="mt-6 space-y-2">
                  {blocks.benefits.map((b, i) => (
                    <div key={i} className="flex items-start gap-2"><Check className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" /><div><p className="text-sm font-semibold text-ink-800">{b.title}</p><p className="text-xs text-ink-500">{b.text}</p></div></div>
                  ))}
                </div>
              )}

              <button onClick={() => setShowCheckout(true)} className="mt-6 w-full text-white font-semibold py-3.5 rounded-xl text-base transition shadow-card flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                <ShoppingBag className="w-5 h-5" /> {product.cta_text ?? 'Commander maintenant'}
              </button>

              <div className="mt-3 flex items-center justify-center gap-4 text-xs text-ink-500">
                <span className="flex items-center gap-1"><Truck className="w-4 h-4" /> Livraison {product.delivery_days ?? 4}j</span>
                <span className="flex items-center gap-1"><Shield className="w-4 h-4" /> Garantie 30j</span>
              </div>
            </div>

            {/* Description + specs + reviews + faq */}
            {product.description && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <h2 className="font-display font-bold text-base text-ink-900 mb-3">Description</h2>
                <p className="text-sm text-ink-600 whitespace-pre-wrap leading-relaxed">{product.description}</p>
              </div>
            )}
            {blocks.specs && blocks.specs.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <h2 className="font-display font-bold text-base text-ink-900 mb-3">Caractéristiques</h2>
                <div className="grid sm:grid-cols-2 gap-2">{blocks.specs.map((s, i) => <div key={i} className="flex justify-between text-sm py-2 border-b border-ink-50"><span className="text-ink-500">{s.key}</span><span className="font-semibold text-ink-900">{s.value}</span></div>)}</div>
              </div>
            )}
            {blocks.reviews && blocks.reviews.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <h2 className="font-display font-bold text-base text-ink-900 mb-3">Avis clients</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  {blocks.reviews.map((r, i) => (
                    <div key={i} className="p-3 rounded-xl bg-ink-50">
                      <div className="flex items-center gap-2 mb-1"><div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{r.name.charAt(0)}</div><div><p className="text-sm font-semibold text-ink-800">{r.name}</p><p className="text-[10px] text-ink-400">{r.city} · {'★'.repeat(r.rating)}</p></div></div>
                      <p className="text-xs text-ink-600">{r.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {product.faq && product.faq.length > 0 && (
              <div className="lg:col-span-2 bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                <h2 className="font-display font-bold text-base text-ink-900 mb-3">FAQ</h2>
                <div className="space-y-2">
                  {product.faq.map((f, i) => (
                    <div key={i} className="border-b border-ink-50 last:border-0">
                      <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-3 text-left"><span className="text-sm font-semibold text-ink-800">{f.q}</span><ChevronDown className={`w-4 h-4 text-ink-400 transition ${openFaq === i ? 'rotate-180' : ''}`} /></button>
                      {openFaq === i && <p className="text-sm text-ink-600 pb-3">{f.a}</p>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          /* ===== DIGITAL PAGE (Chariow style) ===== */
          <div className="max-w-3xl mx-auto">
            {product.banner_image_url && <div className="aspect-[2.7/1] rounded-2xl overflow-hidden bg-ink-100 mb-4"><img src={product.banner_image_url} alt="" className="w-full h-full object-cover" /></div>}
            <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 md:p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 rounded-2xl overflow-hidden bg-ink-100 shrink-0">{product.square_image_url ? <img src={product.square_image_url} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center">{(() => { const I = DIGITAL_ICON[product.digital_type ?? 'file'] ?? FileText; return <I className="w-8 h-8 text-ink-300" />; })()}</div>}</div>
                <div className="flex-1">
                  <Badge className="bg-violet-100 text-violet-700 ring-violet-200 mb-1">{(() => { const I = DIGITAL_ICON[product.digital_type ?? 'file'] ?? FileText; return <><I className="w-3 h-3" /> {({ file: 'Fichier', course: 'Formation', license: 'Licence', coaching: 'Coaching', bundle: 'Bundle' } as Record<string, string>)[product.digital_type ?? 'file']}</>; })()}</Badge>
                  <h1 className="font-display font-extrabold text-xl md:text-2xl text-ink-900">{product.name}</h1>
                  {product.subtitle && <p className="text-sm text-ink-500 mt-0.5">{product.subtitle}</p>}
                  <p className="font-display font-bold text-2xl mt-2" style={{ color: accent }}>{price === 0 ? 'Gratuit' : formatKz(price)}</p>
                </div>
              </div>

              {product.description && <div className="mt-5"><h2 className="font-display font-bold text-base text-ink-900 mb-2">Description</h2><p className="text-sm text-ink-600 whitespace-pre-wrap leading-relaxed">{product.description}</p></div>}

              {product.faq && product.faq.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-display font-bold text-base text-ink-900 mb-3">Questions fréquentes</h2>
                  <div className="space-y-2">
                    {product.faq.map((f, i) => (
                      <div key={i} className="border-b border-ink-50 last:border-0">
                        <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between py-3 text-left"><span className="text-sm font-semibold text-ink-800">{f.q}</span><ChevronDown className={`w-4 h-4 text-ink-400 transition ${openFaq === i ? 'rotate-180' : ''}`} /></button>
                        {openFaq === i && <p className="text-sm text-ink-600 pb-3">{f.a}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button onClick={() => setShowCheckout(true)} className="mt-6 w-full text-white font-semibold py-3.5 rounded-xl text-base transition shadow-card flex items-center justify-center gap-2" style={{ backgroundColor: accent }}>
                <Download className="w-5 h-5" /> {product.cta_text ?? 'Obtenir maintenant'}
              </button>
              {!product.digital_delivery_config?.hide_sales_count && product.sales_count > 0 && <p className="text-center text-xs text-ink-400 mt-2">{product.sales_count} ventes déjà réalisées</p>}
            </div>
          </div>
        )}
      </div>

      {/* Checkout drawer */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center">
          <div className="absolute inset-0 bg-ink-900/40 backdrop-blur-sm" onClick={() => !paying && setShowCheckout(false)} />
          <div className="relative bg-white w-full md:max-w-md max-h-[92vh] overflow-y-auto no-scrollbar rounded-t-3xl md:rounded-3xl shadow-pop animate-slide-up">
            {paying ? (
              <div className="p-10 text-center">
                <Loader2 className="w-10 h-10 animate-spin mx-auto mb-4" style={{ color: accent }} />
                <h3 className="font-display font-bold text-base text-ink-900">Traitement du paiement…</h3>
                <p className="text-sm text-ink-500 mt-1">{PAYMENT_LABELS[payment]} — Simulation</p>
              </div>
            ) : (
              <div className="p-5">
                <h3 className="font-display font-bold text-lg text-ink-900 mb-3">{isPhysical ? 'Commander' : 'Obtenir ce produit'}</h3>
                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-ink-100">
                  {product.square_image_url && <img src={product.square_image_url} alt="" className="w-12 h-12 rounded-lg object-cover" />}
                  <div className="flex-1"><p className="font-semibold text-sm text-ink-900">{product.name}</p><p className="text-sm font-bold" style={{ color: accent }}>{formatKz(subtotal)}</p></div>
                </div>
                <form onSubmit={submitOrder} className="space-y-3">
                  <Input label="Nom complet" value={custName} onChange={setCustName} required />
                  <PhoneInput value={custPhone} onChange={setCustPhone} required />
                  {!isPhysical && <Input label="Email" value={custEmail} onChange={setCustEmail} required type="email" />}
                  {product.custom_checkout_fields?.map((cf, i) => (
                    <Input key={i} label={cf.label} value={customValues[cf.label] ?? ''} onChange={(v) => setCustomValues({ ...customValues, [cf.label]: v })} required={cf.required} />
                  ))}
                  {isPhysical && (
                    <>
                      <Select label="Province" value={province} onChange={setProvince} options={ANGOLA_PROVINCES} required />
                      <Select label="Ville" value={city} onChange={setCity} options={ANGOLA_CITIES} required />
                      <div><label className="block text-xs font-semibold text-ink-600 mb-1.5">Adresse de livraison</label><textarea value={address} onChange={(e) => setAddress(e.target.value)} required rows={2} placeholder="Quartier, rue, numéro…" className="kbz-input resize-none" /></div>
                    </>
                  )}
                  <div>
                    <span className="block text-xs font-semibold text-ink-600 mb-2">Mode de paiement</span>
                    <div className="space-y-2">
                      {PAYMENT_OPTIONS.map((opt) => (
                        <button type="button" key={opt.id} onClick={() => setPayment(opt.id)} className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 transition text-left ${payment === opt.id ? 'border-ink-900 bg-ink-50' : 'border-ink-200'}`}>
                          <div className={`w-4 h-4 rounded-full border-2 ${payment === opt.id ? 'border-ink-900 bg-ink-900' : 'border-ink-300'}`} />
                          <div><p className="text-sm font-semibold text-ink-800">{opt.label}</p><p className="text-xs text-ink-400">{opt.desc}</p></div>
                        </button>
                      ))}
                    </div>
                  </div>
                  {isPhysical && <div className="flex justify-between text-sm text-ink-500"><span>Frais de livraison</span><span>{formatKz(shippingFee)}</span></div>}
                  <div className="flex justify-between text-base font-bold text-ink-900 border-t border-ink-100 pt-3"><span>Total</span><span>{formatKz(total)}</span></div>
                  <button type="submit" className="w-full text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition" style={{ backgroundColor: accent }}>
                    <Check className="w-4 h-4" /> {payment === 'cod' ? 'Confirmer la commande' : 'Payer maintenant (Simulation)'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
      {Toaster}
      <style>{`.kbz-input{width:100%;padding:.75rem;border:1px solid #e2e8f0;border-radius:.75rem;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}.kbz-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgb(16 185 129/.12)}`}</style>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return <div className="flex justify-between text-sm"><span className="text-ink-500">{label}</span><span className={bold ? "font-bold text-ink-900" : "font-semibold text-ink-700"}>{value}</span></div>;
}
function Input({ label, value, onChange, required, type = 'text' }: { label: string; value: string; onChange: (v: string) => void; required?: boolean; type?: string }) {
  return <label className="block"><span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span><input value={value} onChange={(e) => onChange(e.target.value)} required={required} type={type} className="kbz-input" /></label>;
}
function Select({ label, value, onChange, options, required }: { label: string; value: string; onChange: (v: string) => void; options: string[]; required?: boolean }) {
  return <label className="block"><span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span><select value={value} onChange={(e) => onChange(e.target.value)} required={required} className="kbz-input bg-white"><option value="">Choisir…</option>{options.map((o) => <option key={o} value={o}>{o}</option>)}</select></label>;
}
function PhoneInput({ value, onChange, required }: { value: string; onChange: (v: string) => void; required?: boolean }) {
  return <div><label className="block text-xs font-semibold text-ink-600 mb-1.5">Téléphone</label><div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100"><span className="text-ink-500 font-medium text-sm">🇦🇴 +244</span><input value={value} onChange={(e) => onChange(e.target.value)} required={required} type="tel" placeholder="9XX XXX XXX" className="flex-1 bg-transparent outline-none text-sm" /></div></div>;
}
