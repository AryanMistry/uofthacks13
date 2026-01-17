export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'ft' | 'meters';
}

export interface RoomShape {
  type: 'rectangle' | 'l-shape' | 'custom';
  vertices?: { x: number; y: number }[];
}

export interface DoorWindow {
  type: 'door' | 'window';
  position: { x: number; y: number };
  width: number;
  orientation: 'north' | 'south' | 'east' | 'west';
}

export interface RoomData {
  dimensions: RoomDimensions;
  shape: RoomShape;
  doors?: DoorWindow[];
  windows?: DoorWindow[];
  floorplanImageUrl?: string;
  photoUrls?: string[];
}

export interface RoomAnalysis {
  dimensions: RoomDimensions;
  detectedFurniture: string[];
  roomType: 'bedroom' | 'living-room' | 'kitchen' | 'office' | 'dining-room' | 'other';
  style: string;
  colorPalette: string[];
  lighting: 'bright' | 'medium' | 'dim';
}
