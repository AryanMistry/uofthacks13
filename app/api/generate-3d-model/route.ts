import { NextRequest, NextResponse } from 'next/server';
import { SegmentedObject, RoomDoor, RoomWindow } from '@/lib/types/segmentation';
import { IdentityProfile, ACTIVITY_ITEMS, getDesignParameters, LifestyleActivity } from '@/lib/types/identity';
import { getOnlineModelUrl } from '@/lib/3d/asset-library';

// Items that are flat on the floor and other items can be placed on top
const FLOOR_COVERINGS = ['rug', 'carpet', 'mat', 'floor mat'];

// Y-axis stacking rules: what goes on top of what
const STACKING_RULES: Record<string, { stackOn: string[]; heightOffset: number }> = {
  'tv': { stackOn: ['tv stand', 'console', 'dresser', 'media console', 'cabinet'], heightOffset: 0 },
  'television': { stackOn: ['tv stand', 'console', 'dresser', 'media console', 'cabinet'], heightOffset: 0 },
  'monitor': { stackOn: ['desk', 'tv stand', 'console'], heightOffset: 0 },
  'table lamp': { stackOn: ['nightstand', 'side table', 'end table', 'desk', 'dresser', 'table'], heightOffset: 0 },
  'lamp': { stackOn: ['nightstand', 'side table', 'end table', 'desk', 'table'], heightOffset: 0 },
  'vase': { stackOn: ['table', 'console', 'shelf', 'dresser', 'nightstand'], heightOffset: 0 },
  'clock': { stackOn: ['nightstand', 'desk', 'shelf', 'dresser'], heightOffset: 0 },
  'books': { stackOn: ['table', 'desk', 'shelf', 'nightstand'], heightOffset: 0 },
  'decoration': { stackOn: ['table', 'shelf', 'console', 'dresser'], heightOffset: 0 },
  'dumbbells': { stackOn: ['floor'], heightOffset: 0 },
  'dumbbell': { stackOn: ['floor'], heightOffset: 0 },
  'yoga mat': { stackOn: ['floor'], heightOffset: 0 },
};

// Smart furniture placement rules
const PLACEMENT_RULES: Record<string, {
  preferredPosition: 'wall' | 'center' | 'corner' | 'beside' | 'floating' | 'on-top' | 'floor-covering' | 'near-window';
  wallPreference?: 'back' | 'left' | 'right' | 'front' | 'any' | 'window';
  nearTo?: string[];
  awayFrom?: string[];
  minSpacingFeet: number;
  zOffset?: number;
  faceDirection?: 'inward' | 'outward' | 'forward' | 'toward-window' | 'away-window';
  stackable?: boolean;
}> = {
  'sofa': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.5, faceDirection: 'inward' },
  'couch': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.5, faceDirection: 'inward' },
  'sectional': { preferredPosition: 'corner', minSpacingFeet: 1.5, faceDirection: 'inward' },
  'loveseat': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 1.5, zOffset: 0.5, faceDirection: 'inward' },
  'coffee table': { preferredPosition: 'center', nearTo: ['sofa', 'couch', 'sectional'], minSpacingFeet: 1.5, faceDirection: 'forward' },
  'dining table': { preferredPosition: 'center', minSpacingFeet: 2, faceDirection: 'forward' },
  'bed': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.3, faceDirection: 'toward-window' },
  'nightstand': { preferredPosition: 'beside', nearTo: ['bed'], minSpacingFeet: 0.2, faceDirection: 'forward' },
  'desk': { preferredPosition: 'near-window', wallPreference: 'window', minSpacingFeet: 1.5, zOffset: 0.5, faceDirection: 'away-window' },
  'chair': { preferredPosition: 'floating', nearTo: ['desk', 'dining table', 'table'], minSpacingFeet: 0.5, faceDirection: 'toward-related' },
  'dining chair': { preferredPosition: 'floating', nearTo: ['dining table', 'table'], minSpacingFeet: 0.3, faceDirection: 'toward-related' },
  'office chair': { preferredPosition: 'floating', nearTo: ['desk'], minSpacingFeet: 0.5, faceDirection: 'toward-related' },
  'gaming chair': { preferredPosition: 'floating', nearTo: ['desk', 'gaming desk'], minSpacingFeet: 0.5, faceDirection: 'outward' },
  'armchair': { preferredPosition: 'corner', minSpacingFeet: 1, faceDirection: 'inward' },
  'reading chair': { preferredPosition: 'near-window', minSpacingFeet: 1, faceDirection: 'inward' },
  'tv': { preferredPosition: 'on-top', nearTo: ['tv stand', 'console', 'media console', 'dresser', 'cabinet'], minSpacingFeet: 0, faceDirection: 'inward', stackable: true },
  'television': { preferredPosition: 'on-top', nearTo: ['tv stand', 'console', 'media console', 'dresser', 'cabinet'], minSpacingFeet: 0, faceDirection: 'inward', stackable: true },
  'tv stand': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 1.5, zOffset: 0.3, faceDirection: 'inward' },
  'media console': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 1.5, zOffset: 0.3, faceDirection: 'inward' },
  'bookshelf': { preferredPosition: 'wall', wallPreference: 'right', minSpacingFeet: 0.3, zOffset: 0.2, faceDirection: 'inward' },
  'shelf': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.3, zOffset: 0.2, faceDirection: 'inward' },
  'wardrobe': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 0.3, zOffset: 0.2, faceDirection: 'inward' },
  'closet': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 0.3, zOffset: 0.2, faceDirection: 'inward' },
  'dresser': { preferredPosition: 'wall', wallPreference: 'right', minSpacingFeet: 0.5, zOffset: 0.3, faceDirection: 'inward' },
  'cabinet': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.3, zOffset: 0.2, faceDirection: 'inward' },
  'lamp': { preferredPosition: 'corner', minSpacingFeet: 0.5, faceDirection: 'forward' },
  'floor lamp': { preferredPosition: 'corner', minSpacingFeet: 0.5, faceDirection: 'forward' },
  'table lamp': { preferredPosition: 'on-top', nearTo: ['nightstand', 'side table', 'desk', 'dresser'], minSpacingFeet: 0, faceDirection: 'forward', stackable: true },
  'plant': { preferredPosition: 'corner', minSpacingFeet: 0.5, faceDirection: 'forward' },
  'rug': { preferredPosition: 'floor-covering', minSpacingFeet: 0, faceDirection: 'forward' },
  'carpet': { preferredPosition: 'floor-covering', minSpacingFeet: 0, faceDirection: 'forward' },
  'area rug': { preferredPosition: 'floor-covering', minSpacingFeet: 0, faceDirection: 'forward' },
  'mirror': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.2, zOffset: 0.1, faceDirection: 'inward' },
  'ottoman': { preferredPosition: 'center', nearTo: ['sofa', 'armchair'], minSpacingFeet: 0.8, faceDirection: 'forward' },
  'bench': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.8, zOffset: 0.3, faceDirection: 'inward' },
  'console': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 0.5, zOffset: 0.2, faceDirection: 'inward' },
  'side table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair', 'bed'], minSpacingFeet: 0.3, faceDirection: 'forward' },
  'end table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair'], minSpacingFeet: 0.3, faceDirection: 'forward' },
  'vase': { preferredPosition: 'on-top', nearTo: ['table', 'console', 'dresser'], minSpacingFeet: 0, faceDirection: 'forward', stackable: true },
  // Fitness items
  'dumbbells': { preferredPosition: 'corner', minSpacingFeet: 0.3, faceDirection: 'forward' },
  'dumbbell': { preferredPosition: 'corner', minSpacingFeet: 0.3, faceDirection: 'forward' },
  'yoga mat': { preferredPosition: 'floor-covering', minSpacingFeet: 0.5, faceDirection: 'forward' },
  'exercise bench': { preferredPosition: 'center', minSpacingFeet: 2, faceDirection: 'forward' },
  // Music items
  'keyboard stand': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 1, faceDirection: 'inward' },
  'guitar stand': { preferredPosition: 'corner', minSpacingFeet: 0.3, faceDirection: 'forward' },
  'speaker': { preferredPosition: 'corner', minSpacingFeet: 0.5, faceDirection: 'inward' },
  // Meditation
  'meditation cushion': { preferredPosition: 'corner', minSpacingFeet: 0.5, faceDirection: 'inward' },
  'candle holder': { preferredPosition: 'on-top', nearTo: ['table', 'shelf', 'nightstand'], minSpacingFeet: 0, faceDirection: 'forward', stackable: true },
};

// Wall rotations
const WALL_ROTATIONS: Record<string, number> = {
  'back': 0,
  'front': Math.PI,
  'left': Math.PI / 2,
  'right': -Math.PI / 2,
};

// Identity-based items to add based on activities and preferences
function getIdentityItems(profile: IdentityProfile | undefined): SegmentedObject[] {
  if (!profile) return [];

  const items: SegmentedObject[] = [];
  const params = getDesignParameters(profile);
  const activities = profile.activities || [];

  // Add items based on activities
  for (const activity of activities) {
    const activityConfig = ACTIVITY_ITEMS[activity as LifestyleActivity];
    if (activityConfig) {
      // Add 1-2 items per activity depending on chaos level
      const itemCount = params.furnitureCount === 'dense' ? 2 : 1;
      for (let i = 0; i < Math.min(itemCount, activityConfig.items.length); i++) {
        const itemName = activityConfig.items[i];

        // Check if this item type already exists
        if (!items.some(it => it.label.includes(itemName))) {
          items.push(createIdentityItem(itemName, activity));
        }
      }
    }
  }

  // Add items based on social style
  if (profile.isHost || profile.socialStyle === 'extrovert') {
    if (!items.some(it => it.label.includes('ottoman') || it.label.includes('extra'))) {
      items.push(createIdentityItem('ottoman', 'hosting'));
    }
  }

  // Add window treatment based on chronotype
  if ((profile.chronotype?.includes('morning') || profile.preferNaturalLight) &&
    !items.some(it => it.label.includes('curtain'))) {
    items.push(createIdentityItem('sheer curtains', 'morning'));
  } else if ((profile.chronotype?.includes('night') || profile.preferDarkRoom) &&
    !items.some(it => it.label.includes('curtain') || it.label.includes('blind'))) {
    items.push(createIdentityItem('blackout curtains', 'night'));
  }

  // Add decorations based on chaos level
  if (params.decorationCount === 'dense') {
    if (!items.some(it => it.label.includes('plant'))) {
      items.push(createIdentityItem('plant', 'decoration'));
    }
    items.push(createIdentityItem('wall art', 'decoration'));
    items.push(createIdentityItem('decorative vase', 'decoration'));
  }

  // Add RGB lighting for tech-visible preference
  if (profile.techVisibility === 'visible' && !items.some(it => it.label.includes('rgb'))) {
    items.push(createIdentityItem('rgb light strip', 'tech'));
  }

  return items;
}

function createIdentityItem(name: string, source: string): SegmentedObject {
  const dimensions = getItemDimensions(name);
  return {
    id: `identity-${name.replace(/\s+/g, '-')}-${Date.now()}`,
    label: name,
    category: getCategoryForItem(name),
    maskUrl: '',
    croppedImageUrl: '',
    boundingBox: { x: 0, y: 0, width: 0, height: 0 },
    estimatedDimensions: { ...dimensions, unit: 'ft' },
    confidence: 1.0,
    position3D: { x: 0, y: 0, z: 0, rotation: 0 },
    detectedColor: getColorForItem(name, source),
    material: getMaterialForItem(name),
  };
}

function getItemDimensions(name: string): { length: number; width: number; height: number } {
  const dims: Record<string, { length: number; width: number; height: number }> = {
    'desk': { length: 4, width: 2, height: 2.5 },
    'office chair': { length: 2, width: 2, height: 3.5 },
    'gaming chair': { length: 2.5, width: 2.5, height: 4 },
    'bookshelf': { length: 3, width: 1, height: 5.5 },
    'floor lamp': { length: 1.2, width: 1.2, height: 5 },
    'reading chair': { length: 2.5, width: 2.5, height: 3 },
    'dumbbells': { length: 1.5, width: 0.5, height: 0.5 },
    'yoga mat': { length: 6, width: 2, height: 0.05 },
    'mirror': { length: 0.1, width: 3, height: 5 },
    'keyboard stand': { length: 3, width: 1.5, height: 2.5 },
    'guitar stand': { length: 1, width: 1, height: 3 },
    'speaker': { length: 1, width: 1, height: 3 },
    'meditation cushion': { length: 1.5, width: 1.5, height: 0.5 },
    'candle holder': { length: 0.3, width: 0.3, height: 0.5 },
    'plant': { length: 1.2, width: 1.2, height: 3 },
    'ottoman': { length: 2, width: 2, height: 1.3 },
    'sheer curtains': { length: 0.2, width: 4, height: 7 },
    'blackout curtains': { length: 0.3, width: 4, height: 7 },
    'wall art': { length: 0.05, width: 2.5, height: 2 },
    'decorative vase': { length: 0.5, width: 0.5, height: 1.5 },
    'rgb light strip': { length: 0.1, width: 3, height: 0.1 },
    'desk lamp': { length: 0.5, width: 0.5, height: 1.5 },
  };
  return dims[name.toLowerCase()] || { length: 1, width: 1, height: 2 };
}

function getCategoryForItem(name: string): SegmentedObject['category'] {
  const lower = name.toLowerCase();
  if (lower.includes('lamp') || lower.includes('light')) return 'lighting';
  if (lower.includes('plant') || lower.includes('art') || lower.includes('vase') || lower.includes('mirror')) return 'decoration';
  if (lower.includes('curtain') || lower.includes('mat') || lower.includes('cushion')) return 'textile';
  if (lower.includes('shelf') || lower.includes('cabinet')) return 'storage';
  return 'furniture';
}

function getColorForItem(name: string, source: string): string {
  if (source === 'tech') return '#00FF00';
  if (name.includes('plant')) return '#228B22';
  if (name.includes('curtain')) return '#F5F5DC';
  if (name.includes('wood') || name.includes('desk') || name.includes('shelf')) return '#8B4513';
  return '#808080';
}

function getMaterialForItem(name: string): string {
  const lower = name.toLowerCase();
  if (lower.includes('chair') || lower.includes('sofa') || lower.includes('cushion')) return 'fabric';
  if (lower.includes('desk') || lower.includes('shelf') || lower.includes('stand')) return 'wood';
  if (lower.includes('lamp') || lower.includes('speaker') || lower.includes('rgb')) return 'metal';
  if (lower.includes('mirror')) return 'glass';
  return 'mixed';
}

function getPlacementRule(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [key, rule] of Object.entries(PLACEMENT_RULES)) {
    if (lowerLabel.includes(key)) return rule;
  }
  return { preferredPosition: 'floating' as const, minSpacingFeet: 1.5, faceDirection: 'forward' as const };
}

function isFloorCovering(label: string): boolean {
  const lower = label.toLowerCase();
  return FLOOR_COVERINGS.some(fc => lower.includes(fc));
}

interface PlacedItem {
  id: string;
  x: number;
  y: number;
  z: number;
  length: number;
  width: number;
  height: number;
  label: string;
  rotation: number;
  isFloorCovering: boolean;
}

function findStackTarget(label: string, placed: PlacedItem[]): PlacedItem | null {
  const lowerLabel = label.toLowerCase();

  for (const [itemType, rules] of Object.entries(STACKING_RULES)) {
    if (lowerLabel.includes(itemType)) {
      for (const targetType of rules.stackOn) {
        const target = placed.find(p => p.label.includes(targetType) && !p.isFloorCovering);
        if (target) {
          return target;
        }
      }
    }
  }

  return null;
}

function checkOverlap(
  x: number, z: number,
  length: number, width: number,
  placed: PlacedItem[],
  minSpacing: number,
  currentIsFloorCovering: boolean = false
): boolean {
  if (currentIsFloorCovering) return false;

  for (const item of placed) {
    if (item.isFloorCovering) continue;

    const dx = Math.abs(x - item.x);
    const dz = Math.abs(z - item.z);
    const minDx = (length / 2) + (item.length / 2) + minSpacing;
    const minDz = (width / 2) + (item.width / 2) + minSpacing;

    if (dx < minDx && dz < minDz) {
      return true;
    }
  }
  return false;
}

function findNonOverlappingPosition(
  targetX: number, targetZ: number,
  length: number, width: number,
  placed: PlacedItem[],
  minSpacing: number,
  roomL: number, roomW: number,
  isFloorCovering: boolean = false
): { x: number; z: number } {
  if (isFloorCovering) {
    return { x: targetX, z: targetZ };
  }

  if (!checkOverlap(targetX, targetZ, length, width, placed, minSpacing, isFloorCovering)) {
    return { x: targetX, z: targetZ };
  }

  const offsets: [number, number][] = [];
  for (let r = 1; r <= 10; r++) {
    const step = r * 1.5;
    offsets.push([step, 0], [-step, 0], [0, step], [0, -step]);
    offsets.push([step, step], [-step, step], [step, -step], [-step, -step]);
    offsets.push([step * 0.7, step * 0.7], [-step * 0.7, step * 0.7]);
  }

  for (const [dx, dz] of offsets) {
    const newX = targetX + dx;
    const newZ = targetZ + dz;

    const maxX = (roomL / 2) - (length / 2) - 0.5;
    const maxZ = (roomW / 2) - (width / 2) - 0.5;

    if (Math.abs(newX) <= maxX && Math.abs(newZ) <= maxZ) {
      if (!checkOverlap(newX, newZ, length, width, placed, minSpacing, isFloorCovering)) {
        return { x: newX, z: newZ };
      }
    }
  }

  const maxX = (roomL / 2) - (length / 2) - 1;
  const maxZ = (roomW / 2) - (width / 2) - 1;
  return {
    x: (Math.random() - 0.5) * maxX * 1.5,
    z: (Math.random() - 0.5) * maxZ * 1.5
  };
}

function getRotationForWall(wall: 'back' | 'left' | 'right' | 'front' | 'any'): number {
  if (wall === 'any') return 0;
  return WALL_ROTATIONS[wall] || 0;
}

function getCornerRotation(x: number, z: number): number {
  const angleToCenter = Math.atan2(-z, -x);
  return angleToCenter + Math.PI;
}

function getRotationToward(fromX: number, fromZ: number, toX: number, toZ: number): number {
  // Rotation so the object faces the target point (forward is +Z)
  return Math.atan2(toX - fromX, toZ - fromZ);
}

// Get the wall nearest to a window
function getWindowWall(windows: RoomWindow[] | undefined): 'back' | 'left' | 'right' | 'front' | null {
  if (!windows || windows.length === 0) return null;
  // Return the wall of the first window
  const wall = windows[0].wall;
  if (wall === 'back' || wall === 'left' || wall === 'right' || wall === 'front') {
    return wall;
  }
  return 'left'; // Default to left if unknown
}

// Calculate rotation to face toward or away from window
function getWindowFacingRotation(
  windows: RoomWindow[] | undefined,
  faceToward: boolean
): number {
  const windowWall = getWindowWall(windows);
  if (!windowWall) return 0;

  // Rotation to face the window
  const towardRotations: Record<string, number> = {
    'back': Math.PI,      // Face toward back wall (where window is)
    'front': 0,           // Face toward front
    'left': -Math.PI / 2, // Face left
    'right': Math.PI / 2, // Face right
  };

  const rotation = towardRotations[windowWall] || 0;
  return faceToward ? rotation : rotation + Math.PI;
}

// Get position near a window
function getPositionNearWindow(
  windows: RoomWindow[] | undefined,
  roomL: number, roomW: number,
  objLength: number, objWidth: number
): { x: number; z: number } | null {
  if (!windows || windows.length === 0) return null;

  const win = windows[0];
  const halfL = roomL / 2;
  const halfW = roomW / 2;
  const padding = 1.5;

  // Position near the window but not blocking it
  switch (win.wall) {
    case 'left':
      return { x: -halfL + objLength / 2 + padding, z: win.z };
    case 'right':
      return { x: halfL - objLength / 2 - padding, z: win.z };
    case 'back':
      return { x: win.x, z: -halfW + objWidth / 2 + padding };
    case 'front':
      return { x: win.x, z: halfW - objWidth / 2 - padding };
    default:
      return null;
  }
}

interface SmartLayoutRequest {
  objects: SegmentedObject[];
  roomDimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'ft' | 'meters';
  };
  doors?: RoomDoor[];
  windows?: RoomWindow[];
  identityProfile?: IdentityProfile;
  useImagePositions?: boolean; // Whether to preserve image-detected positions
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objects, roomDimensions, doors, windows, identityProfile, useImagePositions } = body as SmartLayoutRequest;

    if (!objects || !Array.isArray(objects)) {
      return NextResponse.json({ error: 'No objects provided' }, { status: 400 });
    }

    const roomL = roomDimensions?.length || 20;
    const roomW = roomDimensions?.width || 16;
    const wallPadding = 1.0;

    // Get design parameters from identity profile
    const designParams = identityProfile ? getDesignParameters(identityProfile) : null;

    // Add identity-based items
    const identityItems = getIdentityItems(identityProfile);
    const allObjects = [...objects, ...identityItems];

    console.log('Smart layout for room:', roomL, 'x', roomW);
    console.log('Original objects:', objects.length, 'Identity items added:', identityItems.length);
    console.log('Windows:', windows?.length || 0, 'Doors:', doors?.length || 0);
    if (identityProfile?.activities) {
      console.log('Activities:', identityProfile.activities.join(', '));
    }

    const placedPositions: PlacedItem[] = [];

    // Priority order for placement
    const priorityOrder: Record<string, number> = {
      'floor-covering': -1,
      'near-window': 0.5, // Near window items get placed early
      wall: 0,
      corner: 1,
      center: 2,
      beside: 3,
      floating: 4,
      'on-top': 5
    };

    const sortedObjects = [...allObjects].sort((a, b) => {
      const ruleA = getPlacementRule(a.label);
      const ruleB = getPlacementRule(b.label);
      const priorityDiff = (priorityOrder[ruleA.preferredPosition] ?? 4) - (priorityOrder[ruleB.preferredPosition] ?? 4);

      if (priorityDiff !== 0) return priorityDiff;

      const sizeA = (a.estimatedDimensions?.length || 2) * (a.estimatedDimensions?.width || 2);
      const sizeB = (b.estimatedDimensions?.length || 2) * (b.estimatedDimensions?.width || 2);
      return sizeB - sizeA;
    });

    const positionedObjects = sortedObjects.map((obj) => {
      const rule = getPlacementRule(obj.label);
      const dims = obj.estimatedDimensions || { length: 2, width: 2, height: 2 };
      const objIsFloorCovering = isFloorCovering(obj.label);

      const halfRoomL = roomL / 2;
      const halfRoomW = roomW / 2;
      const halfObjL = dims.length / 2;
      const halfObjW = dims.width / 2;
      const zOff = rule.zOffset || 0.3;

      let targetX = 0;
      let targetZ = 0;
      let rotation = 0;
      let yPosition = 0;

      // Check if object has image-detected position and we should use it
      const hasImagePosition = obj.position3D &&
        (obj.position3D.x !== 0 || obj.position3D.z !== 0) &&
        useImagePositions;

      // If we have image positions, use them as starting point
      // Except for on-top items, which should always stack (TV on stand)
      if (hasImagePosition && obj.position3D && rule.preferredPosition !== 'on-top') {
        targetX = obj.position3D.x;
        targetZ = obj.position3D.z;
        rotation = obj.position3D.rotation || 0;
        console.log(`Using image position for ${obj.label}: (${targetX.toFixed(1)}, ${targetZ.toFixed(1)})`);
      } else {
        // Smart placement logic
        const wallPos = {
          back: { x: 0, z: -halfRoomW + halfObjW + wallPadding + zOff },
          front: { x: 0, z: halfRoomW - halfObjW - wallPadding - zOff },
          left: { x: -halfRoomL + halfObjL + wallPadding + zOff, z: 0 },
          right: { x: halfRoomL - halfObjL - wallPadding - zOff, z: 0 },
        };

        const corners = [
          { x: -halfRoomL + halfObjL + wallPadding + 1, z: -halfRoomW + halfObjW + wallPadding + 1 },
          { x: halfRoomL - halfObjL - wallPadding - 1, z: -halfRoomW + halfObjW + wallPadding + 1 },
          { x: -halfRoomL + halfObjL + wallPadding + 1, z: halfRoomW - halfObjW - wallPadding - 1 },
          { x: halfRoomL - halfObjL - wallPadding - 1, z: halfRoomW - halfObjW - wallPadding - 1 },
        ];

        let chosenWall: 'back' | 'left' | 'right' | 'front' = 'back';

        // Handle floor coverings
        if (rule.preferredPosition === 'floor-covering' || objIsFloorCovering) {
          targetX = 0;
          targetZ = 0;
          rotation = 0;
          yPosition = 0;
        }
        // Handle on-top items
        else if (rule.preferredPosition === 'on-top') {
          const stackTarget = findStackTarget(obj.label, placedPositions);

          if (stackTarget) {
            targetX = stackTarget.x;
            targetZ = stackTarget.z;
            rotation = stackTarget.rotation;
            yPosition = stackTarget.y + stackTarget.height;
            console.log(`✓ Stacking ${obj.label} on ${stackTarget.label}`);
          } else {
            targetX = 0;
            targetZ = halfRoomW - halfObjW - wallPadding - 0.3;
            rotation = Math.PI;
            yPosition = 2;
          }
        }
        // Near-window placement
        else if (rule.preferredPosition === 'near-window') {
          const windowPos = getPositionNearWindow(windows, roomL, roomW, dims.length, dims.width);
          if (windowPos) {
            targetX = windowPos.x;
            targetZ = windowPos.z;
            // Face away from window (toward room) for working
            rotation = getWindowFacingRotation(windows, false);
          } else {
            // Fallback to left wall
            targetX = wallPos.left.x;
            targetZ = 0;
            rotation = Math.PI / 2;
          }
        }
        else {
          switch (rule.preferredPosition) {
            case 'wall': {
              let wall = rule.wallPreference || 'back';

              // Special handling for beds with morning person preference
              if (obj.label.toLowerCase().includes('bed') && identityProfile?.preferNaturalLight) {
                const windowWall = getWindowWall(windows);
                if (windowWall) {
                  // Place bed so it faces the window
                  const oppositeWall: Record<string, 'back' | 'front' | 'left' | 'right'> = {
                    'back': 'front',
                    'front': 'back',
                    'left': 'right',
                    'right': 'left',
                  };
                  wall = oppositeWall[windowWall] || 'back';
                  console.log(`Morning person: Placing bed on ${wall} wall facing window on ${windowWall}`);
                }
              }

              if (wall === 'any' || wall === 'window') {
                const walls: ('back' | 'left' | 'right' | 'front')[] = ['back', 'left', 'right', 'front'];
                for (const w of walls) {
                  const pos = wallPos[w];
                  if (!checkOverlap(pos.x, pos.z, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                    targetX = pos.x;
                    targetZ = pos.z;
                    chosenWall = w;
                    break;
                  }
                }
              } else {
                const validWall = wall as 'back' | 'left' | 'right' | 'front';
                const pos = wallPos[validWall];
                targetX = pos.x;
                targetZ = pos.z;
                chosenWall = validWall;

                // Check if wall is occupied, offset along wall
                const wallItems = placedPositions.filter(p => {
                  if (p.isFloorCovering) return false;
                  if (validWall === 'back' || validWall === 'front') {
                    return Math.abs(p.z - pos.z) < 3;
                  }
                  return Math.abs(p.x - pos.x) < 3;
                });

                if (wallItems.length > 0) {
                  const offset = (wallItems.length * (dims.length + 1.5)) * (wallItems.length % 2 === 0 ? 1 : -1);
                  if (validWall === 'back' || validWall === 'front') {
                    targetX = offset;
                  } else {
                    targetZ = offset;
                  }
                }
              }

              rotation = getRotationForWall(chosenWall);

              // Special rotation for beds facing window
              if (obj.label.toLowerCase().includes('bed') && identityProfile?.preferNaturalLight) {
                rotation = getWindowFacingRotation(windows, true);
              }
              break;
            }

            case 'center': {
              if (obj.label.toLowerCase().includes('coffee')) {
                const sofa = placedPositions.find(p =>
                  (p.label.includes('sofa') || p.label.includes('couch') || p.label.includes('sectional')) && !p.isFloorCovering
                );
                if (sofa) {
                  targetX = sofa.x;
                  targetZ = sofa.z + sofa.width / 2 + dims.width / 2 + 2.5;
                  rotation = sofa.rotation;
                } else {
                  targetX = 0;
                  targetZ = 0;
                }
              } else if (obj.label.toLowerCase().includes('dining')) {
                targetX = 0;
                targetZ = -halfRoomW / 3;
              } else {
                targetX = 0;
                targetZ = 0;
              }
              break;
            }

            case 'corner': {
              for (let i = 0; i < corners.length; i++) {
                const corner = corners[i];
                if (!checkOverlap(corner.x, corner.z, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                  targetX = corner.x;
                  targetZ = corner.z;
                  break;
                }
              }
              rotation = getCornerRotation(targetX, targetZ);
              break;
            }

            case 'beside': {
              let placed = false;

              if (rule.nearTo) {
                for (const nearLabel of rule.nearTo) {
                  const nearItem = placedPositions.find(p => p.label.includes(nearLabel) && !p.isFloorCovering);
                  if (nearItem) {
                    let sideX = nearItem.x + nearItem.length / 2 + dims.length / 2 + 0.3;
                    let sideZ = nearItem.z;

                    if (!checkOverlap(sideX, sideZ, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                      targetX = sideX;
                      targetZ = sideZ;
                      rotation = nearItem.rotation;
                      placed = true;
                      break;
                    }

                    sideX = nearItem.x - nearItem.length / 2 - dims.length / 2 - 0.3;
                    if (!checkOverlap(sideX, sideZ, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                      targetX = sideX;
                      targetZ = sideZ;
                      rotation = nearItem.rotation;
                      placed = true;
                      break;
                    }
                  }
                }
              }

              if (!placed) {
                targetX = halfRoomL - halfObjL - wallPadding;
                targetZ = 0;
              }
              break;
            }

            case 'floating':
            default: {
              if (rule.nearTo) {
                for (const nearLabel of rule.nearTo) {
                  const nearItem = placedPositions.find(p => p.label.includes(nearLabel) && !p.isFloorCovering);
                  if (nearItem) {
                    targetX = nearItem.x;
                    targetZ = nearItem.z + nearItem.width / 2 + dims.width / 2 + 2;
                    // Chair faces the desk/table it's near
                    rotation = nearItem.rotation + Math.PI;
                    break;
                  }
                }
              } else {
                const gridSize = Math.ceil(Math.sqrt(sortedObjects.length));
                const idx = placedPositions.filter(p => !p.isFloorCovering).length;
                const gridX = (idx % gridSize) - gridSize / 2;
                const gridZ = Math.floor(idx / gridSize) - gridSize / 2;
                targetX = gridX * (roomL / (gridSize + 1));
                targetZ = gridZ * (roomW / (gridSize + 1));
              }
              break;
            }
          }
        }
      }

      // Bounds check (skip for on-top items)
      if (rule.preferredPosition !== 'on-top') {
        const maxX = halfRoomL - halfObjL - wallPadding;
        const maxZ = halfRoomW - halfObjW - wallPadding;
        targetX = Math.max(-maxX, Math.min(maxX, targetX));
        targetZ = Math.max(-maxZ, Math.min(maxZ, targetZ));
      }

      // Find non-overlapping position
      let finalPos = { x: targetX, z: targetZ };
      if (rule.preferredPosition !== 'on-top' && !objIsFloorCovering) {
        finalPos = findNonOverlappingPosition(
          targetX, targetZ,
          dims.length, dims.width,
          placedPositions,
          rule.minSpacingFeet,
          roomL, roomW,
          objIsFloorCovering
        );

        const maxX = halfRoomL - halfObjL - wallPadding;
        const maxZ = halfRoomW - halfObjW - wallPadding;
        finalPos.x = Math.max(-maxX, Math.min(maxX, finalPos.x));
        finalPos.z = Math.max(-maxZ, Math.min(maxZ, finalPos.z));
      }

      // Avoid doors
      if (doors && doors.length > 0 && !objIsFloorCovering && rule.preferredPosition !== 'on-top') {
        for (const door of doors) {
          const doorMinX = door.x - door.width / 2 - 2;
          const doorMaxX = door.x + door.width / 2 + 2;
          const doorMinZ = door.z - 3;
          const doorMaxZ = door.z + 3;

          if (finalPos.x > doorMinX && finalPos.x < doorMaxX &&
            finalPos.z > doorMinZ && finalPos.z < doorMaxZ) {
            finalPos.x += 4;
          }
        }
      }

      // Adjust rotation to face related items (desks/tables)
      if (rule.faceDirection === 'toward-related' && rule.nearTo) {
        const related = placedPositions.find(p =>
          rule.nearTo!.some(label => p.label.includes(label)) && !p.isFloorCovering
        );
        if (related) {
          rotation = getRotationToward(finalPos.x, finalPos.z, related.x, related.z);
        }
      }

      // Record position
      placedPositions.push({
        id: obj.id,
        x: rule.preferredPosition === 'on-top' ? targetX : finalPos.x,
        y: yPosition,
        z: rule.preferredPosition === 'on-top' ? targetZ : finalPos.z,
        length: dims.length,
        width: dims.width,
        height: dims.height || 2,
        label: obj.label.toLowerCase(),
        rotation: rotation,
        isFloorCovering: objIsFloorCovering,
      });

      const finalX = rule.preferredPosition === 'on-top' ? targetX : finalPos.x;
      const finalZ = rule.preferredPosition === 'on-top' ? targetZ : finalPos.z;

      console.log(`Placed ${obj.label} at (${finalX.toFixed(1)}, ${yPosition.toFixed(1)}, ${finalZ.toFixed(1)}) rot: ${(rotation * 180 / Math.PI).toFixed(0)}°`);

      return {
        ...obj,
        position3D: {
          x: finalX,
          y: yPosition,
          z: finalZ,
          rotation: rotation,
        },
        modelUrl: obj.modelUrl || getOnlineModelUrl(obj.label) || undefined,
        generationType: 'procedural' as const,
        isIdentityItem: obj.id.startsWith('identity-'),
      };
    });

    return NextResponse.json({
      success: true,
      models: positionedObjects,
      layoutInfo: {
        totalObjects: positionedObjects.length,
        identityItemsAdded: identityItems.length,
        roomDimensions: { length: roomL, width: roomW },
        windowCount: windows?.length || 0,
        doorCount: doors?.length || 0,
      },
    });
  } catch (error) {
    console.error('Layout generation error:', error);
    return NextResponse.json({ error: 'Failed to generate layout' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  return POST(request);
}
