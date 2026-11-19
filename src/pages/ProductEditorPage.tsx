import { useState, useEffect, useCallback } from 'react';
import {
  ArrowRight, ArrowLeft, Check, Wand2, Upload, Shield, Plus, X, Sparkles,
  FileText, Video, CalendarClock, KeyRound, Layers, ShoppingBag, Eye, Smartphone, Monitor,
} from 'lucide-react';
import { supabase, type ProductRow, type AiLandingBlocks } from '@/lib/supabase';
import { formatKz, CATEGORIES } from '@/lib/data';
import { Spinner, useToast, Badge } from '@/lib/ui';
import { navigate } from '@/lib/router';
import { useRoute } from '@/lib/router';

const DIGITAL_TYPES = [
  { id: 'file', label: 'Fichier téléchargeable', desc: 'E-book PDF, Guide, Template, Audio, ZIP', icon: FileText, tint: 'bg-blue-50 text-blue-600' },
  { id: 'course', label: 'Formation en ligne', desc: 'Programme par chapitres et leçons', icon: Video, tint: 'bg-violet-50 text-violet-600' },
  { id: 'license', label: 'Licence / Clé d\'accès', desc: 'Code d\'activation ou accès privé', icon: KeyRound, tint: 'bg-rose-50 text-rose-600' },
  { id: 'coaching', label: 'Coaching / Consultation', desc: 'Séance 1-à-1 avec lien de réservation', icon: CalendarClock, tint: 'bg-amber-50 text-amber-600' },
  { id: 'bundle', label: 'Bundle Digital', desc: 'Pack de plusieurs ressources à prix réduit', icon: Layers, tint: 'bg-brand-50 text-brand-600' },
] as const;

const PHYSICAL_STEPS = ['Informations', 'Studio IA', 'Aperçu & Publication'];
const DIGITAL_STEPS = ['Type', 'Détails', 'Description', 'Visuels', 'Livraison & Publication'];

export function ProductEditorPage({ storeId, productId, onDone }: { storeId: string | null; productId?: string; onDone: () => void }) {
  const [route] = useRoute();
  const initialType = (route as { type?: string }).type === 'digital' ? 'digital' : 'physical';
  const { toast, Toaster } = useToast();
  const [mode, setMode] = useState<'physical' | 'digital'>(initialType as 'physical' | 'digital');
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'mobile' | 'desktop'>('desktop');

  // Shared form state
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([{ q: '', a: '' }]);
  const [squareImage, setSquareImage] = useState('');
  const [bannerImage, setBannerImage] = useState('');
  const [gallery, setGallery] = useState<string[]>([]);
  const [ctaText, setCtaText] = useState('');
  const [isPublished, setIsPublished] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  // Physical pricing
  const [costPrice, setCostPrice] = useState(0);
  const [salePrice, setSalePrice] = useState(0);
  const [compareAtPrice, setCompareAtPrice] = useState(0);
  const [stock, setStock] = useState(50);

  // AI landing blocks
  const [aiBlocks, setAiBlocks] = useState<AiLandingBlocks>({});

  // Digital pricing
  const [digitalType, setDigitalType] = useState('');
  const [pricingModel, setPricingModel] = useState<'one_time' | 'promo' | 'free'>('one_time');
  const [originalPrice, setOriginalPrice] = useState(0);
  const [promoPrice, setPromoPrice] = useState(0);
  const [deliveryConfig, setDeliveryConfig] = useState({ file_name: '', access_url: '', post_purchase_instructions: '', watermark: false, hide_sales_count: false });
  const [customFields, setCustomFields] = useState<{ label: string; required: boolean }[]>([]);

  // Load existing product for edit
  const loadProduct = useCallback(async () => {
    if (!productId) return;
    const { data } = await supabase.from('products').select('*').eq('id', productId).maybeSingle();
    if (!data) return;
    const p = data as ProductRow;
    setMode(p.type);
    setName(p.name); setSlug(p.slug ?? ''); setSubtitle(p.subtitle ?? ''); setCategory(p.category ?? '');
    setDescription(p.description ?? ''); setFaq(p.faq?.length ? p.faq : [{ q: '', a: '' }]);
    setSquareImage(p.square_image_url ?? p.image_url ?? ''); setBannerImage(p.banner_image_url ?? p.banner_url ?? '');
    setGallery(p.gallery_urls ?? []); setCtaText(p.cta_text ?? ''); setIsPublished(p.is_published);
    setAiBlocks(p.ai_landing_blocks ?? {});
    if (p.type === 'physical') {
      setCostPrice(p.cost_price_aoa ?? p.supplier_price ?? 0);
      setSalePrice(p.sale_price ?? 0); setCompareAtPrice(p.compare_at_price_aoa ?? 0); setStock(p.stock ?? 50);
    } else {
      setDigitalType(p.digital_type ?? 'file'); setPricingModel(p.pricing_model);
      setOriginalPrice(p.original_price ?? 0); setPromoPrice(p.promo_price ?? 0);
      setDeliveryConfig(p.digital_delivery_config ?? { file_name: '', access_url: '', post_purchase_instructions: '', watermark: false, hide_sales_count: false });
      setCustomFields(p.custom_checkout_fields ?? []);
    }
  }, [productId]);

  useEffect(() => { loadProduct(); }, [loadProduct]);

  // Auto-generate slug from name
  useEffect(() => {
    if (!slug && name) {
      setSlug(name.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + Math.random().toString(36).slice(2, 5));
    }
  }, [name, slug]);

  const uploadFile = async (file: File, kind: 'square' | 'banner' | 'gallery' | 'file') => {
    if (!storeId) return;
    setUploading(kind);
    const ext = file.name.split('.').pop();
    const path = `${storeId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kbiza-assets').upload(path, file, { upsert: true });
    setUploading(null);
    if (error) { toast('Erreur lors du téléversement', 'error'); return; }
    const { data } = supabase.storage.from('kbiza-assets').getPublicUrl(path);
    const url = data.publicUrl;
    if (kind === 'square') setSquareImage(url);
    else if (kind === 'banner') setBannerImage(url);
    else if (kind === 'gallery') setGallery((g) => [...g, url]);
    toast('Fichier téléversé');
  };

  const generateAI = async () => {
    if (!name.trim()) { toast('Saisissez d\'abord le nom du produit', 'error'); return; }
    setAiLoading(true);
    setTimeout(() => {
      if (mode === 'physical') {
        setSubtitle(`La solution parfaite pour votre quotidien — disponible maintenant à ${formatKz(salePrice)}`);
        setDescription(`Le ${name} est le produit tendance plébiscité par les acheteurs angolais. Conçu avec des matériaux premium, il combine élégance, durabilité et performance. Que vous soyez à Luanda, Benguela ou Huambo, profitez d'une livraison rapide et d'un paiement à la livraison.\n\nNe laissez pas cette opportunité passer — stock limité !`);
        setAiBlocks({
          hero_subtitle: `La solution parfaite pour votre quotidien`,
          benefits: [
            { icon: 'check', title: 'Qualité supérieure', text: 'Matériaux premium garantis pour une longue durée de vie' },
            { icon: 'truck', title: 'Livraison rapide Angola', text: 'Livraison à Luanda en 24-48h et dans toutes les provinces en 3-5 jours' },
            { icon: 'shield', title: 'Garantie 30 jours', text: 'Satisfait ou remboursé — votre achat est protégé' },
            { icon: 'wallet', title: 'Paiement à la livraison', text: 'Payez en espèces à la réception — aucun risque pour vous' },
          ],
          specs: [
            { key: 'Matériau', value: 'Premium' },
            { key: 'Garantie', value: '30 jours' },
            { key: 'Livraison', value: '3-5 jours Angola' },
            { key: 'Paiement', value: 'COD ou transfert' },
          ],
          packs: [
            { qty: 1, label: '1 Unité', price: salePrice, discount: 0 },
            { qty: 2, label: '2 Unités (-15%)', price: Math.round(salePrice * 2 * 0.85), discount: 15, badge: 'Le plus populaire' },
            { qty: 3, label: '3 Unités (-25%)', price: Math.round(salePrice * 3 * 0.75), discount: 25, badge: 'Meilleure offre' },
          ],
          reviews: [
            { name: 'João Manuel', city: 'Luanda', rating: 5, text: `Produit excellent, livraison très rapide. Je recommande à 100% !` },
            { name: 'Helena da Silva', city: 'Benguela', rating: 5, text: `Qualité au top, exactement comme sur la photo. Merci Kbizá !` },
            { name: 'Paulo Mendes', city: 'Huambo', rating: 5, text: `Très bon rapport qualité-prix. Paiement à la livraison très pratique.` },
          ],
          guarantee: 'Satisfait ou remboursé sous 30 jours. Votre achat est 100% protégé.',
        });
        setFaq([
          { q: 'Quels sont les délais de livraison ?', a: 'La livraison à Luanda prend 24-48h. Pour les autres provinces (Benguela, Huambo, Lubango...), comptez 3 à 5 jours ouvrables.' },
          { q: 'Comment se passe le paiement ?', a: 'Vous pouvez payer à la livraison (en espèces, en Kwanza) ou par transfert local. Le paiement en ligne (Multicaixa) est également disponible en mode simulation.' },
          { q: 'Le produit est-il garanti ?', a: 'Oui, tous nos produits sont garantis 30 jours. Si vous n'êtes pas satisfait, nous vous remboursons intégralement.' },
        ]);
      } else {
        setDescription(`Découvrez **${name}** — la solution complète conçue pour vous accompagner pas à pas.\n\nCe produit digital premium vous offre un contenu structuré, facile à suivre et immédiatement applicable. Que vous soyez débutant ou déjà avancé, vous y trouverez des stratégies concrètes, des exemples pratiques et des exercices pour progresser rapidement.\n\n**Ce que vous obtenez :**\n• Un accès immédiat après paiement\n• Un format optimisé pour mobile et ordinateur\n• Des mises à jour gratuites à vie\n• Un support disponible par WhatsApp`);
      }
      setAiLoading(false);
      toast('Contenu généré par l\'IA');
    }, 1500);
  };

  const margin = mode === 'physical' ? salePrice - costPrice : salePrice || (pricingModel === 'free' ? 0 : (pricingModel === 'promo' ? promoPrice : originalPrice));
  const marginPct = margin > 0 && salePrice > 0 ? Math.round((margin / salePrice) * 100) : (mode === 'digital' ? 100 : 0);

  const save = async () => {
    if (!storeId || !name.trim()) { toast('Nom requis', 'error'); return; }
    setSaving(true);
    const base: Record<string, unknown> = {
      store_id: storeId, type: mode, name, slug, subtitle, category, description,
      faq: faq.filter((f) => f.q.trim() && f.a.trim()),
      square_image_url: squareImage || null,
      banner_image_url: bannerImage || null,
      gallery_urls: gallery,
      cta_text: ctaText || null,
      is_published: isPublished,
      active: isPublished,
    };
    if (mode === 'physical') {
      Object.assign(base, {
        cost_price_aoa: costPrice, sale_price: salePrice, compare_at_price_aoa: compareAtPrice || null,
        stock, ai_landing_blocks: aiBlocks,
        supplier_price: costPrice, suggested_price: salePrice, image_url: squareImage, trend: 'new', delivery_days: 4,
      });
    } else {
      const dPrice = pricingModel === 'free' ? 0 : pricingModel === 'promo' ? promoPrice : originalPrice;
      Object.assign(base, {
        digital_type: digitalType, pricing_model: pricingModel,
        original_price: pricingModel !== 'free' ? originalPrice : null,
        promo_price: pricingModel === 'promo' ? promoPrice : null,
        sale_price: dPrice,
        file_url: deliveryConfig.access_url || null,
        file_protected: deliveryConfig.watermark,
        digital_delivery_config: deliveryConfig,
        custom_checkout_fields: customFields,
        image_url: squareImage, banner_url: bannerImage,
      });
    }

    let error;
    if (productId) {
      ({ error } = await supabase.from('products').update(base).eq('id', productId));
    } else {
      Object.assign(base, { user_id: (await supabase.auth.getUser()).data.user?.id });
      ({ error } = await supabase.from('products').insert(base));
    }
    setSaving(false);
    if (error) { toast('Erreur lors de la sauvegarde', 'error'); return; }
    toast(isPublished ? 'Produit publié' : 'Produit enregistré');
    onDone();
  };

  const steps = mode === 'physical' ? PHYSICAL_STEPS : DIGITAL_STEPS;
  const canNext = (): boolean => {
    if (mode === 'physical') {
      if (step === 0) return !!name.trim() && salePrice > 0;
      return true;
    }
    if (step === 0) return !!digitalType;
    if (step === 1) return !!name.trim();
    return true;
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate('/produits')} className="p-2 rounded-lg bg-white border border-ink-200 text-ink-500 hover:text-ink-800 transition">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="font-display font-extrabold text-2xl text-ink-900 tracking-tight">{productId ? 'Modifier le produit' : 'Créer un produit'}</h1>
          <p className="text-sm text-ink-500">{mode === 'physical' ? 'Parcours IA Style Shopify / Adafrik' : 'Parcours Digital Style Chariow'}</p>
        </div>
      </div>

      {/* Mode switcher (only for new product) */}
      {!productId && step === 0 && (
        <div className="flex p-1 bg-ink-100 rounded-xl mb-6 max-w-md">
          {([['physical', 'Produit Physique IA', ShoppingBag], ['digital', 'Produit Digital', FileText]] as const).map(([v, l, Icon]) => (
            <button key={v} onClick={() => { setMode(v); setStep(0); }} className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition ${mode === v ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'}`}>
              <Icon className="w-4 h-4" /> {l}
            </button>
          ))}
        </div>
      )}

      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'}`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold mr-2 ${i === step ? 'text-ink-900' : 'text-ink-400'}`}>{s}</span>
            {i < steps.length - 1 && <div className={`w-4 h-0.5 ${i < step ? 'bg-brand-600' : 'bg-ink-200'}`} />}
          </div>
        ))}
      </div>

      {/* ============ PHYSICAL: Step 0 — Informations ============ */}
      {mode === 'physical' && step === 0 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Nom du produit</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Montre Connectée Ultra Sport" className="kbz-input" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Catégorie</span>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="kbz-input bg-white">
                <option value="">Choisir…</option>
                {CATEGORIES.filter((c) => c !== 'Tout').map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Coût / Fournisseur (Kz)</span>
                <input type="number" value={costPrice || ''} onChange={(e) => setCostPrice(Number(e.target.value))} placeholder="18000" className="kbz-input" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Prix de vente (Kz)</span>
                <input type="number" value={salePrice || ''} onChange={(e) => setSalePrice(Number(e.target.value))} placeholder="34900" className="kbz-input" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Prix barré (Kz)</span>
                <input type="number" value={compareAtPrice || ''} onChange={(e) => setCompareAtPrice(Number(e.target.value))} placeholder="45000" className="kbz-input" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Stock</span>
                <input type="number" value={stock} onChange={(e) => setStock(Number(e.target.value))} className="kbz-input" />
              </label>
            </div>
            {salePrice > 0 && (
              <div className="flex items-center gap-3 bg-brand-50 rounded-xl p-3 text-sm">
                <span className="text-ink-600">Marge nette :</span>
                <span className="font-bold text-brand-700">{formatKz(margin)} ({marginPct}%)</span>
              </div>
            )}
          </div>

          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-2">Images du produit</span>
            <div className="grid grid-cols-3 md:grid-cols-4 gap-3">
              <UploadTile label="Vignette" imageUrl={squareImage} uploading={uploading === 'square'} onFile={(f) => uploadFile(f, 'square')} aspect="aspect-square" />
              <UploadTile label="Bannière" imageUrl={bannerImage} uploading={uploading === 'banner'} onFile={(f) => uploadFile(f, 'banner')} aspect="aspect-video col-span-2" />
              {gallery.map((url, i) => (
                <div key={i} className="relative aspect-square rounded-xl overflow-hidden bg-ink-100 group">
                  <img src={url} alt="" className="w-full h-full object-cover" />
                  <button onClick={() => setGallery((g) => g.filter((_, j) => j !== i))} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-ink-900/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition"><X className="w-3.5 h-3.5" /></button>
                </div>
              ))}
              <label className="aspect-square rounded-xl border-2 border-dashed border-ink-200 flex flex-col items-center justify-center cursor-pointer hover:border-brand-400 transition">
                {uploading === 'gallery' ? <Spinner className="w-5 h-5 text-brand-600" /> : <><Upload className="w-5 h-5 text-ink-400 mb-1" /><span className="text-[10px] font-semibold text-ink-500">Galerie</span></>}
                <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadFile(f, 'gallery'); }} />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ============ PHYSICAL: Step 1 — Studio IA ============ */}
      {mode === 'physical' && step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-gradient-to-br from-brand-50 to-violet-50 rounded-2xl p-5 text-center border border-brand-100">
            <Sparkles className="w-8 h-8 text-brand-500 mx-auto mb-2" />
            <h2 className="font-display font-bold text-base text-ink-900 mb-1">Studio de Génération IA</h2>
            <p className="text-sm text-ink-500 mb-4">Générez automatiquement toute la page de vente façon Shopify : titre marketing, bénéfices, caractéristiques, packs, avis et FAQ.</p>
            <button onClick={generateAI} disabled={aiLoading} className="bg-ink-900 hover:bg-ink-800 disabled:opacity-50 text-white font-semibold px-6 py-3 rounded-xl flex items-center gap-2 transition mx-auto shadow-card">
              {aiLoading ? <Spinner className="w-5 h-5" /> : <Wand2 className="w-5 h-5" />}
              {aiLoading ? 'Génération en cours…' : 'Monter toute la page avec l'IA'}
            </button>
          </div>

          {aiBlocks.hero_subtitle != null && (
            <>
              <EditableBlock label="Sous-titre marketing" value={subtitle} onChange={setSubtitle} />
              <EditableBlock label="Description persuasive" value={description} onChange={setDescription} textarea />

              {aiBlocks.benefits && aiBlocks.benefits.length > 0 && (
                <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                  <h3 className="font-semibold text-sm text-ink-900 mb-3">Bénéfices clés</h3>
                  <div className="space-y-2">
                    {aiBlocks.benefits.map((b, i) => (
                      <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-ink-50">
                        <Check className="w-4 h-4 text-brand-600 mt-0.5 shrink-0" />
                        <div><p className="text-sm font-semibold text-ink-800">{b.title}</p><p className="text-xs text-ink-500">{b.text}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiBlocks.packs && aiBlocks.packs.length > 0 && (
                <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                  <h3 className="font-semibold text-sm text-ink-900 mb-3">Packs & Offres quantité</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {aiBlocks.packs.map((pk, i) => (
                      <div key={i} className={`relative rounded-xl border-2 p-3 ${i === 1 ? 'border-brand-500 bg-brand-50' : 'border-ink-200'}`}>
                        {pk.badge && <span className="absolute -top-2 left-1/2 -translate-x-1/2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-brand-600 text-white whitespace-nowrap">{pk.badge}</span>}
                        <p className="text-sm font-semibold text-ink-800 mt-1">{pk.label}</p>
                        <p className="font-display font-bold text-lg text-ink-900 mt-1">{formatKz(pk.price)}</p>
                        {pk.discount > 0 && <p className="text-xs text-brand-600 font-semibold">-{pk.discount}%</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {aiBlocks.reviews && aiBlocks.reviews.length > 0 && (
                <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
                  <h3 className="font-semibold text-sm text-ink-900 mb-3">Avis clients</h3>
                  <div className="space-y-3">
                    {aiBlocks.reviews.map((r, i) => (
                      <div key={i} className="p-3 rounded-xl bg-ink-50">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-7 h-7 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-xs font-bold">{r.name.charAt(0)}</div>
                          <div><p className="text-sm font-semibold text-ink-800">{r.name}</p><p className="text-[10px] text-ink-400">{r.city} · {'★'.repeat(r.rating)}</p></div>
                        </div>
                        <p className="text-xs text-ink-600">{r.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* ============ PHYSICAL: Step 2 — Aperçu & Publication ============ */}
      {mode === 'physical' && step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex items-center gap-2">
            <button onClick={() => setPreviewDevice('desktop')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${previewDevice === 'desktop' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-500'}`}><Monitor className="w-4 h-4 inline mr-1" /> Desktop</button>
            <button onClick={() => setPreviewDevice('mobile')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${previewDevice === 'mobile' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-500'}`}><Smartphone className="w-4 h-4 inline mr-1" /> Mobile</button>
          </div>

          <label className="block">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Texte du bouton d'achat</span>
            <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Commander maintenant — Paiement à la livraison" className="kbz-input" />
          </label>

          <div className={`mx-auto bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden ${previewDevice === 'mobile' ? 'max-w-sm' : 'max-w-2xl'}`}>
            <div className="aspect-video bg-ink-100">{bannerImage && <img src={bannerImage} alt="" className="w-full h-full object-cover" />}</div>
            <div className="p-4">
              <h2 className="font-display font-bold text-lg text-ink-900">{name || 'Nom du produit'}</h2>
              {subtitle && <p className="text-sm text-ink-500 mt-0.5">{subtitle}</p>}
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-display font-bold text-xl text-ink-900">{formatKz(salePrice)}</span>
                {compareAtPrice > 0 && <span className="text-sm text-ink-400 line-through">{formatKz(compareAtPrice)}</span>}
              </div>
              {description && <p className="text-xs text-ink-600 mt-2 whitespace-pre-wrap line-clamp-4">{description}</p>}
              <button className="mt-3 w-full bg-brand-600 text-white font-semibold py-2.5 rounded-xl text-sm">{ctaText || 'Commander maintenant'}</button>
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-ink-200 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm font-semibold text-ink-800">Publier le produit sur ma boutique</span>
          </label>
        </div>
      )}

      {/* ============ DIGITAL: Step 0 — Type ============ */}
      {mode === 'digital' && step === 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-ink-500 mb-3">Choisissez le type de produit digital :</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {DIGITAL_TYPES.map((t) => {
              const Icon = t.icon;
              return (
                <button key={t.id} onClick={() => setDigitalType(t.id)} className={`text-left p-4 rounded-2xl border-2 transition-all ${digitalType === t.id ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${t.tint}`}><Icon className="w-5 h-5" /></div>
                  <p className="font-semibold text-sm text-ink-900">{t.label}</p>
                  <p className="text-xs text-ink-500 mt-0.5">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ============ DIGITAL: Step 1 — Détails ============ */}
      {mode === 'digital' && step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink-600">Titre du produit</span>
              <button onClick={() => { if (name) { setSubtitle(`Le guide ultime pour réussir — accès immédiat`); toast('Titre amélioré'); } else toast('Saisissez d\'abord un titre', 'error'); }} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"><Wand2 className="w-3.5 h-3.5" /> Améliorer avec l'IA</button>
            </div>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Guide complet du dropshipping en Angola" className="kbz-input" />
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Catégorie</span>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="kbz-input bg-white"><option value="">Choisir…</option><option value="E-book">E-book</option><option value="Formation">Formation</option><option value="Coaching">Coaching</option><option value="Licence">Licence</option><option value="Bundle">Bundle</option></select>
          </label>
          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-2">Modèle de tarification (Kwanza)</span>
            <div className="grid grid-cols-3 gap-2">
              {([['one_time', 'Paiement unique'], ['promo', 'Prix promotionnel'], ['free', 'Gratuit']] as const).map(([v, l]) => (
                <button key={v} onClick={() => setPricingModel(v)} className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition ${pricingModel === v ? 'border-ink-900 bg-ink-50 text-ink-900' : 'border-ink-200 text-ink-500'}`}>{l}</button>
              ))}
            </div>
          </div>
          {pricingModel === 'one_time' && <input type="number" value={originalPrice || ''} onChange={(e) => setOriginalPrice(Number(e.target.value))} placeholder="Prix (Kz)" className="kbz-input" />}
          {pricingModel === 'promo' && (
            <div className="grid grid-cols-2 gap-3">
              <input type="number" value={originalPrice || ''} onChange={(e) => setOriginalPrice(Number(e.target.value))} placeholder="Prix barré (Kz)" className="kbz-input" />
              <input type="number" value={promoPrice || ''} onChange={(e) => setPromoPrice(Number(e.target.value))} placeholder="Prix promo (Kz)" className="kbz-input" />
            </div>
          )}
        </div>
      )}

      {/* ============ DIGITAL: Step 2 — Description & FAQ ============ */}
      {mode === 'digital' && step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink-600">Description</span>
              <button onClick={generateAI} disabled={aiLoading} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">{aiLoading ? <Spinner className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />} Rédiger avec l'IA</button>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={7} placeholder="Décrivez votre produit…" className="kbz-input resize-none" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-2">FAQ</span>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <input value={f.q} onChange={(e) => setFaq((p) => p.map((x, j) => j === i ? { ...x, q: e.target.value } : x))} placeholder="Question" className="w-full px-3 py-2 border border-ink-200 rounded-lg outline-none focus:border-brand-500 text-xs font-semibold" />
                    <input value={f.a} onChange={(e) => setFaq((p) => p.map((x, j) => j === i ? { ...x, a: e.target.value } : x))} placeholder="Réponse" className="w-full px-3 py-2 border border-ink-200 rounded-lg outline-none focus:border-brand-500 text-xs" />
                  </div>
                  {faq.length > 1 && <button onClick={() => setFaq((p) => p.filter((_, j) => j !== i))} className="p-2 text-ink-400 hover:text-rose-500"><X className="w-4 h-4" /></button>}
                </div>
              ))}
              <button onClick={() => setFaq((p) => [...p, { q: '', a: '' }])} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter une question</button>
            </div>
          </div>
        </div>
      )}

      {/* ============ DIGITAL: Step 3 — Visuels ============ */}
      {mode === 'digital' && step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4">
            <UploadTile label="Vignette carrée (1:1)" imageUrl={squareImage} uploading={uploading === 'square'} onFile={(f) => uploadFile(f, 'square')} aspect="aspect-square" />
            <UploadTile label="Bannière rectangulaire (2.7:1)" imageUrl={bannerImage} uploading={uploading === 'banner'} onFile={(f) => uploadFile(f, 'banner')} aspect="aspect-[2.7/1]" />
          </div>
        </div>
      )}

      {/* ============ DIGITAL: Step 4 — Livraison & Publication ============ */}
      {mode === 'digital' && step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4">
            <h3 className="font-semibold text-sm text-ink-900">Configuration de la livraison digitale</h3>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Nom du fichier ou ressource</span>
              <input value={deliveryConfig.file_name} onChange={(e) => setDeliveryConfig({ ...deliveryConfig, file_name: e.target.value })} placeholder="Ex: Guide-Dropshipping-Angola.pdf" className="kbz-input" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Lien d'accès (Google Drive, Notion, lien privé…)</span>
              <input value={deliveryConfig.access_url} onChange={(e) => setDeliveryConfig({ ...deliveryConfig, access_url: e.target.value })} placeholder="https://drive.google.com/…" className="kbz-input" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Instructions affichées après achat</span>
              <textarea value={deliveryConfig.post_purchase_instructions} onChange={(e) => setDeliveryConfig({ ...deliveryConfig, post_purchase_instructions: e.target.value })} rows={3} placeholder="Ex: Cliquez sur le bouton ci-dessous pour télécharger votre fichier…" className="kbz-input resize-none" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Texte du bouton d'achat</span>
              <input value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="Télécharger immédiatement" className="kbz-input" />
            </label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={deliveryConfig.watermark} onChange={(e) => setDeliveryConfig({ ...deliveryConfig, watermark: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-ink-700 flex items-center gap-1.5"><Shield className="w-4 h-4 text-brand-600" /> Filigrane anti-piratage (simulé)</span>
              </label>
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" checked={deliveryConfig.hide_sales_count} onChange={(e) => setDeliveryConfig({ ...deliveryConfig, hide_sales_count: e.target.checked })} className="w-4 h-4 accent-brand-600" />
                <span className="text-sm text-ink-700">Masquer le compteur de ventes</span>
              </label>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-ink-900">Champs personnalisés au checkout</h3>
              <button onClick={() => setCustomFields((f) => [...f, { label: '', required: false }])} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Ajouter</button>
            </div>
            <div className="space-y-2">
              {customFields.map((cf, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input value={cf.label} onChange={(e) => setCustomFields((f) => f.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} placeholder="Ex: Votre pseudo Instagram" className="flex-1 px-3 py-2 border border-ink-200 rounded-lg outline-none focus:border-brand-500 text-xs" />
                  <label className="flex items-center gap-1 text-xs text-ink-500"><input type="checkbox" checked={cf.required} onChange={(e) => setCustomFields((f) => f.map((x, j) => j === i ? { ...x, required: e.target.checked } : x))} className="w-3.5 h-3.5 accent-brand-600" /> Requis</label>
                  <button onClick={() => setCustomFields((f) => f.filter((_, j) => j !== i))} className="p-1.5 text-ink-400 hover:text-rose-500"><X className="w-4 h-4" /></button>
                </div>
              ))}
              {customFields.length === 0 && <p className="text-xs text-ink-400">Aucun champ personnalisé. L'acheteur fournira juste son nom, email et téléphone.</p>}
            </div>
          </div>

          <label className="flex items-center gap-3 p-3 bg-white rounded-xl border border-ink-200 cursor-pointer">
            <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="w-4 h-4 accent-brand-600" />
            <span className="text-sm font-semibold text-ink-800">Publier sur ma boutique</span>
          </label>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-100">
        <button onClick={() => step > 0 ? setStep(step - 1) : navigate('/produits')} className="flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800 transition">
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Retour' : 'Précédent'}
        </button>
        {step < steps.length - 1 ? (
          <button onClick={() => canNext() && setStep(step + 1)} disabled={!canNext()} className="flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition">
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button onClick={save} disabled={saving} className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-card">
            {saving ? <Spinner className="w-4 h-4" /> : <Check className="w-4 h-4" />}
            {isPublished ? 'Publier le produit' : 'Enregistrer le brouillon'}
          </button>
        )}
      </div>

      {Toaster}
      <style>{`.kbz-input{width:100%;padding:.75rem;border:1px solid #e2e8f0;border-radius:.75rem;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}.kbz-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgb(16 185 129/.12)}`}</style>
    </div>
  );
}

function UploadTile({ label, imageUrl, uploading, onFile, aspect }: { label: string; imageUrl: string; uploading: boolean; onFile: (f: File) => void; aspect: string }) {
  return (
    <div>
      <span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span>
      <label className={`block ${aspect} border-2 border-dashed border-ink-200 rounded-xl overflow-hidden cursor-pointer hover:border-brand-400 transition group relative`}>
        {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : uploading ? <div className="w-full h-full flex items-center justify-center"><Spinner className="w-6 h-6 text-brand-600" /></div> : <div className="w-full h-full flex flex-col items-center justify-center"><Upload className="w-5 h-5 text-ink-400 group-hover:text-brand-500 mb-1" /><span className="text-[10px] font-semibold text-ink-500">Téléverser</span></div>}
        <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>
    </div>
  );
}

function EditableBlock({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
      <h3 className="font-semibold text-sm text-ink-900 mb-2">{label}</h3>
      {textarea ? <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={5} className="kbz-input resize-none" /> : <input value={value} onChange={(e) => onChange(e.target.value)} className="kbz-input" />}
    </div>
  );
}
