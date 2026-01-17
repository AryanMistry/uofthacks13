'use client';

import { useState } from 'react';
import { Slider } from '@/components/ui/slider';
import { RoomData } from '@/lib/types/room';
import { Product } from '@/lib/types/product';
import { RoomCanvas } from '@/components/room-viewer/RoomCanvas';

interface BeforeAfterProps {
  roomData: RoomData;
  furniture: Product[];
  onFurnitureClick?: (product: Product) => void;
}

export function BeforeAfter({ roomData, furniture, onFurnitureClick }: BeforeAfterProps) {
  // Start at 75 so we show the "After" (furnished) view by default
  const [sliderValue, setSliderValue] = useState([75]);
  const showBefore = sliderValue[0] < 50;
  
  console.log('BeforeAfter - furniture count:', furniture?.length, 'showBefore:', showBefore);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border-2 border-gray-300">
      <div className="absolute inset-0">
        <RoomCanvas
          roomData={roomData}
          furniture={furniture}
          showBefore={showBefore}
          onFurnitureClick={onFurnitureClick}
        />
      </div>
      
      {/* Slider overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 w-64 z-10">
        <div className="bg-white/90 backdrop-blur-sm rounded-lg p-4 shadow-lg">
          <div className="flex justify-between text-xs text-gray-600 mb-2">
            <span className="font-medium">Before</span>
            <span className="font-medium">After</span>
          </div>
          <Slider
            value={sliderValue}
            onValueChange={setSliderValue}
            min={0}
            max={100}
            step={1}
            className="w-full"
          />
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1 rounded text-sm font-medium">
        {showBefore ? 'Original Room' : 'Redesigned Room'}
      </div>
    </div>
  );
}
