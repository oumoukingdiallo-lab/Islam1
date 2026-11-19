import { useState } from 'react';
import { Link2, Upload, Wand2, Sparkles, Check } from 'lucide-react';
import { Modal } from '@/components/Modal';
import { Spinner, useToast } from '@/lib/ui';
import { supabase } from '@/lib/supabase';
import { formatKz } from '@/lib/data';

export function MagicImport({
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
  const [mode, setMode] = useState<'link' | 'photo'>('link');
  const [link, setLink] = useState('');
  const [imageUrl, setImageUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    name: string;
    description: string;
    suggestedPrice: number;
    supplierPrice: number;
    category: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setMode('link'); setLink(''); setImageUrl(''); setResult(null); setLoading(false);
  };

  const close = () => { reset(); onClose(); };

  const uploadPhoto = async (file: File) => {
    if (!storeId) return;
    setUploading(true);
    const ext = file.name.split('.').pop();
    const path = `${storeId}/import-${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from('kbiza-assets').upload(path, file, { upsert: true });
    setUploading(false);
    if (error) { toast('Erreur lors du téléversement', 'error'); return; }
    const { data } = supabase.storage.from('kbiza-assets').getPublicUrl(path);
    setImageUrl(data.publicUrl);
    toast('Photo téléversée');
  };

  const generate = async () => {
    if (mode === 'link' && !link.trim()) { toast('Collez un lien fournisseur', 'error'); return; }
    if (mode === 'photo' && !imageUrl) { toast('Téléversez une photo d’abord', 'error'); return; }
    setLoading(true);
    setResult(null);
    setTimeout(() => {
      // Génération simulée d'une fiche produit optimisée
      const categories = ['Mode', 'Électronique', 'Beauté', 'Maison', 'Accessoires'];
      const cat = categories[Math.floor(Math.random() * categories.length)];
      const supplier = Math.round((8000 + Math.random() * 30000) / 100) * 100;
      const suggested = Math.round(supplier * (1.6 + Math.random() * 0.5) / 100) * 100;
      const names: Record<string, string[]> = {
        Mode: ['Robe Élégance Africaine', 'Sneakers Urbaines Premium', 'Sac Designer Signature'],
        Électronique: ['Écouteurs Bluetooth Pro', 'Montre Connectée X9', 'Enceinte Portable BassMax'],
        Beauté: ['Sérum Éclat Vitamine C', 'Crème Hydratante Bio', 'Palette Maquillage Pro'],
        Maison: ['Lampe LED Ambiance', 'Organisateur Minimaliste', 'Coussin Décoratif Premium'],
        Accessoires: ['Montre Cuir Classique', 'Lunettes Soleil UV400', 'Ceinture Élégance Cuir'],
      };
      const picked = names[cat][Math.floor(Math.random() * names[cat].length)];
      setResult({
        name: picked,
        description: `Le ${picked} est un produit tendance plébiscité par les acheteurs angolais. Conçu avec des matériaux de qualité, il combine élégance et durabilité. Parfait pour un usage quotidien ou comme cadeau.\n\nCaractéristiques principales :\n• Design moderne et intemporel\n• Qualité supérieure garantie\n• Livraison rapide partout en Angola\n• Paiement à la livraison disponible\n\nStock limité — importez-le maintenant et commencez à vendre avec une marge confortable.`,
        suggestedPrice: suggested,
        supplierPrice: supplier,
        category: cat,
      });
      setLoading(false);
    }, 1600);
  };

  const importProduct = async () => {
    if (!result || !storeId) return;
    setSaving(true);
    const { error } = await supabase.from('products').insert({
      store_id: storeId,
      type: 'physical',
      name: result.name,
      description: result.description,
      category: result.category,
      image_url: imageUrl || null,
      source_url: link || null,
      supplier_price: result.supplierPrice,
      sale_price: result.suggestedPrice,
      suggested_price: result.suggestedPrice,
      delivery_days: 4,
      stock: 50,
      active: true,
      trend: 'new',
    });
    setSaving(false);
    if (error) { toast('Erreur lors de l’importation', 'error'); return; }
    toast('Produit importé dans votre boutique');
    onCreated();
    close();
  };

  return (
    <Modal open={open} onClose={close} title="Importation Magique" size="lg">
      <p className="text-sm text-ink-500 mb-4">
        Collez un lien fournisseur ou téléversez une photo de produit. Kbizá génère automatiquement une fiche produit complète (titre accrocheur, description optimisée et prix suggéré en Kwanza).
      </p>

      <div className="flex p-1 bg-ink-100 rounded-xl mb-4">
        {([['link', 'Lien fournisseur'], ['photo', 'Photo produit']] as const).map(([v, l]) => (
          <button
            key={v}
            onClick={() => { setMode(v); setResult(null); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition ${mode === v ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'}`}
          >
            {l}
          </button>
        ))}
      </div>

      {mode === 'link' ? (
        <label className="block mb-4">
          <span className="block text-xs font-semibold text-ink-600 mb-1.5">Lien du produit fournisseur</span>
          <div className="relative">
            <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://aliexpress.com/... ou https://fournisseur.com/produit"
              className="w-full pl-10 pr-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100 text-sm"
            />
          </div>
        </label>
      ) : (
        <div className="mb-4">
          <label className="block border-2 border-dashed border-ink-200 rounded-2xl p-6 text-center cursor-pointer hover:border-brand-400 transition">
            {uploading ? (
              <Spinner className="w-6 h-6 text-brand-600 mx-auto" />
            ) : imageUrl ? (
              <div className="relative">
                <img src={imageUrl} alt="" className="w-32 h-32 object-cover rounded-xl mx-auto" />
                <p className="text-xs text-ink-500 mt-2">Cliquez pour remplacer</p>
              </div>
            ) : (
              <>
                <Upload className="w-6 h-6 text-ink-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-ink-500">Téléversez la photo du produit</p>
                <p className="text-[10px] text-ink-400 mt-0.5">L’IA analysera l’image pour générer la fiche</p>
              </>
            )}
            <input type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadPhoto(f); }} />
          </label>
        </div>
      )}

      <button
        onClick={generate}
        disabled={loading}
        className="w-full bg-ink-900 hover:bg-ink-800 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition mb-4"
      >
        {loading ? <Spinner className="w-5 h-5" /> : <Wand2 className="w-4 h-4" />}
        {loading ? 'Génération en cours…' : 'Générer la fiche produit'}
      </button>

      {result && (
        <div className="animate-slide-up space-y-3">
          <div className="bg-brand-50 rounded-xl p-3 flex items-center gap-2 text-sm font-semibold text-brand-700">
            <Sparkles className="w-4 h-4" /> Fiche produit générée par l’IA
          </div>

          {imageUrl && (
            <div className="aspect-video rounded-xl overflow-hidden bg-ink-100">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
          )}

          <div className="bg-white border border-ink-200 rounded-2xl p-4 space-y-3">
            <div>
              <p className="text-[10px] font-semibold text-ink-400 uppercase">{result.category}</p>
              <h3 className="font-display font-bold text-lg text-ink-900">{result.name}</h3>
            </div>
            <p className="text-sm text-ink-600 whitespace-pre-wrap leading-relaxed">{result.description}</p>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="bg-ink-50 rounded-xl p-3">
                <p className="text-xs text-ink-400">Prix fournisseur</p>
                <p className="font-bold text-ink-900">{formatKz(result.supplierPrice)}</p>
              </div>
              <div className="bg-brand-50 rounded-xl p-3">
                <p className="text-xs text-brand-600">Prix de vente suggéré</p>
                <p className="font-bold text-brand-700">{formatKz(result.suggestedPrice)}</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-sm font-semibold text-brand-600">
              <Check className="w-4 h-4" /> Marge estimée : {Math.round(((result.suggestedPrice - result.supplierPrice) / result.suggestedPrice) * 100)}%
            </div>
          </div>

          <button
            onClick={importProduct}
            disabled={saving}
            className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-card"
          >
            {saving ? <Spinner className="w-5 h-5" /> : <Check className="w-4 h-4" />}
            Importer dans ma boutique
          </button>
        </div>
      )}
    </Modal>
  );
}
