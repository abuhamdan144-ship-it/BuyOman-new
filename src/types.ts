export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  oldPrice?: number;
  imageEmoji: string;
  description: string;
  specs: Record<string, string>;
  stock: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderTrack {
  orderId: string;
  customerName: string;
  status: 'Pending' | 'processing' | 'Shipped' | 'Delivered';
  location: string;
  updatedAt: string;
  steps: {
    title: string;
    description: string;
    time: string;
    done: boolean;
  }[];
}
