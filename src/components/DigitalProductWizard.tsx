import { useState } from 'react';
import {
  FileText, Video, CalendarClock, KeyRound, Layers, ArrowRight, ArrowLeft, Check,
  Sparkles, Upload, Shield, Wand2, Plus, X,
} from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Spinner, useToast } from '@/lib/ui';
import { supabase } from '@/lib/supabase';

const DIGITAL_TYPES = [
  { id: 'file', label: 'Fichiers téléchargeables', desc: 'E-books PDF, templates, guides, audios MP3, archives ZIP', icon: FileText, tint: 'bg-blue-50 text-blue-600' },
  { id: 'course', label: 'Formations en ligne', desc: 'Parcours structuré par chapitres/leçons vidéo et texte', icon: Video, tint: 'bg-violet-50 text-violet-600' },
  { id: 'coaching', label: 'Coaching / Consultation', desc: 'Séances individuelles ou de groupe avec lien de réservation', icon: CalendarClock, tint: 'bg-amber-50 text-amber-600' },
  { id: 'license', label: 'Licences & Clés d’accès', desc: 'Vente de clés d’activation ou accès privés', icon: KeyRound, tint: 'bg-rose-50 text-rose-600' },
  { id: 'bundle', label: 'Bundles (Packs)', desc: 'Regroupement de plusieurs produits avec réduction', icon: Layers, tint: 'bg-brand-50 text-brand-600' },
] as const;

const STEPS = ['Type', 'Détails', 'Description', 'Visuel', 'Contenu', 'Publication'];

export function DigitalProductWizard({
  open,
  onClose,
  storeId,
  onCreated,
}: {
  open: boolean;
  onClose: () => void;
  storeId: string | null;
  onCreated: () => void;
}) {
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  // Form state
  const [digitalType, setDigitalType] = useState<string>('');
  const [name, setName] = useState('');
  const [pricingModel, setPricingModel] = useState<'one_time' | 'promo' | 'free'>('one_time');
  const [originalPrice, setOriginalPrice] = useState<number>(0);
  const [promoPrice, setPromoPrice] = useState<number>(0);
  const [description, setDescription] = useState('');
  const [faq, setFaq] = useState<{ q: string; a: string }[]>([{ q: '', a: '' }]);
  const [imageUrl, setImageUrl] = useState<string>('');
  const [bannerUrl, setBannerUrl] = useState<string>('');
  const [fileUrl, setFileUrl] = useState<string>('');
  const [fileProtected, setFileProtected] = useState(false);
  const [uploading, setUploading] = useState<string | null>(null);

  const reset = () => {
    setStep(0); setDigitalType(''); setName(''); setPricingModel('one_time');
    setOriginalPrice(0); setPromoPrice(0); setDescription(''); setFaq([{ q: '', a: '' }]);
    setImageUrl(''); setBannerUrl(''); setFileUrl(''); setFileProtected(false);
  };

  const close = () => { reset(); onClose(); };

  const canNext = (): boolean => {
    if (step === 0) return !!digitalType;
    if (step === 1) return !!name.trim() && (pricingModel === 'free' || originalPrice > 0);
    if (step === 4) return true; // fichier optionnel
    return true;
  };

  const uploadFile = async (file: File, kind: 'image' | 'banner' | 'file') => {
    if (!storeId) return;
    setUploading(kind);
    const ext = file.name.split('.').pop();
    const path = `${storeId}/${kind}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kbiza-assets').upload(path, file, { upsert: true });
    setUploading(null);
    if (error) {
      toast('Erreur lors du téléversement', 'error');
      return;
    }
    const { data } = supabase.storage.from('kbiza-assets').getPublicUrl(path);
    const url = data.publicUrl;
    if (kind === 'image') setImageUrl(url);
    else if (kind === 'banner') setBannerUrl(url);
    else setFileUrl(url);
    toast('Fichier téléversé avec succès');
  };

  const generateAI = async () => {
    if (!name.trim()) {
      toast('Saisissez d’abord le nom du produit', 'error');
      return;
    }
    setAiLoading(true);
    setTimeout(() => {
      const generated = `Découvrez **${name}** — la solution complète conçue pour vous accompagner pas à pas.\n\nCe produit digital premium vous offre un contenu structuré, facile à suivre et immédiatement applicable. Que vous soyez débutant ou déjà avancé, vous y trouverez des stratégies concrètes, des exemples pratiques et des exercices pour progresser rapidement.\n\n**Ce que vous obtenez :**\n• Un accès immédiat après paiement\n• Un format optimisé pour mobile et ordinateur\n• Des mises à jour gratuites à vie\n• Un support disponible par WhatsApp\n\nNe laissez plus l’occasion passer. Investissez dans votre réussite dès aujourd’hui avec ${name}.`;
      setDescription(generated);
      setAiLoading(false);
      toast('Description générée par l’IA');
    }, 1400);
  };

  const publish = async () => {
    if (!storeId) { toast('Boutique introuvable', 'error'); return; }
    setSaving(true);
    const price = pricingModel === 'free' ? 0 : pricingModel === 'promo' ? promoPrice : originalPrice;
    const { error } = await supabase.from('products').insert({
      store_id: storeId,
      type: 'digital',
      name,
      description,
      image_url: imageUrl || null,
      banner_url: bannerUrl || null,
      active: true,
      digital_type: digitalType as 'file' | 'course' | 'coaching' | 'license' | 'bundle',
      pricing_model: pricingModel,
      original_price: pricingModel !== 'free' ? originalPrice : null,
      promo_price: pricingModel === 'promo' ? promoPrice : null,
      sale_price: price,
      file_url: fileUrl || null,
      file_protected: fileProtected,
      faq: faq.filter((f) => f.q.trim() && f.a.trim()),
      category: 'Digital',
    });
    setSaving(false);
    if (error) {
      toast('Erreur lors de la publication', 'error');
      return;
    }
    toast('Produit digital publié dans votre boutique');
    onCreated();
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Créer un produit digital" size="lg">
      {/* Stepper */}
      <div className="flex items-center gap-1 mb-6 overflow-x-auto no-scrollbar">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-1 shrink-0">
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition ${
              i < step ? 'bg-brand-600 text-white' : i === step ? 'bg-ink-900 text-white' : 'bg-ink-100 text-ink-400'
            }`}>
              {i < step ? <Check className="w-3.5 h-3.5" /> : i + 1}
            </div>
            <span className={`text-xs font-semibold mr-2 ${i === step ? 'text-ink-900' : 'text-ink-400'}`}>{s}</span>
            {i < STEPS.length - 1 && <div className={`w-4 h-0.5 ${i < step ? 'bg-brand-600' : 'bg-ink-200'}`} />}
          </div>
        ))}
      </div>

      {/* Step 0: Type */}
      {step === 0 && (
        <div className="space-y-3 animate-fade-in">
          <p className="text-sm text-ink-500 mb-3">Choisissez le type de produit digital que vous souhaitez créer :</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {DIGITAL_TYPES.map((t) => {
              const Icon = t.icon;
              const selected = digitalType === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setDigitalType(t.id)}
                  className={`text-left p-4 rounded-2xl border-2 transition-all ${selected ? 'border-brand-500 bg-brand-50' : 'border-ink-200 hover:border-ink-300'}`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${t.tint}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <p className="font-semibold text-sm text-ink-900">{t.label}</p>
                  <p className="text-xs text-ink-500 mt-0.5 leading-relaxed">{t.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Step 1: Détails & Tarification */}
      {step === 1 && (
        <div className="space-y-4 animate-fade-in">
          <label className="block">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Nom du produit digital</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Guide complet du dropshipping en Angola"
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm"
            />
          </label>

          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-2">Modèle de tarification (en Kwanza)</span>
            <div className="grid grid-cols-3 gap-2">
              {([['one_time', 'Paiement unique'], ['promo', 'Prix promotionnel'], ['free', 'Gratuit']] as const).map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setPricingModel(v)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-semibold transition ${pricingModel === v ? 'border-ink-900 bg-ink-50 text-ink-900' : 'border-ink-200 text-ink-500'}`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {pricingModel === 'one_time' && (
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Prix de vente (Kz)</span>
              <input type="number" value={originalPrice || ''} onChange={(e) => setOriginalPrice(Number(e.target.value))} placeholder="15000" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm" />
            </label>
          )}

          {pricingModel === 'promo' && (
            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Prix barré (Kz)</span>
                <input type="number" value={originalPrice || ''} onChange={(e) => setOriginalPrice(Number(e.target.value))} placeholder="20000" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm" />
              </label>
              <label className="block">
                <span className="block text-xs font-semibold text-ink-600 mb-1.5">Prix promo (Kz)</span>
                <input type="number" value={promoPrice || ''} onChange={(e) => setPromoPrice(Number(e.target.value))} placeholder="12000" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm" />
              </label>
            </div>
          )}

          {pricingModel === 'free' && (
            <div className="bg-brand-50 rounded-xl p-3 text-sm text-brand-700 font-medium">
              Ce produit sera proposé gratuitement. Idéal pour construire votre liste de contacts.
            </div>
          )}
        </div>
      )}

      {/* Step 2: Description & FAQ */}
      {step === 2 && (
        <div className="space-y-4 animate-fade-in">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-ink-600">Description détaillée</span>
              <button onClick={generateAI} disabled={aiLoading} className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:text-brand-700 disabled:opacity-50">
                {aiLoading ? <Spinner className="w-3.5 h-3.5" /> : <Wand2 className="w-3.5 h-3.5" />}
                Générer avec l’IA
              </button>
            </div>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={7}
              placeholder="Décrivez votre produit, ses bénéfices, ce que le client obtient…"
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm resize-none"
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-2">FAQ — Foire Aux Questions</span>
            <div className="space-y-2">
              {faq.map((f, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <input
                      value={f.q}
                      onChange={(e) => setFaq((prev) => prev.map((x, j) => j === i ? { ...x, q: e.target.value } : x))}
                      placeholder="Question"
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg outline-none focus:border-brand-500 text-xs font-semibold"
                    />
                    <input
                      value={f.a}
                      onChange={(e) => setFaq((prev) => prev.map((x, j) => j === i ? { ...x, a: e.target.value } : x))}
                      placeholder="Réponse"
                      className="w-full px-3 py-2 border border-ink-200 rounded-lg outline-none focus:border-brand-500 text-xs"
                    />
                  </div>
                  {faq.length > 1 && (
                    <button onClick={() => setFaq((prev) => prev.filter((_, j) => j !== i))} className="p-2 text-ink-400 hover:text-rose-500">
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
              <button onClick={() => setFaq((prev) => [...prev, { q: '', a: '' }])} className="text-xs font-semibold text-brand-600 hover:underline flex items-center gap-1">
                <Plus className="w-3.5 h-3.5" /> Ajouter une question
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Step 3: Visuel */}
      {step === 3 && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid sm:grid-cols-2 gap-4">
            <UploadZone
              label="Vignette carrée (couverture)"
              hint="PNG ou JPG, format carré"
              imageUrl={imageUrl}
              uploading={uploading === 'image'}
              onFile={(f) => uploadFile(f, 'image')}
              aspect="aspect-square"
            />
            <UploadZone
              label="Bannière rectangulaire (en-tête)"
              hint="PNG ou JPG, format 16:9"
              imageUrl={bannerUrl}
              uploading={uploading === 'banner'}
              onFile={(f) => uploadFile(f, 'banner')}
              aspect="aspect-video"
            />
          </div>
        </div>
      )}

      {/* Step 4: Contenu & Livraison */}
      {step === 4 && (
        <div className="space-y-4 animate-fade-in">
          <UploadZone
            label="Fichier numérique à vendre"
            hint="PDF, MP3, ZIP, vidéo… Le fichier sera livré automatiquement après paiement."
            imageUrl={null}
            fileUrl={fileUrl}
            uploading={uploading === 'file'}
            onFile={(f) => uploadFile(f, 'file')}
            aspect=""
            showFileName
          />

          <label className="flex items-start gap-3 p-3 bg-ink-50 rounded-xl cursor-pointer">
            <input type="checkbox" checked={fileProtected} onChange={(e) => setFileProtected(e.target.checked)} className="mt-0.5 w-4 h-4 accent-brand-600" />
            <div>
              <p className="text-sm font-semibold text-ink-800 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-brand-600" /> Protection anti-piratage
              </p>
              <p className="text-xs text-ink-500 mt-0.5">Active un filigrane numérique et limite le partage du fichier. Livraison instantanée après confirmation du paiement.</p>
            </div>
          </label>
        </div>
      )}

      {/* Step 5: Publication */}
      {step === 5 && (
        <div className="space-y-4 animate-fade-in">
          <div className="bg-brand-50 rounded-2xl p-5 text-center">
            <div className="w-12 h-12 rounded-full bg-brand-600 text-white flex items-center justify-center mx-auto mb-3">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-display font-bold text-base text-ink-900">Prêt à publier ?</h3>
            <p className="text-sm text-ink-600 mt-1">Votre produit digital sera immédiatement visible dans votre boutique avec un badge « Produit Digital ».</p>
          </div>

          <div className="bg-white border border-ink-200 rounded-xl p-4 space-y-2 text-sm">
            <Row label="Type" value={DIGITAL_TYPES.find((t) => t.id === digitalType)?.label ?? '—'} />
            <Row label="Nom" value={name || '—'} />
            <Row label="Tarification" value={pricingModel === 'free' ? 'Gratuit' : pricingModel === 'promo' ? `${originalPrice} Kz → ${promoPrice} Kz` : `${originalPrice} Kz`} />
            <Row label="Description" value={description ? `${description.length} caractères` : 'Vide'} />
            <Row label="FAQ" value={`${faq.filter((f) => f.q.trim()).length} question(s)`} />
            <Row label="Vignette" value={imageUrl ? 'Téléversée' : 'Aucune'} />
            <Row label="Fichier" value={fileUrl ? 'Téléversé' : 'Aucun (livraison manuelle)'} />
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6 pt-4 border-t border-ink-100">
        <button
          onClick={() => step > 0 ? setStep(step - 1) : close()}
          className="flex items-center gap-1.5 text-sm font-semibold text-ink-500 hover:text-ink-800 transition"
        >
          <ArrowLeft className="w-4 h-4" /> {step === 0 ? 'Annuler' : 'Précédent'}
        </button>
        {step < STEPS.length - 1 ? (
          <button
            onClick={() => canNext() && setStep(step + 1)}
            disabled={!canNext()}
            className="flex items-center gap-1.5 bg-ink-900 hover:bg-ink-800 disabled:opacity-40 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition"
          >
            Suivant <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <button
            onClick={publish}
            disabled={saving}
            className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition shadow-card"
          >
            {saving ? <Spinner className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
            Publier le produit
          </button>
        )}
      </div>
    </Modal>
  );
}

function UploadZone({
  label, hint, imageUrl, fileUrl, uploading, onFile, aspect, showFileName,
}: {
  label: string;
  hint: string;
  imageUrl: string | null;
  fileUrl?: string | null;
  uploading: boolean;
  onFile: (f: File) => void;
  aspect: string;
  showFileName?: boolean;
}) {
  return (
    <div>
      <span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span>
      <label className={`block border-2 border-dashed border-ink-200 rounded-2xl overflow-hidden cursor-pointer hover:border-brand-400 hover:bg-brand-50/30 transition group ${aspect}`}>
        {imageUrl ? (
          <div className={`${aspect} relative`}>
            <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-ink-900/0 group-hover:bg-ink-900/40 transition flex items-center justify-center">
              <span className="text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition">Remplacer</span>
            </div>
          </div>
        ) : fileUrl ? (
          <div className="p-4 text-center">
            <FileText className="w-8 h-8 text-brand-500 mx-auto mb-2" />
            <p className="text-xs font-semibold text-ink-700 truncate">{fileUrl.split('/').pop()}</p>
            <p className="text-[10px] text-ink-400 mt-1">Cliquez pour remplacer</p>
          </div>
        ) : uploading ? (
          <div className={`${aspect || 'py-8'} flex items-center justify-center`}>
            <Spinner className="w-6 h-6 text-brand-600" />
          </div>
        ) : (
          <div className={`${aspect || 'py-8'} flex flex-col items-center justify-center text-center px-4`}>
            <Upload className="w-6 h-6 text-ink-400 group-hover:text-brand-500 mb-1.5" />
            <p className="text-xs font-semibold text-ink-500">Cliquez pour téléverser</p>
            <p className="text-[10px] text-ink-400 mt-0.5">{hint}</p>
          </div>
        )}
        <input type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) onFile(f); }} />
      </label>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{label}</span>
      <span className="font-semibold text-ink-900 truncate max-w-[60%] text-right">{value}</span>
    </div>
  );
}
