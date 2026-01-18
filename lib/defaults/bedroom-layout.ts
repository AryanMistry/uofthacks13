import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';
import { IdentityProfile } from '@/lib/types/identity';

// Color palettes based on personality
export const COLOR_PALETTES = {
  warm: {
    primary: '#D2691E', // Chocolate
    secondary: '#CD853F', // Peru
    accent: '#FF8C00', // Dark Orange
    wood: '#8B4513', // Saddle Brown
    fabric: '#F4A460', // Sandy Brown
    wall: '#FFF8DC', // Cornsilk
    floor: '#A0522D', // Sienna
  },
  cool: {
    primary: '#4682B4', // Steel Blue
    secondary: '#5F9EA0', // Cadet Blue
    accent: '#6A5ACD', // Slate Blue
    wood: '#2F4F4F', // Dark Slate Gray
    fabric: '#708090', // Slate Gray
    wall: '#F0F8FF', // Alice Blue
    floor: '#696969', // Dim Gray
  },
  neutral: {
    primary: '#808080', // Gray
    secondary: '#A9A9A9', // Dark Gray
    accent: '#D2B48C', // Tan
    wood: '#8B7355', // Burly Wood dark
    fabric: '#C0C0C0', // Silver
    wall: '#FAF0E6', // Linen
    floor: '#B8860B', // Dark Goldenrod
  },
  bold: {
    primary: '#9B2335', // Deep Red
    secondary: '#2E8B57', // Sea Green
    accent: '#FFD700', // Gold
    wood: '#4A0E0E', // Dark Mahogany
    fabric: '#800080', // Purple
    wall: '#FFFAF0', // Floral White
    floor: '#1C1C1C', // Almost Black
  },
  pastel: {
    primary: '#E6B8AF', // Dusty Rose
    secondary: '#B5D8CC', // Sage
    accent: '#F4D6CC', // Peach
    wood: '#D4A574', // Light Oak
    fabric: '#E8D5E8', // Lavender
    wall: '#FFF5EE', // Seashell
    floor: '#DEB887', // Burlywood
  },
  minimalist: {
    primary: '#F5F5F5', // White Smoke
    secondary: '#E0E0E0', // Light Gray
    accent: '#1C1C1C', // Almost Black
    wood: '#D4C4B0', // Light Wood
    fabric: '#FFFFFF', // White
    wall: '#FFFFFF', // Pure White
    floor: '#F0EAD6', // Eggshell
  },
  nature: {
    primary: '#556B2F', // Dark Olive Green
    secondary: '#8FBC8F', // Dark Sea Green
    accent: '#DAA520', // Goldenrod
    wood: '#5D4E37', // Dark Brown
    fabric: '#F5F5DC', // Beige
    wall: '#FAFAD2', // Light Goldenrod
    floor: '#8B7355', // Oak
  },
  urban: {
    primary: '#2C3E50', // Dark Blue Gray
    secondary: '#34495E', // Wet Asphalt
    accent: '#1ABC9C', // Turquoise
    wood: '#2C2C2C', // Charcoal
    fabric: '#3498DB', // Blue
    wall: '#ECF0F1', // Clouds
    floor: '#1C1C1C', // Almost Black
  },
};

// Get color palette based on identity profile
export function getColorPaletteFromProfile(profile?: IdentityProfile): typeof COLOR_PALETTES.neutral {
  if (!profile) return COLOR_PALETTES.neutral;
  
  // Check color preferences first
  if (profile.colorPreferences?.includes('warm') || profile.viewPreference === 'nature') {
    return COLOR_PALETTES.warm;
  }
  if (profile.colorPreferences?.includes('cool') || profile.viewPreference === 'urban') {
    return COLOR_PALETTES.cool;
  }
  if (profile.colorPreferences?.includes('bold')) {
    return COLOR_PALETTES.bold;
  }
  if (profile.colorPreferences?.includes('pastel')) {
    return COLOR_PALETTES.pastel;
  }
  
  // Check chaos level
  if (profile.chaosLevel === 'minimalist') {
    return COLOR_PALETTES.minimalist;
  }
  
  // Check material preference
  if (profile.materialPreference === 'analog') {
    return COLOR_PALETTES.nature;
  }
  if (profile.materialPreference === 'futurist') {
    return COLOR_PALETTES.urban;
  }
  
  return COLOR_PALETTES.neutral;
}

// Generate bedroom furniture with personality-based colors
export function generateBedroomFurniture(profile?: IdentityProfile): SegmentedObject[] {
  const colors = getColorPaletteFromProfile(profile);
  
  const baseFurniture: SegmentedObject[] = [
    {
      id: 'default-bed-1',
      label: 'queen bed',
      category: 'furniture',
      maskUrl: '',
      croppedImageUrl: '',
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      estimatedDimensions: { length: 6.5, width: 5, height: 2.5, unit: 'ft' },
      confidence: 1,
      position3D: { x: 0, y: 0, z: -3, rotation: 0 },
      detectedColor: colors.wood,
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
      position3D: { x: -4.5, y: 0, z: -3, rotation: 0 },
      detectedColor: colors.wood,
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
      position3D: { x: 4.5, y: 0, z: -3, rotation: 0 },
      detectedColor: colors.wood,
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
      detectedColor: colors.accent,
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
      detectedColor: colors.accent,
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
      position3D: { x: 5.5, y: 0, z: 0, rotation: -Math.PI / 2 },
      detectedColor: colors.wood,
      material: 'wood',
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
      position3D: { x: -5.5, y: 0, z: 1, rotation: Math.PI / 2 },
      detectedColor: colors.wood,
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
      position3D: { x: -4, y: 0, z: 4, rotation: Math.PI * 0.75 },
      detectedColor: colors.fabric,
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
      position3D: { x: 0, y: 0, z: -0.5, rotation: 0 },
      detectedColor: colors.secondary,
      material: 'wool',
      style: 'modern',
    },
  ];

  // Add more items for maximalists
  if (profile?.chaosLevel === 'maximalist' || profile?.emptySpaceFeeling === 'boring') {
    baseFurniture.push(
      {
        id: 'default-plant-1',
        label: 'floor plant',
        category: 'decoration',
        maskUrl: '',
        croppedImageUrl: '',
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        estimatedDimensions: { length: 1.5, width: 1.5, height: 4, unit: 'ft' },
        confidence: 1,
        position3D: { x: 5.5, y: 0, z: 4.5, rotation: 0 },
        detectedColor: '#228B22',
        material: 'natural',
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
        position3D: { x: 5.8, y: 3, z: 0, rotation: -Math.PI / 2 },
        detectedColor: '#C0C0C0',
        material: 'glass',
        style: 'modern',
      }
    );
  }

  return baseFurniture;
}

// Generate living room furniture with personality-based colors
export function generateLivingRoomFurniture(profile?: IdentityProfile): SegmentedObject[] {
  const colors = getColorPaletteFromProfile(profile);
  
  const baseFurniture: SegmentedObject[] = [
    {
      id: 'default-sofa-1',
      label: 'sectional sofa',
      category: 'furniture',
      maskUrl: '',
      croppedImageUrl: '',
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      estimatedDimensions: { length: 8, width: 3.5, height: 2.8, unit: 'ft' },
      confidence: 1,
      position3D: { x: -1, y: 0, z: -4.5, rotation: 0 },
      detectedColor: colors.fabric,
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
      position3D: { x: -1, y: 0, z: -1, rotation: 0 },
      detectedColor: colors.wood,
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
      position3D: { x: -1, y: 0, z: 5.5, rotation: Math.PI },
      detectedColor: colors.wood,
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
      position3D: { x: -1, y: 2, z: 5.5, rotation: Math.PI },
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
      position3D: { x: 5.5, y: 0, z: -2, rotation: -Math.PI / 4 },
      detectedColor: colors.primary,
      material: 'fabric',
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
      position3D: { x: -1, y: 0, z: -1, rotation: 0 },
      detectedColor: colors.secondary,
      material: 'wool',
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
      position3D: { x: 4.5, y: 0, z: -4.5, rotation: 0 },
      detectedColor: colors.accent,
      material: 'metal',
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
      position3D: { x: 7.5, y: 0, z: 2, rotation: -Math.PI / 2 },
      detectedColor: colors.wood,
      material: 'wood',
      style: 'modern',
    },
  ];

  // Add loveseat for social/host personalities
  if (profile?.isHost || profile?.socialStyle === 'extrovert') {
    baseFurniture.push({
      id: 'default-loveseat-1',
      label: 'loveseat',
      category: 'furniture',
      maskUrl: '',
      croppedImageUrl: '',
      boundingBox: { x: 0, y: 0, width: 0, height: 0 },
      estimatedDimensions: { length: 4.5, width: 3, height: 2.8, unit: 'ft' },
      confidence: 1,
      position3D: { x: -6.5, y: 0, z: -1.5, rotation: Math.PI / 2 },
      detectedColor: colors.fabric,
      material: 'fabric',
      style: 'modern',
    });
  }

  // Add more decorations for maximalists
  if (profile?.chaosLevel === 'maximalist' || profile?.emptySpaceFeeling === 'boring') {
    baseFurniture.push(
      {
        id: 'default-plant-lr-1',
        label: 'floor plant',
        category: 'decoration',
        maskUrl: '',
        croppedImageUrl: '',
        boundingBox: { x: 0, y: 0, width: 0, height: 0 },
        estimatedDimensions: { length: 1.8, width: 1.8, height: 5, unit: 'ft' },
        confidence: 1,
        position3D: { x: -7.5, y: 0, z: 5, rotation: 0 },
        detectedColor: '#228B22',
        material: 'natural',
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
        position3D: { x: 4.5, y: 0, z: -0.5, rotation: 0 },
        detectedColor: colors.wood,
        material: 'wood',
        style: 'modern',
      }
    );
  }

  return baseFurniture;
}

export function getDefaultRoomResult(type: 'bedroom' | 'living-room', profile?: IdentityProfile): SegmentationResult {
  const colors = getColorPaletteFromProfile(profile);
  
  const objects = type === 'bedroom' 
    ? generateBedroomFurniture(profile) 
    : generateLivingRoomFurniture(profile);
  
  const dimensions = type === 'bedroom'
    ? { length: 14, width: 12, height: 9, unit: 'ft' as const }
    : { length: 18, width: 14, height: 10, unit: 'ft' as const };

  return {
    originalImageUrl: '',
    objects,
    roomDimensions: dimensions,
    wallColor: colors.wall,
    floorColor: colors.floor,
    lighting: profile?.chronotype?.includes('morning') ? 'warm' : 
              profile?.chronotype?.includes('night') ? 'cool' : 'natural',
  };
}

// Legacy exports for backwards compatibility
export const DEFAULT_BEDROOM_FURNITURE = generateBedroomFurniture();
export const DEFAULT_BEDROOM_RESULT = getDefaultRoomResult('bedroom');
export const DEFAULT_LIVING_ROOM_FURNITURE = generateLivingRoomFurniture();
export const DEFAULT_LIVING_ROOM_RESULT = getDefaultRoomResult('living-room');

export type RoomType = 'bedroom' | 'living-room';

export function getDefaultRoomLayout(type: RoomType, profile?: IdentityProfile): SegmentationResult {
  return getDefaultRoomResult(type, profile);
}
