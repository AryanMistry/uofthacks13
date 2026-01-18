import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';

// Default bedroom furniture layout
// Positions are in feet, relative to room center (0,0)
// Rotation is in radians around Y-axis (0 = facing +Z, PI/2 = facing +X, PI = facing -Z, -PI/2 = facing -X)
export const DEFAULT_BEDROOM_FURNITURE: SegmentedObject[] = [
  {
    id: 'default-bed-1',
    label: 'queen bed',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 6.5, width: 5, height: 2.5, unit: 'ft' },
    confidence: 1,
    position3D: { x: 0, y: 0, z: -3, rotation: 0 }, // Headboard against back wall, facing into room
    detectedColor: '#4A3728',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-nightstand-1',
    label: 'nightstand',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.5, width: 1.5, height: 2, unit: 'ft' },
    confidence: 1,
    position3D: { x: -4.5, y: 0, z: -3, rotation: 0 }, // Left of bed, facing same direction
    detectedColor: '#5C4033',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-nightstand-2',
    label: 'nightstand',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.5, width: 1.5, height: 2, unit: 'ft' },
    confidence: 1,
    position3D: { x: 4.5, y: 0, z: -3, rotation: 0 }, // Right of bed
    detectedColor: '#5C4033',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-lamp-1',
    label: 'table lamp',
    category: 'lighting',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 0.8, width: 0.8, height: 1.8, unit: 'ft' },
    confidence: 1,
    position3D: { x: -4.5, y: 2, z: -3, rotation: 0 },
    detectedColor: '#F5DEB3',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-lamp-2',
    label: 'table lamp',
    category: 'lighting',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 0.8, width: 0.8, height: 1.8, unit: 'ft' },
    confidence: 1,
    position3D: { x: 4.5, y: 2, z: -3, rotation: 0 },
    detectedColor: '#F5DEB3',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-dresser-1',
    label: 'dresser',
    category: 'storage',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 4.5, width: 1.5, height: 2.8, unit: 'ft' },
    confidence: 1,
    position3D: { x: 5.5, y: 0, z: 0, rotation: -Math.PI / 2 }, // Against right wall, facing left into room
    detectedColor: '#5C4033',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-mirror-1',
    label: 'wall mirror',
    category: 'decoration',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 0.1, width: 2.5, height: 4, unit: 'ft' },
    confidence: 1,
    position3D: { x: 5.8, y: 3, z: 0, rotation: -Math.PI / 2 }, // On right wall above dresser
    detectedColor: '#C0C0C0',
    material: 'glass',
    style: 'modern',
  },
  {
    id: 'default-wardrobe-1',
    label: 'wardrobe',
    category: 'storage',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 5, width: 2, height: 7, unit: 'ft' },
    confidence: 1,
    position3D: { x: -5.5, y: 0, z: 1, rotation: Math.PI / 2 }, // Against left wall, facing right into room
    detectedColor: '#654321',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-chair-1',
    label: 'accent chair',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 2.5, width: 2.5, height: 3, unit: 'ft' },
    confidence: 1,
    position3D: { x: -4, y: 0, z: 4, rotation: Math.PI * 0.75 }, // Corner, angled toward center
    detectedColor: '#708090',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-rug-1',
    label: 'area rug',
    category: 'textile',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 8, width: 6, height: 0.05, unit: 'ft' },
    confidence: 1,
    position3D: { x: 0, y: 0, z: -0.5, rotation: 0 }, // Under/in front of bed
    detectedColor: '#B8860B',
    material: 'wool',
    style: 'modern',
  },
  {
    id: 'default-plant-1',
    label: 'floor plant',
    category: 'decoration',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.5, width: 1.5, height: 4, unit: 'ft' },
    confidence: 1,
    position3D: { x: 5.5, y: 0, z: 4.5, rotation: 0 }, // Front right corner
    detectedColor: '#228B22',
    material: 'natural',
    style: 'modern',
  },
];

export const DEFAULT_BEDROOM_RESULT: SegmentationResult = {
  originalImageUrl: '',
  objects: DEFAULT_BEDROOM_FURNITURE,
  roomDimensions: {
    length: 14,
    width: 12,
    height: 9,
    unit: 'ft',
  },
  wallColor: '#F5F5F0',
  floorColor: '#C19A6B',
  lighting: 'warm',
};

// Living room default with proper rotations for L-shaped seating
export const DEFAULT_LIVING_ROOM_FURNITURE: SegmentedObject[] = [
  {
    id: 'default-sofa-1',
    label: 'sectional sofa',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 8, width: 3.5, height: 2.8, unit: 'ft' },
    confidence: 1,
    position3D: { x: -1, y: 0, z: -4.5, rotation: 0 }, // Against back wall, facing forward
    detectedColor: '#696969',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-loveseat-1',
    label: 'loveseat',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 4.5, width: 3, height: 2.8, unit: 'ft' },
    confidence: 1,
    position3D: { x: -6.5, y: 0, z: -1.5, rotation: Math.PI / 2 }, // Left side, perpendicular to sofa (L-shape)
    detectedColor: '#696969',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-coffee-table-1',
    label: 'coffee table',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 4, width: 2, height: 1.4, unit: 'ft' },
    confidence: 1,
    position3D: { x: -1, y: 0, z: -1, rotation: 0 }, // In front of sofa, centered
    detectedColor: '#8B4513',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-tv-stand-1',
    label: 'tv stand',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 5, width: 1.5, height: 2, unit: 'ft' },
    confidence: 1,
    position3D: { x: -1, y: 0, z: 5.5, rotation: Math.PI }, // Front wall, facing back toward sofa
    detectedColor: '#2F2F2F',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-tv-1',
    label: 'television',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 4, width: 0.3, height: 2.5, unit: 'ft' },
    confidence: 1,
    position3D: { x: -1, y: 2, z: 5.5, rotation: Math.PI }, // On TV stand, facing sofa
    detectedColor: '#1C1C1C',
    material: 'metal',
    style: 'modern',
  },
  {
    id: 'default-armchair-1',
    label: 'armchair',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 3, width: 3, height: 3, unit: 'ft' },
    confidence: 1,
    position3D: { x: 5.5, y: 0, z: -2, rotation: -Math.PI / 4 }, // Right side, angled toward TV/center
    detectedColor: '#4169E1',
    material: 'fabric',
    style: 'modern',
  },
  {
    id: 'default-floor-lamp-1',
    label: 'floor lamp',
    category: 'lighting',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.2, width: 1.2, height: 5.5, unit: 'ft' },
    confidence: 1,
    position3D: { x: 4.5, y: 0, z: -4.5, rotation: 0 }, // Behind sofa corner
    detectedColor: '#333333',
    material: 'metal',
    style: 'modern',
  },
  {
    id: 'default-side-table-1',
    label: 'side table',
    category: 'furniture',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.5, width: 1.5, height: 2, unit: 'ft' },
    confidence: 1,
    position3D: { x: 4.5, y: 0, z: -0.5, rotation: 0 }, // Next to armchair
    detectedColor: '#8B4513',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-bookshelf-1',
    label: 'bookshelf',
    category: 'storage',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 3.5, width: 1, height: 6, unit: 'ft' },
    confidence: 1,
    position3D: { x: 7.5, y: 0, z: 2, rotation: -Math.PI / 2 }, // Right wall, facing left into room
    detectedColor: '#8B4513',
    material: 'wood',
    style: 'modern',
  },
  {
    id: 'default-rug-lr-1',
    label: 'area rug',
    category: 'textile',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 10, width: 7, height: 0.05, unit: 'ft' },
    confidence: 1,
    position3D: { x: -1, y: 0, z: -1, rotation: 0 }, // Under coffee table and seating area
    detectedColor: '#708090',
    material: 'wool',
    style: 'modern',
  },
  {
    id: 'default-plant-lr-1',
    label: 'floor plant',
    category: 'decoration',
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { length: 1.8, width: 1.8, height: 5, unit: 'ft' },
    confidence: 1,
    position3D: { x: -7.5, y: 0, z: 5, rotation: 0 }, // Front left corner
    detectedColor: '#228B22',
    material: 'natural',
    style: 'modern',
  },
];

export const DEFAULT_LIVING_ROOM_RESULT: SegmentationResult = {
  originalImageUrl: '',
  objects: DEFAULT_LIVING_ROOM_FURNITURE,
  roomDimensions: {
    length: 18,
    width: 14,
    height: 10,
    unit: 'ft',
  },
  wallColor: '#FAF0E6',
  floorColor: '#B8860B',
  lighting: 'natural',
};

export type RoomType = 'bedroom' | 'living-room';

export function getDefaultRoomLayout(type: RoomType): SegmentationResult {
  switch (type) {
    case 'bedroom':
      return DEFAULT_BEDROOM_RESULT;
    case 'living-room':
      return DEFAULT_LIVING_ROOM_RESULT;
    default:
      return DEFAULT_BEDROOM_RESULT;
  }
}
