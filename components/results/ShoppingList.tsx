'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ProductCard } from './ProductCard';
import { Product, ShoppingList as ShoppingListType } from '@/lib/types/product';

interface ShoppingListProps {
  shoppingList: ShoppingListType;
  onProductClick?: (product: Product) => void;
}

export function ShoppingList({ shoppingList, onProductClick }: ShoppingListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopping List</CardTitle>
        <CardDescription>
          {shoppingList.products.length} items • Total: {shoppingList.currency} {shoppingList.totalPrice.toLocaleString()}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shoppingList.products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onSelect={onProductClick}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
