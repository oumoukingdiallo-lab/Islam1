// Types partagés de l'application Kbizá V2

export type PageId =
  | 'dashboard'
  | 'produits'
  | 'produits-nouveau'
  | 'catalogue'
  | 'commandes'
  | 'marketing'
  | 'boutique'
  | 'parametres';

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface User {
  id: string;
  name: string;
  phone: string;
  email: string;
  currency: string;
  storeName: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  supplierPrice: number;
  suggestedPrice: number;
  image: string;
  description: string;
  deliveryDays: number;
  trend: 'hot' | 'new' | 'standard';
  stock: number;
}

export interface StoreProduct {
  id: string;
  productId: string;
  name: string;
  salePrice: number;
  supplierPrice: number;
  image: string;
  category: string;
  active: boolean;
}

export interface Order {
  id: string;
  customerName: string;
  customerPhone: string;
  product: string;
  quantity: number;
  address: string;
  city: string;
  amount: number;
  status: OrderStatus;
  date: string;
}

export interface SalesPoint {
  label: string;
  revenue: number;
  traffic: number;
}
