import { useState, useEffect, useCallback } from 'react';
import { Tag, Plus, Trash2, Copy, Calendar, TrendingUp, Loader2, Check } from 'lucide-react';
import { supabase, type PromoCodeRow } from '@/lib/supabase';
import { formatKz, ANGOLA_PROVINCES } from '@/lib/data';
import { Badge, Skeleton, useToast } from '@/lib/ui';
import { Modal } from '@/components/Modal';

export function PromotionsPage({ storeId }: { storeId: string | null }) {
  const { toast, Toaster } = useToast();
  const [promos, setPromos] = useState<PromoCodeRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [saving, setSaving] = useState(false);

  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState(10);
  const [maxUses, setMaxUses] = useState<number | ''>('');
  const [expiresAt, setExpiresAt] = useState('');

  const load = useCallback(async () => {
    if (!storeId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase.from('promo_codes').select('*').eq('store_id', storeId).order('created_at', { ascending: false });
    setPromos((data as PromoCodeRow[]) ?? []);
    setLoading(false);
  }, [storeId]);

  useEffect(() => { load(); }, [load]);

  const create = async () => {
    if (!storeId || !code.trim()) { toast('Code requis', 'error'); return; }
    setSaving(true);
    const { error } = await supabase.from('promo_codes').insert({
      store_id: storeId,
      code: code.toUpperCase().trim(),
      discount_type: discountType,
      discount_value: discountValue,
      max_uses: maxUses === '' ? null : Number(maxUses),
      expires_at: expiresAt || null,
      active: true,
    });
    setSaving(false);
    if (error) { toast(error.code === '23505' ? 'Ce code existe déjà' : 'Erreur lors de la création', 'error'); return; }
    toast('Code promo créé');
    setShowCreate(false);
    setCode(''); setDiscountValue(10); setMaxUses(''); setExpiresAt('');
    load();
  };

  const toggle = async (p: PromoCodeRow) => {
    await supabase.from('promo_codes').update({ active: !p.active }).eq('id', p.id);
    load();
  };

  const remove = async (p: PromoCodeRow) => {
    await supabase.from('promo_codes').delete().eq('id', p.id);
    toast('Code promo supprimé');
    load();
  };

  const copyCode = (c: string) => { navigator.clipboard?.writeText(c); toast('Code copié'); };

  const isExpired = (p: PromoCodeRow) => p.expires_at && new Date(p.expires_at) < new Date();
  const isActive = (p: PromoCodeRow) => p.active && !isExpired(p) && (p.max_uses === null || p.used_count < p.max_uses);

  return (
    <div className="px-4 md:px-8 lg:px-10 py-6 max-w-[1440px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Tag className="w-7 h-7 text-brand-600" />
            <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Promotions & Codes Promo</h1>
          </div>
          <p className="text-sm text-ink-500 mt-0.5">Créez des codes de réduction utilisables sur vos pages de vente publiques.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl flex items-center gap-2 transition shadow-card">
          <Plus className="w-4 h-4" /> Créer un code
        </button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[0,1,2].map((i) => <Skeleton key={i} className="h-40 w-full rounded-2xl" />)}
        </div>
      ) : promos.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border-2 border-dashed border-ink-200">
          <Tag className="w-12 h-12 text-ink-300 mx-auto mb-3" />
          <p className="text-sm font-medium text-ink-600">Aucun code promo actif.</p>
          <p className="text-xs text-ink-400 mt-1">Créez votre premier code pour booster vos ventes.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {promos.map((p) => (
            <div key={p.id} className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 hover:shadow-card transition">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-display font-extrabold text-lg text-ink-900 tracking-wide">{p.code}</span>
                    <button onClick={() => copyCode(p.code)} className="text-ink-400 hover:text-brand-600 transition"><Copy className="w-3.5 h-3.5" /></button>
                  </div>
                  <Badge className={isActive(p) ? 'bg-brand-100 text-brand-700 ring-brand-200' : 'bg-ink-100 text-ink-500 ring-ink-200'}>
                    {isActive(p) ? <><Check className="w-3 h-3" /> Actif</> : 'Inactif'}
                  </Badge>
                </div>
                <div className={`text-right ${p.discount_type === 'percentage' ? 'text-brand-600' : 'text-blue-600'}`}>
                  <p className="font-display font-extrabold text-2xl">{p.discount_type === 'percentage' ? `-${p.discount_value}%` : `-${formatKz(p.discount_value)}`}</p>
                </div>
              </div>
              <div className="space-y-1.5 text-xs text-ink-500">
                <div className="flex justify-between"><span>Utilisations</span><span className="font-semibold text-ink-700">{p.used_count}{p.max_uses != null ? ` / ${p.max_uses}` : ' / ∞'}</span></div>
                {p.expires_at && <div className="flex justify-between items-center"><span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Expire le</span><span className={`font-semibold ${isExpired(p) ? 'text-rose-500' : 'text-ink-700'}`}>{new Date(p.expires_at).toLocaleDateString('fr-FR')}</span></div>}
              </div>
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-ink-100">
                <button onClick={() => toggle(p)} className={`flex-1 text-xs font-semibold py-1.5 rounded-lg transition ${p.active ? 'bg-amber-50 text-amber-700 hover:bg-amber-100' : 'bg-brand-50 text-brand-700 hover:bg-brand-100'}`}>
                  {p.active ? 'Désactiver' : 'Activer'}
                </button>
                <button onClick={() => remove(p)} className="p-1.5 text-ink-400 hover:text-rose-500 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Créer un code promo" size="md">
        <div className="space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Code (sans espaces)</span>
            <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="EX: LUANDA10" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm font-bold tracking-wide uppercase" />
          </label>
          <div>
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Type de réduction</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDiscountType('percentage')} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${discountType === 'percentage' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}>Pourcentage (%)</button>
              <button onClick={() => setDiscountType('fixed')} className={`py-2.5 rounded-xl border-2 text-sm font-semibold transition ${discountType === 'fixed' ? 'border-brand-500 bg-brand-50 text-brand-700' : 'border-ink-200 text-ink-500'}`}>Montant fixe (Kz)</button>
            </div>
          </div>
          <label className="block">
            <span className="block text-xs font-semibold text-ink-600 mb-1.5">Valeur {discountType === 'percentage' ? '(%)' : '(Kz)'}</span>
            <input type="number" value={discountValue} onChange={(e) => setDiscountValue(Number(e.target.value))} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Usage max (vide = illimité)</span>
              <input type="number" value={maxUses} onChange={(e) => setMaxUses(e.target.value === '' ? '' : Number(e.target.value))} placeholder="∞" className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Expire le (optionnel)</span>
              <input type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className="w-full px-3 py-2.5 border border-ink-200 rounded-xl outline-none focus:border-brand-500 text-sm" />
            </label>
          </div>
          <button onClick={create} disabled={saving || !code.trim()} className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Créer le code promo</>}
          </button>
        </div>
      </Modal>

      {Toaster}
    </div>
  );
}
