import { useState, useEffect, useCallback } from 'react';

export interface Route {
  // Admin pages
  page: 'dashboard' | 'produits' | 'produits-nouveau' | 'catalogue' | 'commandes' | 'marketing' | 'boutique' | 'parametres';
  productId?: string; // for edit mode
  // Public pages
  public?: 'store' | 'product';
  storeSlug?: string;
  productSlug?: string;
}

function parseHash(): Route {
  const hash = window.location.hash.replace(/^#\/?/, '');

  // Public store: /s/:slug
  const storeMatch = hash.match(/^s\/(.+)$/);
  if (storeMatch) return { page: 'dashboard', public: 'store', storeSlug: storeMatch[1] };

  // Public product: /p/:slug
  const productMatch = hash.match(/^p\/(.+)$/);
  if (productMatch) return { page: 'dashboard', public: 'product', productSlug: productMatch[1] };

  // Admin edit: /produits/modifier/:id
  const editMatch = hash.match(/^produits\/modifier\/(.+)$/);
  if (editMatch) return { page: 'produits-nouveau', productId: editMatch[1] };

  // Admin new product
  if (hash === 'produits/nouveau') return { page: 'produits-nouveau' };

  const validPages: Route['page'][] = [
    'dashboard', 'produits', 'produits-nouveau', 'catalogue', 'commandes', 'marketing', 'boutique', 'parametres',
  ];
  const topSegment = hash.split('/')[0];
  if (validPages.includes(topSegment as Route['page'])) {
    return { page: topSegment as Route['page'] };
  }

  return { page: 'dashboard' };
}

export function navigate(path: string) {
  window.location.hash = path;
  window.scrollTo(0, 0);
}

export function useRoute(): [Route, (path: string) => void] {
  const [route, setRoute] = useState<Route>(parseHash);

  useEffect(() => {
    const onChange = () => setRoute(parseHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  const nav = useCallback((path: string) => {
    navigate(path);
  }, []);

  return [route, nav];
}
