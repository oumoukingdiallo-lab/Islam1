import {
  LayoutDashboard, Package, PlusCircle, Compass, Truck, Megaphone, Store, Settings, LogOut,
  Radar, Users, Tag,
} from 'lucide-react';
import type { PageId } from '@/lib/types';
import { KbzLogo } from '@/components/Logo';

const NAV_SECTIONS: { title: string; items: { id: PageId; label: string; icon: typeof LayoutDashboard; short: string }[] }[] = [
  {
    title: 'Pilotage',
    items: [
      { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard, short: 'Accueil' },
    ],
  },
  {
    title: 'Vendre',
    items: [
      { id: 'produits', label: 'Mes Produits', icon: Package, short: 'Produits' },
      { id: 'produits-nouveau', label: 'Créer un Produit', icon: PlusCircle, short: 'Créer' },
      { id: 'ad-spy', label: 'Ad Spy — Pubs Gagnantes', icon: Radar, short: 'Ad Spy' },
      { id: 'catalogue', label: 'Catalogue Dropshipping', icon: Compass, short: 'Catalogue' },
    ],
  },
  {
    title: 'Gérer',
    items: [
      { id: 'commandes', label: 'Commandes & Livraisons', icon: Truck, short: 'Commandes' },
      { id: 'clients', label: 'Clients & CRM', icon: Users, short: 'Clients' },
      { id: 'promotions', label: 'Promotions & Codes Promo', icon: Tag, short: 'Promos' },
    ],
  },
  {
    title: 'Croître',
    items: [
      { id: 'marketing', label: 'Marketing & Pubs IA', icon: Megaphone, short: 'Marketing' },
      { id: 'boutique', label: 'Ma Boutique & Apparence', icon: Store, short: 'Boutique' },
      { id: 'parametres', label: 'Paramètres', icon: Settings, short: 'Réglages' },
    ],
  },
];

const ALL_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);
const MOBILE_ITEMS = [ALL_ITEMS[0], ALL_ITEMS[2], ALL_ITEMS[5], ALL_ITEMS[9]];

export function Sidebar({
  current,
  onNavigate,
  userName,
  storeName,
  onLogout,
}: {
  current: PageId;
  onNavigate: (p: PageId) => void;
  userName: string;
  storeName: string;
  onLogout: () => void;
}) {
  return (
    <aside className="hidden md:flex fixed inset-y-0 left-0 w-64 bg-white border-r border-ink-200 flex-col z-40">
      <div className="px-5 h-16 flex items-center gap-2 border-b border-ink-100">
        <KbzLogo className="w-8 h-8" />
        <span className="font-display font-extrabold text-lg text-ink-900 tracking-tight">Kbizá</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-4 overflow-y-auto no-scrollbar">
        {NAV_SECTIONS.map((section) => (
          <div key={section.title}>
            <p className="px-3 mb-1.5 text-[10px] font-bold uppercase tracking-wider text-ink-300">{section.title}</p>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                const active = current === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-ink-500 hover:bg-ink-50 hover:text-ink-800'
                    }`}
                  >
                    <Icon className={`w-[18px] h-[18px] ${active ? 'text-brand-600' : 'text-ink-400'}`} />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-ink-100">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs text-ink-400 font-medium">Boutique</p>
          <p className="text-sm font-semibold text-ink-800 truncate">{storeName}</p>
        </div>
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl">
          <div className="w-9 h-9 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-sm">
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-ink-800 truncate">{userName}</p>
            <p className="text-xs text-ink-400 truncate">Angola 🇦🇴</p>
          </div>
          <button onClick={onLogout} className="text-ink-400 hover:text-rose-500 transition" title="Se déconnecter">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export function BottomNav({
  current,
  onNavigate,
}: {
  current: PageId;
  onNavigate: (p: PageId) => void;
}) {
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 bg-white/90 backdrop-blur-lg border-t border-ink-200 z-40 safe-bottom">
      <div className="grid grid-cols-5 max-w-md mx-auto">
        {MOBILE_ITEMS.map((item) => {
          const Icon = item.icon;
          const active = current === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="flex flex-col items-center gap-1 py-2.5 transition-colors relative"
            >
              <Icon className={`w-5 h-5 ${active ? 'text-brand-600' : 'text-ink-400'}`} />
              <span className={`text-[10px] font-semibold ${active ? 'text-brand-700' : 'text-ink-400'}`}>
                {item.short}
              </span>
              {active && <span className="absolute top-0 w-8 h-0.5 bg-brand-600 rounded-full" />}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
