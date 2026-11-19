import { useState } from 'react';
import { User, Store, CreditCard, Truck, Info, Check } from 'lucide-react';
import { useToast } from '@/lib/ui';
import { ANGOLA_PROVINCES, ANGOLA_CITIES } from '@/lib/data';
import type { Profile, Store as StoreType } from '@/lib/supabase';

type Tab = 'profil' | 'boutique' | 'paiement' | 'livraison';

export function SettingsPage({
  profile, store, onUpdateProfile, onUpdateStore,
}: {
  profile: Profile | null;
  store: StoreType | null;
  onUpdateProfile: (patch: Partial<Profile>) => Promise<void>;
  onUpdateStore: (patch: Partial<StoreType>) => Promise<void>;
}) {
  const { toast, Toaster } = useToast();
  const [tab, setTab] = useState<Tab>('profil');

  // Profile
  const [fullName, setFullName] = useState(profile?.full_name ?? '');
  const [email, setEmail] = useState(profile?.email ?? '');
  const [phone, setPhone] = useState(profile?.phone ?? '');
  const [city, setCity] = useState(profile?.city ?? '');
  const [province, setProvince] = useState(profile?.province ?? '');

  // Store
  const [storeName, setStoreName] = useState(store?.name ?? '');
  const [whatsapp, setWhatsapp] = useState(store?.whatsapp_number ?? '');

  // Payment (simulated — stored in localStorage)
  const [payMulticaixa, setPayMulticaixa] = useState(true);
  const [payCard, setPayCard] = useState(true);
  const [payCOD, setPayCOD] = useState(true);

  // Shipping
  const [shippingFee, setShippingFee] = useState(store?.default_shipping_fee ?? 2500);

  const saveProfile = async () => {
    try { await onUpdateProfile({ full_name: fullName, email, phone, city, province }); } catch { toast('Erreur', 'error'); }
  };
  const saveStore = async () => {
    try { await onUpdateStore({ name: storeName, whatsapp_number: whatsapp, default_shipping_fee: shippingFee }); } catch { toast('Erreur', 'error'); }
  };

  const tabs: { id: Tab; label: string; icon: typeof User }[] = [
    { id: 'profil', label: 'Profil & Compte', icon: User },
    { id: 'boutique', label: 'Boutique & Devise', icon: Store },
    { id: 'paiement', label: 'Paiement (Simulation)', icon: CreditCard },
    { id: 'livraison', label: 'Livraison & Logistique', icon: Truck },
  ];

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h1 className="font-display font-extrabold text-2xl md:text-3xl text-ink-900 tracking-tight">Paramètres</h1>
        <p className="text-sm text-ink-500 mt-0.5">Gérez votre compte, votre boutique et vos préférences.</p>
      </div>

      <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 mb-5">
        {tabs.map((t) => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl whitespace-nowrap transition ${tab === t.id ? 'bg-ink-900 text-white' : 'bg-white border border-ink-200 text-ink-600 hover:bg-ink-50'}`}>
              <Icon className="w-4 h-4" /> {t.label}
            </button>
          );
        })}
      </div>

      {tab === 'profil' && (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4 animate-fade-in">
          <h2 className="font-display font-bold text-base text-ink-900">Profil & Compte</h2>
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Nom complet" value={fullName} onChange={setFullName} />
            <Field label="Email" value={email} onChange={setEmail} type="email" />
            <Field label="Téléphone" value={phone} onChange={setPhone} prefix="+244" />
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Province</span>
              <select value={province} onChange={(e) => setProvince(e.target.value)} className="kbz-input bg-white">
                <option value="">Choisir…</option>
                {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="block">
              <span className="block text-xs font-semibold text-ink-600 mb-1.5">Ville</span>
              <select value={city} onChange={(e) => setCity(e.target.value)} className="kbz-input bg-white">
                <option value="">Choisir…</option>
                {ANGOLA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </label>
          </div>
          <button onClick={saveProfile} className="bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center gap-2"><Check className="w-4 h-4" /> Enregistrer</button>
        </div>
      )}

      {tab === 'boutique' && (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4 animate-fade-in">
          <h2 className="font-display font-bold text-base text-ink-900">Boutique & Devise</h2>
          <Field label="Nom commercial" value={storeName} onChange={setStoreName} />
          <Field label="Numéro WhatsApp Business" value={whatsapp} onChange={setWhatsapp} prefix="+244" placeholder="9XX XXX XXX" />
          <div className="bg-ink-50 rounded-xl p-3 flex items-center gap-2"><span className="text-sm text-ink-600">Devise par défaut :</span><strong className="text-sm text-ink-900">Kwanza Angolais (AOA)</strong></div>
          <button onClick={saveStore} className="bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center gap-2"><Check className="w-4 h-4" /> Enregistrer</button>
        </div>
      )}

      {tab === 'paiement' && (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4 animate-fade-in">
          <div className="flex items-start gap-3 bg-amber-50 rounded-xl p-3 border border-amber-200">
            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">Les paiements sont en <strong>mode simulation</strong> pour tester le parcours client sans connexion bancaire réelle. Aucune transaction financière n'est effectuée.</p>
          </div>
          <h2 className="font-display font-bold text-base text-ink-900">Options affichées sur le checkout</h2>
          <Toggle label="Multicaixa Express (Simulation)" desc="Paiement mobile simulé" checked={payMulticaixa} onChange={setPayMulticaixa} />
          <Toggle label="Carte Bancaire Visa/Mastercard (Simulation)" desc="Paiement par carte simulé" checked={payCard} onChange={setPayCard} />
          <Toggle label="Paiement à la livraison (COD - Angola)" desc="Paiement en espèces à la réception" checked={payCOD} onChange={setPayCOD} />
          <p className="text-xs text-ink-400">Ces options seront proposées à vos clients sur la page de commande publique.</p>
        </div>
      )}

      {tab === 'livraison' && (
        <div className="bg-white rounded-2xl border border-ink-100 shadow-soft p-5 space-y-4 animate-fade-in">
          <h2 className="font-display font-bold text-base text-ink-900">Livraison & Logistique (Angola)</h2>
          <Field label="Frais de livraison par défaut (Kz)" value={String(shippingFee)} onChange={(v) => setShippingFee(Number(v) || 0)} type="number" />
          <p className="text-xs text-ink-500">Exemple : 2 500 Kz pour Luanda, 4 500 Kz pour les autres provinces.</p>
          <div>
            <p className="text-xs font-semibold text-ink-600 mb-2">Provinces desservies</p>
            <div className="flex flex-wrap gap-1.5">
              {ANGOLA_PROVINCES.map((p) => <span key={p} className="text-xs font-semibold px-2.5 py-1 rounded-full bg-brand-50 text-brand-700 ring-1 ring-brand-100">{p}</span>)}
            </div>
          </div>
          <button onClick={saveStore} className="bg-ink-900 hover:bg-ink-800 text-white font-semibold py-2.5 rounded-xl text-sm transition flex items-center gap-2"><Check className="w-4 h-4" /> Enregistrer</button>
        </div>
      )}

      {Toaster}
      <style>{`.kbz-input{width:100%;padding:.75rem;border:1px solid #e2e8f0;border-radius:.75rem;font-size:.875rem;outline:none;transition:border-color .15s,box-shadow .15s}.kbz-input:focus{border-color:#10b981;box-shadow:0 0 0 3px rgb(16 185 129/.12)}`}</style>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', prefix, placeholder }: { label: string; value: string; onChange: (v: string) => void; type?: string; prefix?: string; placeholder?: string }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span>
      {prefix ? (
        <div className="flex items-center gap-2 px-3 py-2.5 border border-ink-200 rounded-xl focus-within:border-brand-500 focus-within:ring-2 focus-within:ring-brand-100">
          <span className="text-ink-500 font-medium text-sm">{prefix}</span>
          <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className="flex-1 bg-transparent outline-none text-sm" />
        </div>
      ) : <input value={value} onChange={(e) => onChange(e.target.value)} type={type} placeholder={placeholder} className="kbz-input" />}
    </label>
  );
}

function Toggle({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-center gap-3 p-3 bg-ink-50 rounded-xl cursor-pointer">
      <button type="button" onClick={() => onChange(!checked)} className={`w-11 h-6 rounded-full transition relative shrink-0 ${checked ? 'bg-brand-600' : 'bg-ink-300'}`}>
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${checked ? 'left-5.5' : 'left-0.5'}`} style={{ left: checked ? '22px' : '2px' }} />
      </button>
      <div><p className="text-sm font-semibold text-ink-800">{label}</p><p className="text-xs text-ink-500">{desc}</p></div>
    </label>
  );
}
