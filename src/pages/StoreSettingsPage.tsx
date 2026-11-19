import { useState } from 'react';
import { Store, Link as LinkIcon, Copy, Share2, Palette, Upload, Check, Smartphone, Monitor } from 'lucide-react';
import { useToast } from '@/lib/ui';
import { supabase, type Store as StoreType } from '@/lib/supabase';
import { navigate } from '@/lib/router';

const ACCENT_COLORS = [
  { name: 'Émeraude', value: '#059669' },
  { name: 'Bleu Océan', value: '#0284c7' },
  { name: 'Corail', value: '#f97316' },
  { name: 'Anthracite', value: '#0f172a' },
  { name: 'Or', value: '#d97706' },
];

export function StoreSettingsPage({
  store, accentColor, onUpdateStore,
}: {
  store: StoreType | null;
  accentColor: string;
  onUpdateStore: (patch: Partial<StoreType>) => Promise<void>;
}) {
  const { toast, Toaster } = useToast();
  const [name, setName] = useState(store?.name ?? '');
  const [slug, setSlug] = useState(store?.slug ?? '');
  const [tagline, setTagline] = useState(store?.tagline ?? '');
  const [description, setDescription] = useState(store?.description ?? '');
  const [announcement, setAnnouncement] = useState(store?.announcement_text ?? '');
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number ?? '');
  const [shippingFee, setShippingFee] = useState(store?.default_shipping_fee ?? 2500);
  const [uploading, setUploading] = useState(false);
  const [device, setDevice] = useState<'mobile' | 'desktop'>('desktop');

  const storeLink = `#/s/${slug}`;
  const fullUrl = `${window.location.origin}/${storeLink}`;

  const copyLink = () => { navigator.clipboard?.writeText(fullUrl); toast('Lien copié'); };
  const shareWhatsApp = () => { window.open(`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique ${name} : ${fullUrl}`)}`, '_blank'); };

  const save = async () => {
    try {
      await onUpdateStore({ name, slug, tagline, description, announcement_text: announcement, whatsapp_number: whatsapp, default_shipping_fee: shippingFee });
      toast('Apparence sauvegardée');
    } catch { toast('Erreur', 'error'); }
  };

  const setAccent = async (color: string) => {
    try { await onUpdateStore({ accent_color: color }); toast('Couleur mise à jour'); } catch { toast('Erreur', 'error'); }
  };

  const uploadLogo = async (file: File) => {
    if (!store) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${store.id}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kbiza-assets').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast('Erreur', 'error'); return; }
    const { data } = supabase.storage.from('kbiza-assets').getPublicUrl(path);
    await onUpdateStore({ logo_url: data.publicUrl });
    toast('Logo mis à jour');
  };

  return (
    <div className="px-4 md:px-8 py-6 max-w-5xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Ma Boutique & Apparence</h1>
        <p className="text-sm text-ink-500 mt-0.5">Configurez votre vitrine publique avec aperçu en direct.</p>
      </div>

      <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4">
            <h2 className="font-display font-bold text-base text-ink-900">Identité de la boutique</h2>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Nom</span>
              <input value={name} onChange={(e) => setName(e.target.value)} className="kbz-input" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Slug / URL publique</span>
              <div className="flex items-center gap-2"><span className="text-xs text-ink-400">/s/</span><input value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))} className="kbz-input flex-1" /></div>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Slogan</span>
              <input value={tagline} onChange={(e) => setTagline(e.target.value)} placeholder="Ex: Vos produits préférés, livrés chez vous" className="kbz-input" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Description courte</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="kbz-input resize-none" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Barre d'annonce (optionnel)</span>
              <input value={announcement} onChange={(e) => setAnnouncement(e.target.value)} placeholder="🔥 Livraison rapide à Luanda et dans toutes les provinces !" className="kbz-input" />
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 mb-2"><Palette className="w-3.5 h-3.5" /> Couleur principale</span>
            <div className="flex gap-2 mb-4">
              {ACCENT_COLORS.map((c) => (
                <button key={c.value} onClick={() => setAccent(c.value)} className={`w-9 h-9 rounded-full ring-2 ring-offset-2 transition ${accentColor === c.value ? 'ring-ink-900' : 'ring-transparent'}`} style={{ backgroundColor: c.value }} title={c.name} />
              ))}
            </div>
            <label className="block border-2 border-dashed border-ink-200 rounded-xl py-5 text-center cursor-pointer hover:border-brand-400 transition">
              {uploading ? <p className="text-xs font-semibold text-brand-600">Téléversement…</p> : <><Upload className="w-5 h-5 mx-auto text-ink-400 mb-1" /><p className="text-xs font-semibold text-ink-500">Logo de la boutique</p></>}
              <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
            </label>
          </div>

          <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 mb-2"><LinkIcon className="w-3.5 h-3.5" /> Lien public</span>
            <div className="flex items-center gap-2 bg-ink-50 rounded-xl p-2 mb-3">
              <span className="flex-1 text-sm text-ink-700 font-medium truncate px-2">{fullUrl}</span>
              <button onClick={copyLink} className="bg-ink-900 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-ink-800 transition"><Copy className="w-3.5 h-3.5" /> Copier</button>
            </div>
            <button onClick={() => navigate(`/s/${slug}`)} className="w-full bg-white border border-ink-200 hover:bg-ink-50 text-ink-700 font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition mb-2"><Store className="w-4 h-4" /> Ouvrir ma vitrine</button>
            <button onClick={shareWhatsApp} className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition"><Share2 className="w-4 h-4" /> Partager sur WhatsApp</button>
          </div>

          <button onClick={save} className="w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-3 rounded-xl text-sm transition">Sauvegarder l'apparence</button>
        </div>

        {/* Live preview */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            <button onClick={() => setDevice('desktop')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${device === 'desktop' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-500'}`}><Monitor className="w-4 h-4 inline mr-1" /> Desktop</button>
            <button onClick={() => setDevice('mobile')} className={`px-3 py-2 rounded-lg text-xs font-semibold transition ${device === 'mobile' ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-500'}`}><Smartphone className="w-4 h-4 inline mr-1" /> Mobile</button>
          </div>
          <div className={`mx-auto bg-white rounded-2xl border border-ink-200 shadow-card overflow-hidden ${device === 'mobile' ? 'max-w-sm' : 'max-w-full'}`}>
            {announcement && <div className="text-center text-xs font-semibold text-white py-1.5 px-2" style={{ backgroundColor: accentColor }}>{announcement}</div>}
            <div className="h-24" style={{ backgroundColor: accentColor }} />
            <div className="px-4 pb-4">
              <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow -mt-7 flex items-center justify-center font-display font-extrabold text-lg overflow-hidden" style={{ color: accentColor }}>
                {store?.logo_url ? <img src={store.logo_url} alt="" className="w-full h-full object-cover" /> : name.charAt(0).toUpperCase()}
              </div>
              <h3 className="font-display font-bold text-lg text-ink-900 mt-2">{name || 'Ma Boutique'}</h3>
              {tagline && <p className="text-sm text-ink-500">{tagline}</p>}
              {description && <p className="text-xs text-ink-400 mt-1">{description}</p>}
              <div className="mt-3 rounded-xl bg-ink-50 p-3 text-center"><p className="text-xs text-ink-500">Lien de la boutique :</p><p className="text-sm font-semibold text-brand-600 mt-0.5">{fullUrl}</p></div>
            </div>
          </div>
        </div>
      </div>

      {Toaster}
      <style>{`.kbz-input{width:100%;padding:.75rem;border:1px solid #e2e8f0;border-radius:.75rem;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}.kbz-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgb(16 185 129/.12)}`}</style>
    </div>
  );
}
