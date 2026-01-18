export interface SegmentedObject {
  id: string;
  label: string;
  category: 'furniture' | 'lighting' | 'decoration' | 'textile' | 'storage' | 'unknown';
  maskUrl: string;
  croppedImageUrl: string;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  estimatedDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'ft' | 'meters';
  };
  modelUrl?: string;
  confidence: number;
  // 3D position calculated from image position
  position3D?: {
    x: number;
    y: number;
    z: number;
    rotation?: number;
  };
  // Additional styling info from AI
  detectedColor?: string;
  material?: string;
  style?: string;
  // Relationship info
  nearTo?: string[];
  againstWall?: boolean;
}

export interface RoomDoor {
  x: number;
  z: number;
  width: number;
  wall: 'front' | 'back' | 'left' | 'right' | string;
}

export interface RoomWindow {
  x: number;
  z: number;
  width: number;
  height: number;
  wall: 'front' | 'back' | 'left' | 'right' | string;
  hasBlinds?: boolean;
  hasCurtains?: boolean;
}

export interface Wall {
  start: { x: number; z: number };
  end: { x: number; z: number };
  length: number;
  cardinal?: string;
}

export interface RoomShape {
  type: 'rectangle' | 'L-shape' | 'custom';
  walls?: Wall[];
  corners?: { x: number; z: number }[];
}

export interface SegmentationResult {
  originalImageUrl: string;
  objects: SegmentedObject[];
  roomDimensions?: {
    length: number;
    width: number;
    height: number;
    unit: 'ft' | 'meters';
  };
  // Extended room styling info
  roomStyle?: string;
  wallColor?: string;
  floorColor?: string;
  lighting?: string;
  // Doors and windows
  doors?: RoomDoor[];
  windows?: RoomWindow[];
  roomType?: string;
  // Floorplan-based room shape
  roomShape?: RoomShape;
  cardinal?: {
    north: string;
    orientation: number;
  };
}
