import { useLocalStorage, useToast, Spinner } from '@/lib/ui';
import { AuthProvider, useAuth } from '@/lib/auth';
import { Sidebar, BottomNav } from '@/components/Navigation';
import { MobileHeader } from '@/components/MobileHeader';
import { AuthPage } from '@/pages/AuthPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { ProductsPage } from '@/pages/ProductsPage';
import { ProductEditorPage } from '@/pages/ProductEditorPage';
import { CatalogPage } from '@/pages/CatalogPage';
import { OrdersPage } from '@/pages/OrdersPage';
import { MarketingPage } from '@/pages/MarketingPage';
import { StoreSettingsPage } from '@/pages/StoreSettingsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { StoreFront } from '@/pages/StoreFront';
import { ProductPage } from '@/pages/ProductPage';
import { useRoute, navigate } from '@/lib/router';
import type { PageId } from '@/lib/types';
import { useEffect } from 'react';

function Shell() {
  const { session, profile, store, loading, signOut, updateStore, updateProfile } = useAuth();
  const [route] = useRoute();
  const [, setAccentColor] = useLocalStorage('kbz_accent', '#059669');
  const { toast, Toaster } = useToast();

  useEffect(() => {
    if (store?.accent_color) setAccentColor(store.accent_color);
  }, [store?.accent_color, setAccentColor]);

  // Public routes — no auth needed
  if (route.public === 'store' && route.storeSlug) {
    return <StoreFront slug={route.storeSlug} />;
  }
  if (route.public === 'product' && route.productSlug) {
    return <ProductPage slug={route.productSlug} />;
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-ink-50">
        <Spinner className="w-8 h-8 text-brand-600" />
      </div>
    );
  }

  if (!session || !profile) {
    return <AuthPage />;
  }

  const userName = profile.full_name;
  const storeName = store?.name ?? 'Ma Boutique Angola';
  const accentColor = store?.accent_color ?? '#059669';

  const go = (p: PageId) => {
    if (p === 'produits-nouveau') navigate('/produits/nouveau');
    else navigate(`/${p}`);
  };

  const currentPage = route.productId ? 'produits-nouveau' : route.page;

  return (
    <div className="min-h-screen bg-ink-50">
      <Sidebar
        current={currentPage}
        onNavigate={go}
        userName={userName}
        storeName={storeName}
        onLogout={async () => {
          await signOut();
          navigate('/dashboard');
        }}
      />

      <div className="md:pl-64">
        <MobileHeader userName={userName} />

        <main className="pb-24 md:pb-8 min-h-screen">
          {currentPage === 'dashboard' && <DashboardPage userName={userName} storeId={store?.id ?? null} storeSlug={store?.slug ?? null} />}
          {currentPage === 'produits' && <ProductsPage storeId={store?.id ?? null} />}
          {currentPage === 'produits-nouveau' && (
            <ProductEditorPage storeId={store?.id ?? null} productId={route.productId} onDone={() => navigate('/produits')} />
          )}
          {currentPage === 'catalogue' && <CatalogPage storeId={store?.id ?? null} />}
          {currentPage === 'commandes' && <OrdersPage storeId={store?.id ?? null} onToast={toast} />}
          {currentPage === 'marketing' && <MarketingPage storeId={store?.id ?? null} storeSlug={store?.slug ?? null} />}
          {currentPage === 'boutique' && (
            <StoreSettingsPage
              store={store}
              accentColor={accentColor}
              onUpdateStore={async (patch) => {
                try { await updateStore(patch); toast('Boutique mise à jour'); }
                catch { toast('Erreur lors de la mise à jour', 'error'); }
              }}
            />
          )}
          {currentPage === 'parametres' && (
            <SettingsPage
              profile={profile}
              store={store}
              onUpdateProfile={async (patch) => {
                try { await updateProfile(patch); toast('Profil mis à jour'); }
                catch { toast('Erreur', 'error'); }
              }}
              onUpdateStore={async (patch) => {
                try { await updateStore(patch); toast('Boutique mise à jour'); }
                catch { toast('Erreur', 'error'); }
              }}
            />
          )}
        </main>
      </div>

      <BottomNav current={currentPage} onNavigate={go} />
      {Toaster}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Shell />
    </AuthProvider>
  );
}
