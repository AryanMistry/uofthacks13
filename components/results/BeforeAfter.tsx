'use client';

import { useState } from 'react';
import { RoomData } from '@/lib/types/room';
import { Product } from '@/lib/types/product';
import { RoomCanvas } from '@/components/room-viewer/RoomCanvas';

interface BeforeAfterProps {
  roomData: RoomData;
  furniture: Product[];
  onFurnitureClick?: (product: Product) => void;
}

export function BeforeAfter({ roomData, furniture, onFurnitureClick }: BeforeAfterProps) {
  const [showBefore, setShowBefore] = useState(false);
  
  console.log('BeforeAfter - furniture count:', furniture?.length, 'showBefore:', showBefore);

  return (
    <div className="relative w-full h-[600px] rounded-lg overflow-hidden border-2 border-gray-300">
      <div className="absolute inset-0">
        <RoomCanvas
          roomData={roomData}
          furniture={furniture}
          showBefore={showBefore}
          onFurnitureClick={onFurnitureClick}
          editMode={!showBefore}
        />
      </div>
      
      {/* Toggle overlay */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="bg-white/95 backdrop-blur-sm rounded-full p-1 shadow-lg flex items-center gap-1">
          <button
            onClick={() => setShowBefore(true)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              showBefore
                ? 'bg-gray-900 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Before
          </button>
          <button
            onClick={() => setShowBefore(false)}
            className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${
              !showBefore
                ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            After ✨
          </button>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm">
        {showBefore ? '🏠 Original Room' : '✨ Redesigned Room'}
      </div>

      {/* Edit mode hint */}
      {!showBefore && (
        <div className="absolute top-4 right-4 bg-indigo-600/90 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-medium shadow-sm">
          Click furniture to edit
        </div>
      )}
    </div>
  );
}
