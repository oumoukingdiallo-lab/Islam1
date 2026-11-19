import { useState } from 'react';
import {
  Store, Megaphone, Package, Link as LinkIcon, Copy, Share2, Palette, Upload, Check,
} from 'lucide-react';
import { useToast } from '@/lib/ui';
import { supabase } from '@/lib/supabase';
import { ProductsPanel } from '@/components/ProductsPanel';
import { MarketingPanel } from '@/components/MarketingPanel';
import { useAuth } from '@/lib/auth';

type Tab = 'vitrine' | 'products' | 'marketing';

const ACCENT_COLORS = [
  { name: 'Émeraude', value: '#059669' },
  { name: 'Océan', value: '#0284c7' },
  { name: 'Corail', value: '#f97316' },
  { name: 'Prune', value: '#7c3aed' },
  { name: 'Nuit', value: '#0f172a' },
];

export function StoreMarketingPage({
  storeId,
  storeName,
  accentColor,
  storeLink,
  onUpdateStore,
}: {
  storeId: string | null;
  storeName: string;
  accentColor: string;
  storeLink: string;
  onUpdateStore: (patch: Record<string, string>) => Promise<void>;
}) {
  const [tab, setTab] = useState<Tab>('products');
  const { toast, Toaster } = useToast();
  const { store } = useAuth();

  return (
    <div className="px-4 md:px-8 py-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Boutique & Marketing</h1>
        <p className="text-sm text-ink-500 mt-0.5">Gérez vos produits, configurez votre vitrine et créez vos publicités.</p>
      </div>

      <div className="flex p-1 bg-ink-100 rounded-xl mb-6 max-w-2xl overflow-x-auto no-scrollbar">
        {([['products', 'Produits', Package], ['vitrine', 'Ma Vitrine', Store], ['marketing', 'Marketing', Megaphone]] as const).map(([v, l, Icon]) => (
          <button
            key={v}
            onClick={() => setTab(v)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-lg transition whitespace-nowrap ${
              tab === v ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
            }`}
          >
            <Icon className="w-4 h-4" /> {l}
          </button>
        ))}
      </div>

      {tab === 'products' && <ProductsPanel storeId={storeId} />}
      {tab === 'vitrine' && (
        <VitrineTab
          storeId={storeId}
          storeName={storeName}
          accentColor={accentColor}
          storeLink={storeLink}
          onUpdateStore={onUpdateStore}
          toast={toast}
        />
      )}
      {tab === 'marketing' && <MarketingPanel storeId={storeId} storeLink={storeLink} />}

      {Toaster}
    </div>
  );
}

function VitrineTab({
  storeId, storeName, accentColor, storeLink, onUpdateStore, toast,
}: {
  storeId: string | null;
  storeName: string;
  accentColor: string;
  storeLink: string;
  onUpdateStore: (patch: Record<string, string>) => Promise<void>;
  toast: (m: string, t?: 'success' | 'error') => void;
}) {
  const [name, setName] = useState(storeName);
  const [copied, setCopied] = useState(false);
  const [uploading, setUploading] = useState(false);

  const copyLink = () => {
    const fullUrl = `${window.location.origin}/${storeLink}`;
    navigator.clipboard?.writeText(fullUrl);
    setCopied(true);
    toast('Lien copié dans le presse-papiers');
    setTimeout(() => setCopied(false), 2000);
  };

  const save = async () => {
    try {
      await onUpdateStore({ name });
      toast('Boutique mise à jour');
    } catch {
      toast('Erreur', 'error');
    }
  };

  const setAccent = async (color: string) => {
    try {
      await onUpdateStore({ accent_color: color });
      toast('Couleur mise à jour');
    } catch {
      toast('Erreur', 'error');
    }
  };

  const uploadLogo = async (file: File) => {
    if (!storeId) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${storeId}/logo-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kbiza-assets').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast('Erreur lors du téléversement', 'error'); return; }
    const { data } = supabase.storage.from('kbiza-assets').getPublicUrl(path);
    await onUpdateStore({ logo_url: data.publicUrl });
    toast('Logo mis à jour');
  };

  const shareWhatsApp = () => {
    const fullUrl = `${window.location.origin}/${storeLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(`Découvrez ma boutique ${name} sur Kbizá : ${fullUrl}`)}`, '_blank');
  };

  return (
    <div className="grid md:grid-cols-2 gap-4 md:gap-6">
      <div className="space-y-4">
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
          <h2 className="font-display font-bold text-base text-ink-900 mb-4">Identité de la boutique</h2>

          <label className="block mb-4">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Nom de la boutique</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm"
            />
          </label>

          <div className="mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 mb-2">
              <Palette className="w-3.5 h-3.5" /> Couleur d’accentuation
            </span>
            <div className="flex gap-2">
              {ACCENT_COLORS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setAccent(c.value)}
                  className={`w-9 h-9 rounded-full ring-2 ring-offset-2 transition ${accentColor === c.value ? 'ring-ink-900' : 'ring-transparent'}`}
                  style={{ backgroundColor: c.value }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          <label className="block border-2 border-dashed border-ink-200 rounded-xl py-6 text-center hover:border-brand-400 hover:bg-brand-50/30 transition group cursor-pointer">
            {uploading ? (
              <p className="text-xs font-semibold text-brand-600">Téléversement…</p>
            ) : (
              <>
                <Upload className="w-6 h-6 mx-auto text-ink-400 group-hover:text-brand-500 mb-1.5" />
                <p className="text-xs font-semibold text-ink-500">Télécharger un logo</p>
                <p className="text-[10px] text-ink-400 mt-0.5">PNG ou JPG, 2 Mo max</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadLogo(f); }} />
          </label>

          <button onClick={save} className="mt-4 w-full bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm transition">
            Enregistrer
          </button>
        </div>

        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5">
          <span className="flex items-center gap-1.5 text-xs font-semibold text-ink-600 mb-2">
            <LinkIcon className="w-3.5 h-3.5" /> Lien de votre boutique
          </span>
          <div className="flex items-center gap-2 bg-ink-50 rounded-xl p-2">
            <span className="flex-1 text-sm text-ink-700 font-medium truncate px-2">{storeLink}</span>
            <button onClick={copyLink} className="bg-ink-900 text-white px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 hover:bg-ink-800 transition">
              {copied ? <Check className="w-3.5 h-3.5 text-brand-400" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? 'Copié' : 'Copier'}
            </button>
          </div>
          <button onClick={shareWhatsApp} className="mt-3 w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition">
            <Share2 className="w-4 h-4" /> Partager sur WhatsApp
          </button>
        </div>
      </div>

      <div>
        <p className="text-xs font-semibold text-ink-500 mb-2">Aperçu de la vitrine</p>
        <div className="bg-white rounded-2xl border border-ink-100 shadow-card overflow-hidden">
          <div className="h-24" style={{ backgroundColor: accentColor }} />
          <div className="px-4 pb-4">
            <div className="w-14 h-14 rounded-2xl bg-white border-4 border-white shadow -mt-7 flex items-center justify-center font-display font-extrabold text-lg overflow-hidden" style={{ color: accentColor }}>
              {name.charAt(0).toUpperCase()}
            </div>
            <h3 className="font-display font-bold text-lg text-ink-900 mt-2">{name || 'Ma Boutique'}</h3>
            <p className="text-xs text-ink-400">Boutique en ligne · Angola 🇦🇴</p>
            <div className="mt-3 rounded-xl bg-ink-50 p-3 text-center">
              <p className="text-xs text-ink-500">Partagez ce lien avec vos clients :</p>
              <a href={storeLink} className="text-sm font-semibold text-brand-600 mt-1 hover:underline block">{storeLink.replace('#/boutique/', 'kbiza.ao/boutique/')}</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
