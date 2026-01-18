export interface RoomDimensions {
  length: number;
  width: number;
  height: number;
  unit: 'ft' | 'meters';
}

export interface Wall {
  start: { x: number; z: number };
  end: { x: number; z: number };
  length: number;
  cardinal?: string;
}

export interface RoomShape {
  type: 'rectangle' | 'L-shape' | 'custom';
  vertices?: { x: number; y: number }[];
  walls?: Wall[];
  corners?: { x: number; z: number }[];
  roomType?: string;
}

export interface DoorWindow {
  type: 'door' | 'window';
  position: { x: number; y: number };
  width: number;
  orientation: 'north' | 'south' | 'east' | 'west';
}

export interface Door {
  x: number;
  z: number;
  width: number;
  wall: string;
  cardinal?: string;
}

export interface Window {
  x: number;
  z: number;
  width: number;
  height: number;
  wall: string;
  cardinal?: string;
}

export interface RoomData {
  dimensions: RoomDimensions;
  shape: RoomShape;
  doors?: Door[];
  windows?: Window[];
  floorplanImageUrl?: string;
  photoUrls?: string[];
  cardinal?: {
    north: string;
    orientation: number;
  };
}

export interface RoomAnalysis {
  dimensions: RoomDimensions;
  detectedFurniture: string[];
  roomType: 'bedroom' | 'living-room' | 'kitchen' | 'office' | 'dining-room' | 'other';
  style: string;
  colorPalette: string[];
  lighting: 'bright' | 'medium' | 'dim';
}
