import type { OrderStatus, Product, Order, SalesPoint } from './types';

export const CURRENCY = 'AOA';

export function formatKz(value: number): string {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
  return `${formatted} Kz`;
}

export const STATUS_LABELS: Record<OrderStatus, string> = {
  pending: 'En attente',
  confirmed: 'Confirmée',
  shipped: 'Expédiée',
  delivered: 'Livrée',
  cancelled: 'Annulée',
};

export const STATUS_STYLES: Record<OrderStatus, string> = {
  pending: 'bg-amber-100 text-amber-700 ring-amber-200',
  confirmed: 'bg-blue-100 text-blue-700 ring-blue-200',
  shipped: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
  delivered: 'bg-brand-100 text-brand-700 ring-brand-200',
  cancelled: 'bg-rose-100 text-rose-700 ring-rose-200',
};

export const PAYMENT_LABELS: Record<string, string> = {
  cod: 'Paiement à la livraison',
  transfer: 'Transfert local',
  multicaixa_sim: 'Multicaixa Express (Sim.)',
  card_sim: 'Carte Bancaire (Sim.)',
};

export const PAYMENT_STYLES: Record<string, string> = {
  cod: 'bg-amber-100 text-amber-700 ring-amber-200',
  transfer: 'bg-blue-100 text-blue-700 ring-blue-200',
  multicaixa_sim: 'bg-violet-100 text-violet-700 ring-violet-200',
  card_sim: 'bg-indigo-100 text-indigo-700 ring-indigo-200',
};

export const CATEGORIES = ['Tout', 'Mode', 'Électronique', 'Beauté & Santé', 'Maison & Cuisine', 'Accessoires', 'Enfants'];

export const ANGOLA_PROVINCES = [
  'Luanda', 'Benguela', 'Huambo', 'Huíla', 'Cabinda', 'Malanje', 'Namibe',
  'Cuanza Norte', 'Cuanza Sul', 'Uíge', 'Bié', 'Moxico', 'Cuando Cubango',
  'Cunene', 'Bengo', 'Zaire',
];

export const ANGOLA_CITIES = [
  'Luanda', 'Huambo', 'Benguela', 'Lobito', 'Lubango', 'Cabinda', 'Malanje',
  'Namibe', 'Sumbe', 'Uíge', 'Saurimo', 'Ndalatando', 'Mbanza Congo', 'Ondjiva',
];

export const products: Product[] = [
  { id: 'p1', name: 'Montre Connectée Sport Pro', category: 'Électronique', supplierPrice: 18000, suggestedPrice: 34900, image: 'https://images.pexels.com/photos/437037/pexels-photo-437037.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Montre intelligente avec suivi cardiaque, notifications et autonomie de 7 jours. Écran AMOLED 1.8". Compatible iOS et Android.', deliveryDays: 4, trend: 'hot', stock: 120 },
  { id: 'p2', name: 'Sac à Main Élégance Cuir', category: 'Mode', supplierPrice: 9500, suggestedPrice: 22000, image: 'https://images.pexels.com/photos/1152077/pexels-photo-1152077.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Sac à main en simili-cuir premium, design intemporel, compartiments multiples. Parfait pour toutes occasions.', deliveryDays: 3, trend: 'new', stock: 80 },
  { id: 'p3', name: 'Sérum Visage Vitamine C', category: 'Beauté & Santé', supplierPrice: 4200, suggestedPrice: 11500, image: 'https://images.pexels.com/photos/5938567/pexels-photo-5938567.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Sérum éclaircissant anti-taches à la vitamine C. Visible en 14 jours. Flacon 30ml avec pipette.', deliveryDays: 3, trend: 'hot', stock: 200 },
  { id: 'p4', name: 'Lampe LED Ambiance RGB', category: 'Maison & Cuisine', supplierPrice: 6800, suggestedPrice: 16900, image: 'https://images.pexels.com/photos/1112597/pexels-photo-1112597.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Lampe d\'ambiance 16 millions de couleurs, contrôle via application. Idéale salon et chambre.', deliveryDays: 5, trend: 'standard', stock: 60 },
  { id: 'p5', name: 'Casquette Logo Brodée', category: 'Accessoires', supplierPrice: 2800, suggestedPrice: 7500, image: 'https://images.pexels.com/photos/1124465/pexels-photo-1124465.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Casquette ajustable, coton respirant, broderie premium. Style urbain unisexe.', deliveryDays: 3, trend: 'new', stock: 150 },
  { id: 'p6', name: 'Écouteurs Sans Fil Bass+', category: 'Électronique', supplierPrice: 11500, suggestedPrice: 27500, image: 'https://images.pexels.com/photos/3780681/pexels-photo-3780681.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Écouteurs Bluetooth 5.3, réduction de bruit, boîtier de charge 24h d\'autonomie.', deliveryDays: 4, trend: 'hot', stock: 95 },
  { id: 'p7', name: 'Robe Africaine Wax Moderne', category: 'Mode', supplierPrice: 7200, suggestedPrice: 19500, image: 'https://images.pexels.com/photos/2065200/pexels-photo-2065200.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Robe en tissu wax authentique, coupe moderne, parfaite pour événements. Tailles S à XL.', deliveryDays: 4, trend: 'standard', stock: 70 },
  { id: 'p8', name: 'Jeu Éducatif Enfant Montessori', category: 'Enfants', supplierPrice: 5200, suggestedPrice: 13900, image: 'https://images.pexels.com/photos/3661193/pexels-photo-3661193.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Jouet d\'éveil Montessori en bois, développe motricité et logique. Dès 3 ans.', deliveryDays: 5, trend: 'new', stock: 110 },
  { id: 'p9', name: 'Brosse Lissante Céramique', category: 'Beauté & Santé', supplierPrice: 5500, suggestedPrice: 14900, image: 'https://images.pexels.com/photos/3993449/pexels-photo-3993449.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Brosse lissante vapeur céramique, lisse et discipline les cheveux en un passage.', deliveryDays: 4, trend: 'hot', stock: 85 },
  { id: 'p10', name: 'Mini Projecteur Portable HD', category: 'Électronique', supplierPrice: 24000, suggestedPrice: 49000, image: 'https://images.pexels.com/photos/7239253/pexels-photo-7239253.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Projecteur LED portable 1080p, compatible HDMI et USB. Cinéma à la maison.', deliveryDays: 5, trend: 'new', stock: 40 },
  { id: 'p11', name: 'Théière Élégance Verre', category: 'Maison & Cuisine', supplierPrice: 3800, suggestedPrice: 9900, image: 'https://images.pexels.com/photos/39347/tea-pot-kitchen-tea-39347.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Théière en verre borosilicaté avec filtre inox, design moderne, 600ml.', deliveryDays: 3, trend: 'standard', stock: 130 },
  { id: 'p12', name: 'Sac à Dos Urbain Anti-Vol', category: 'Accessoires', supplierPrice: 8200, suggestedPrice: 21000, image: 'https://images.pexels.com/photos/2905238/pexels-photo-2905238.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Sac à dos anti-vol USB, compartiment ordinateur 15", imperméable. Idéal quotidien.', deliveryDays: 4, trend: 'hot', stock: 75 },
];

export const marketingTemplates = [
  '🔥 OFFRE SPÉCIALE ! {product} — maintenant à {price} seulement ! Livraison rapide partout en Angola 🇦🇴. Commandez via WhatsApp 👉 {link}',
  '✨ Nouveauté disponible ! {product} à {price}. Qualité garantie, paiement à la livraison à Luanda et provinces. Réservez votre exemplaire aujourd\'hui ! {link}',
  '🎁 Pourquoi payer plus ? {product} à prix imbattable : {price}. Stock limité ! Écrivez-nous en privé pour commander. 📍 Livraison Angola. {link}',
];

// Données statiques historiques (pour fallback visuel si pas encore de données)
export const salesData: SalesPoint[] = [
  { label: 'Lun', revenue: 0, traffic: 0 },
  { label: 'Mar', revenue: 0, traffic: 0 },
  { label: 'Mer', revenue: 0, traffic: 0 },
  { label: 'Jeu', revenue: 0, traffic: 0 },
  { label: 'Ven', revenue: 0, traffic: 0 },
  { label: 'Sam', revenue: 0, traffic: 0 },
  { label: 'Dim', revenue: 0, traffic: 0 },
];
