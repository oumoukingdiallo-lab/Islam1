import { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, ArrowRight, Sparkles, Phone, MapPin } from 'lucide-react';
import { KbzLogo } from '@/components/Logo';
import { Spinner } from '@/lib/ui';
import { useAuth } from '@/lib/auth';
import { ANGOLA_PROVINCES, ANGOLA_CITIES } from '@/lib/data';

export function AuthPage() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (mode === 'signup') {
        const { error } = await signUp({
          email,
          password,
          fullName: name,
          phone: `+244 ${phone}`,
          city,
          province,
        });
        if (error) setError(error);
      } else {
        const { error } = await signIn(email, password);
        if (error) setError(error);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-white">
      {/* Brand panel */}
      <div className="relative md:w-1/2 bg-gradient-to-br from-brand-700 via-brand-800 to-ink-900 text-white p-8 md:p-12 flex flex-col justify-between overflow-hidden">
        <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 w-80 h-80 rounded-full bg-brand-400/10 blur-3xl" />

        <div className="relative flex items-center gap-3">
          <KbzLogo className="w-10 h-10" />
          <span className="font-display font-extrabold text-2xl tracking-tight">Kbizá</span>
        </div>

        <div className="relative my-12 md:my-0">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-xs font-semibold mb-5">
            <Sparkles className="w-3.5 h-3.5" /> Conçu pour l'Angola 🇦🇴
          </span>
          <h1 className="font-display font-extrabold text-3xl md:text-4xl leading-tight mb-4">
            Vendez en ligne.<br />Faites connaître vos produits.
          </h1>
          <p className="text-brand-100/80 text-base leading-relaxed max-w-md">
            La plateforme tout-en-un pour faire du dropshipping et de marketing digital.
            Importez des produits, créez des produits digitaux, lancez votre boutique, et vendez sur WhatsApp.
          </p>

          <div className="grid grid-cols-3 gap-3 mt-8 max-w-md">
            {[
              { n: '4 200+', l: 'Produits' },
              { n: '18 prov.', l: 'Livraison' },
              { n: 'Kz', l: 'Paiement local' },
            ].map((s) => (
              <div key={s.l} className="bg-white/5 rounded-2xl p-3 border border-white/10">
                <p className="font-display font-bold text-lg">{s.n}</p>
                <p className="text-xs text-brand-100/70">{s.l}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="relative text-xs text-brand-100/60">© 2026 Kbizá. Tous droits réservés.</p>
      </div>

      {/* Form panel */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-sm">
          <h2 className="font-display font-bold text-2xl text-ink-900 mb-1">
            {mode === 'signup' ? 'Commencez à vendre' : 'Bon retour'}
          </h2>
          <p className="text-ink-500 text-sm mb-6">
            {mode === 'signup' ? 'Créez votre compte en moins d’une minute.' : 'Connectez-vous à votre compte.'}
          </p>

          {/* Tabs */}
          <div className="flex p-1 bg-ink-100 rounded-xl mb-5">
            {(['signup', 'login'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${
                  mode === m ? 'bg-white text-ink-900 shadow-soft' : 'text-ink-500'
                }`}
              >
                {m === 'signup' ? 'Inscription' : 'Connexion'}
              </button>
            ))}
          </div>

          {error && (
            <div className="mb-4 px-3 py-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium animate-fade-in">
              {error}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
            {mode === 'signup' && (
              <>
                <Field label="Nom complet">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Ex: João Manuel"
                    className="kbz-input"
                  />
                </Field>

                <Field label="Numéro de téléphone">
                  <div className="flex items-center gap-2 kbz-input px-0 py-0">
                    <span className="pl-3 pr-2 py-3 text-ink-500 font-medium border-r border-ink-200 text-sm flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> +244
                    </span>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      type="tel"
                      placeholder="9XX XXX XXX"
                      className="flex-1 py-3 pr-3 bg-transparent outline-none text-sm"
                    />
                  </div>
                </Field>

                <div className="grid grid-cols-2 gap-3">
                  <Field label="Province">
                    <select value={province} onChange={(e) => setProvince(e.target.value)} className="kbz-input bg-white">
                      <option value="">Choisir…</option>
                      {ANGOLA_PROVINCES.map((p) => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </Field>
                  <Field label="Ville">
                    <select value={city} onChange={(e) => setCity(e.target.value)} className="kbz-input bg-white">
                      <option value="">Choisir…</option>
                      {ANGOLA_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </Field>
                </div>
              </>
            )}

            <Field label="Adresse e-mail">
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="vous@exemple.com"
                  className="kbz-input pl-10"
                />
              </div>
            </Field>

            <Field label="Mot de passe">
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-400" />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  type={showPwd ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="kbz-input pl-10 pr-10"
                />
                <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-600">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </Field>

            <div className="flex items-center justify-between text-xs">
              <span className="text-ink-400">Devise : <strong className="text-ink-700">Kwanza (AOA)</strong></span>
              {mode === 'login' && <button type="button" className="text-brand-600 font-semibold hover:underline">Mot de passe oublié ?</button>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-700 disabled:opacity-60 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-card hover:shadow-pop"
            >
              {loading ? <Spinner className="w-5 h-5" /> : (
                <>
                  {mode === 'signup' ? 'Commencer à vendre' : 'Se connecter'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          <p className="text-center text-xs text-ink-400 mt-6">
            En continuant, vous acceptez nos Conditions d’utilisation et notre Politique de confidentialité.
          </p>
        </div>
      </div>

      <style>{`
        .kbz-input {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          font-size: 0.875rem;
          outline: none;
          transition: border-color .15s, box-shadow .15s;
        }
        .kbz-input:focus {
          border-color: #10b981;
          box-shadow: 0 0 0 3px rgb(16 185 129 / 0.12);
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold text-ink-600 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
