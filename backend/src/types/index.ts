export interface User {
  id: number;
  email: string;
  passwordHash: string;
  firstName: string;
  lastName: string;
  role: 'customer' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface Product {
  id: number;
  name: string;
  model: string;
  description?: string;
  price: number;
  categoryId?: number;
  stock: number;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CartItem {
  id: number;
  userId: number;
  productId: number;
  quantity: number;
  product?: Product;
  createdAt: Date;
}

export interface Order {
  id: number;
  orderNumber: string;
  userId: number;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  total: number;
  stripePaymentIntentId?: string;
  shippingAddress?: string;
  items?: OrderItem[];
  createdAt: Date;
  updatedAt: Date;
}

export type OrderStatus = 'created' | 'paid' | 'allocated' | 'picking' | 'shipped' | 'delivered' | 'completed' | 'cancelled' | 'refunded' | 'returned' | 'partial_shipped';

export interface OrderItem {
  id: number;
  orderId: number;
  productId: number;
  quantity: number;
  price: number;
  productName: string;
  productModel: string;
}

export interface JwtPayload {
  userId: number;
  email: string;
  role: 'customer' | 'admin';
}
