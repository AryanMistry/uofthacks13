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
}
