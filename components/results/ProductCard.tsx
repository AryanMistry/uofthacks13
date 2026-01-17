'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types/product';
import { ExternalLink, ShoppingCart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect?: (product: Product) => void;
}

export function ProductCard({ product, onSelect }: ProductCardProps) {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      <div className="aspect-square bg-gray-100 relative">
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-400">
            No image
          </div>
        )}
      </div>
      <CardHeader>
        <CardTitle className="text-lg">{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="text-2xl font-bold">
            {product.currency} {product.price.toLocaleString()}
          </div>
          {product.brand && (
            <div className="text-sm text-muted-foreground">{product.brand}</div>
          )}
        </div>
        <div className="flex gap-2">
          {product.purchaseUrl && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => window.open(product.purchaseUrl, '_blank')}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View
            </Button>
          )}
          {onSelect && (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onSelect(product)}
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Select
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
