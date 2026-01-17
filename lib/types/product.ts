export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  imageUrl: string;
  modelUrl?: string; // 3D model URL (.glb/.gltf)
  category: 'furniture' | 'lighting' | 'decoration' | 'textile' | 'storage';
  dimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'ft' | 'meters';
  };
  brand?: string;
  purchaseUrl?: string;
  position?: {
    x: number;
    y: number;
    z: number;
    rotation?: number;
  };
}

export interface ShoppingList {
  products: Product[];
  totalPrice: number;
  currency: string;
}
