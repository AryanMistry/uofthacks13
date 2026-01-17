'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesignStore } from '@/lib/store/design-store';
import { RoomData, RoomDimensions, RoomShape } from '@/lib/types/room';

export function ManualInput() {
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [unit, setUnit] = useState<'ft' | 'meters'>('ft');
  const [shapeType, setShapeType] = useState<'rectangle' | 'l-shape'>('rectangle');
  const setRoomData = useDesignStore((state) => state.setRoomData);

  const handleSubmit = () => {
    const dimensions: RoomDimensions = {
      length: parseFloat(length),
      width: parseFloat(width),
      height: parseFloat(height) || 9,
      unit,
    };

    const shape: RoomShape = {
      type: shapeType,
    };

    const roomData: RoomData = {
      dimensions,
      shape,
    };

    setRoomData(roomData);
  };

  const isValid = length && width && height && 
    parseFloat(length) > 0 && 
    parseFloat(width) > 0 && 
    parseFloat(height) > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Manual Room Input</CardTitle>
        <CardDescription>
          Enter your room dimensions manually
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setUnit('ft')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              unit === 'ft'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Feet
          </button>
          <button
            onClick={() => setUnit('meters')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              unit === 'meters'
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            Meters
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">
              Length ({unit})
            </label>
            <Input
              type="number"
              step="0.1"
              value={length}
              onChange={(e) => setLength(e.target.value)}
              placeholder="12"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Width ({unit})
            </label>
            <Input
              type="number"
              step="0.1"
              value={width}
              onChange={(e) => setWidth(e.target.value)}
              placeholder="10"
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">
              Height ({unit})
            </label>
            <Input
              type="number"
              step="0.1"
              value={height}
              onChange={(e) => setHeight(e.target.value)}
              placeholder="9"
            />
          </div>
        </div>

        <div className="pt-4">
          <label className="text-sm font-medium mb-2 block">
            Room Shape
          </label>
          <div className="flex gap-2">
            <button
              onClick={() => setShapeType('rectangle')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                shapeType === 'rectangle'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              Rectangle
            </button>
            <button
              onClick={() => setShapeType('l-shape')}
              className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                shapeType === 'l-shape'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              L-Shape
            </button>
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!isValid}
          className="w-full mt-6"
        >
          Continue
        </Button>
      </CardContent>
    </Card>
  );
}
