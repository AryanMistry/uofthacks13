import { NextRequest, NextResponse } from 'next/server';
import { SegmentedObject } from '@/lib/types/segmentation';

// Y-axis stacking rules: what goes on top of what
const STACKING_RULES: Record<string, { stackOn: string[]; heightOffset: number }> = {
  'tv': { stackOn: ['tv stand', 'console', 'dresser', 'media console'], heightOffset: 0 },
  'television': { stackOn: ['tv stand', 'console', 'dresser', 'media console'], heightOffset: 0 },
  'table lamp': { stackOn: ['nightstand', 'side table', 'end table', 'desk', 'dresser'], heightOffset: 0 },
  'lamp': { stackOn: ['nightstand', 'side table', 'end table', 'desk'], heightOffset: 0 },
  'vase': { stackOn: ['table', 'console', 'shelf', 'dresser'], heightOffset: 0 },
  'clock': { stackOn: ['nightstand', 'desk', 'shelf'], heightOffset: 0 },
  'books': { stackOn: ['table', 'desk', 'shelf'], heightOffset: 0 },
  'decoration': { stackOn: ['table', 'shelf', 'console', 'dresser'], heightOffset: 0 },
};

// Smart furniture placement rules with rotation info
const PLACEMENT_RULES: Record<string, {
  preferredPosition: 'wall' | 'center' | 'corner' | 'beside' | 'floating' | 'on-top';
  wallPreference?: 'back' | 'left' | 'right' | 'front' | 'any';
  nearTo?: string[];
  awayFrom?: string[];
  minSpacingFeet: number;
  zOffset?: number;
  faceDirection?: 'inward' | 'outward' | 'forward';
  stackable?: boolean; // Can this item be placed on top of others?
}> = {
  'sofa': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 2, zOffset: 0.5, faceDirection: 'inward' },
  'couch': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 2, zOffset: 0.5, faceDirection: 'inward' },
  'sectional': { preferredPosition: 'corner', minSpacingFeet: 2, faceDirection: 'inward' },
  'loveseat': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 1.5, zOffset: 0.5, faceDirection: 'inward' },
  'coffee table': { preferredPosition: 'center', nearTo: ['sofa', 'couch', 'sectional'], minSpacingFeet: 2, faceDirection: 'forward' },
  'dining table': { preferredPosition: 'center', minSpacingFeet: 3, faceDirection: 'forward' },
  'bed': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.3, faceDirection: 'inward' },
  'nightstand': { preferredPosition: 'beside', nearTo: ['bed'], minSpacingFeet: 0.3, faceDirection: 'forward' },
  'desk': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 2, zOffset: 0.5, faceDirection: 'inward' },
  'chair': { preferredPosition: 'floating', nearTo: ['desk', 'dining table'], minSpacingFeet: 0.5, faceDirection: 'inward' },
  'dining chair': { preferredPosition: 'floating', nearTo: ['dining table'], minSpacingFeet: 0.3, faceDirection: 'inward' },
  'office chair': { preferredPosition: 'floating', nearTo: ['desk'], minSpacingFeet: 0.5, faceDirection: 'outward' },
  'armchair': { preferredPosition: 'corner', minSpacingFeet: 1.5, faceDirection: 'inward' },
  'tv': { preferredPosition: 'on-top', nearTo: ['tv stand', 'console', 'media console', 'dresser'], minSpacingFeet: 0, zOffset: 0, faceDirection: 'inward', stackable: true },
  'television': { preferredPosition: 'on-top', nearTo: ['tv stand', 'console', 'media console', 'dresser'], minSpacingFeet: 0, zOffset: 0, faceDirection: 'inward', stackable: true },
  'tv stand': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 2, zOffset: 0.3, faceDirection: 'inward' },
  'media console': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 2, zOffset: 0.3, faceDirection: 'inward' },
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
  'rug': { preferredPosition: 'center', minSpacingFeet: 0, faceDirection: 'forward' },
  'carpet': { preferredPosition: 'center', minSpacingFeet: 0, faceDirection: 'forward' },
  'mirror': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.2, zOffset: 0.1, faceDirection: 'inward' },
  'ottoman': { preferredPosition: 'center', nearTo: ['sofa', 'armchair'], minSpacingFeet: 1, faceDirection: 'forward' },
  'bench': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 1, zOffset: 0.3, faceDirection: 'inward' },
  'console': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 0.5, zOffset: 0.2, faceDirection: 'inward' },
  'side table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair', 'bed'], minSpacingFeet: 0.3, faceDirection: 'forward' },
  'end table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair'], minSpacingFeet: 0.3, faceDirection: 'forward' },
  'vase': { preferredPosition: 'on-top', nearTo: ['table', 'console', 'dresser'], minSpacingFeet: 0, faceDirection: 'forward', stackable: true },
  'clock': { preferredPosition: 'on-top', nearTo: ['nightstand', 'desk'], minSpacingFeet: 0, faceDirection: 'forward', stackable: true },
};

// Wall rotations: rotation needed to face INTO the room from each wall
const WALL_ROTATIONS: Record<string, number> = {
  'back': 0,           // Against back wall (-Z), face forward (+Z)
  'front': Math.PI,    // Against front wall (+Z), face backward (-Z)
  'left': Math.PI / 2, // Against left wall (-X), face right (+X)
  'right': -Math.PI / 2, // Against right wall (+X), face left (-X)
};

function getPlacementRule(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [key, rule] of Object.entries(PLACEMENT_RULES)) {
    if (lowerLabel.includes(key)) return rule;
  }
  return { preferredPosition: 'floating' as const, minSpacingFeet: 1.5, faceDirection: 'forward' as const };
}

interface PlacedItem {
  id: string;
  x: number;
  y: number; // Y position (height from floor)
  z: number;
  length: number;
  width: number;
  height: number;
  label: string;
  rotation: number;
}

// Find an item that this object can stack on top of
function findStackTarget(label: string, placed: PlacedItem[]): PlacedItem | null {
  const lowerLabel = label.toLowerCase();
  
  // Check stacking rules
  for (const [itemType, rules] of Object.entries(STACKING_RULES)) {
    if (lowerLabel.includes(itemType)) {
      for (const targetType of rules.stackOn) {
        const target = placed.find(p => p.label.includes(targetType));
        if (target) return target;
      }
    }
  }
  
  return null;
}

function checkOverlap(
  x: number, z: number,
  length: number, width: number,
  placed: PlacedItem[],
  minSpacing: number
): boolean {
  for (const item of placed) {
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
  roomL: number, roomW: number
): { x: number; z: number } {
  if (!checkOverlap(targetX, targetZ, length, width, placed, minSpacing)) {
    return { x: targetX, z: targetZ };
  }

  const spiralOffsets = [
    [2, 0], [-2, 0], [0, 2], [0, -2],
    [2, 2], [-2, 2], [2, -2], [-2, -2],
    [4, 0], [-4, 0], [0, 4], [0, -4],
    [3, 3], [-3, 3], [3, -3], [-3, -3],
    [5, 0], [-5, 0], [0, 5], [0, -5],
  ];

  for (const [dx, dz] of spiralOffsets) {
    const newX = targetX + dx;
    const newZ = targetZ + dz;
    
    const maxX = (roomL / 2) - (length / 2) - 0.5;
    const maxZ = (roomW / 2) - (width / 2) - 0.5;
    
    if (Math.abs(newX) <= maxX && Math.abs(newZ) <= maxZ) {
      if (!checkOverlap(newX, newZ, length, width, placed, minSpacing)) {
        return { x: newX, z: newZ };
      }
    }
  }

  return { x: targetX + (Math.random() - 0.5) * 4, z: targetZ + (Math.random() - 0.5) * 4 };
}

// Calculate rotation based on wall placement
function getRotationForWall(wall: 'back' | 'left' | 'right' | 'front' | 'any', faceDirection: string): number {
  if (wall === 'any') {
    return 0; // Default forward
  }
  return WALL_ROTATIONS[wall] || 0;
}

// Calculate rotation for corner placement (face toward center)
function getCornerRotation(x: number, z: number): number {
  // Calculate angle to face room center
  const angleToCenter = Math.atan2(-z, -x);
  // Adjust to make furniture face the center at an angle
  return angleToCenter + Math.PI;
}

interface SmartLayoutRequest {
  objects: SegmentedObject[];
  roomDimensions: {
    length: number;
    width: number;
    height: number;
    unit: 'ft' | 'meters';
  };
  floorplanData?: {
    doors?: { x: number; z: number; width: number }[];
    windows?: { x: number; z: number; width: number; wall: string }[];
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objects, roomDimensions, floorplanData } = body as SmartLayoutRequest;

    if (!objects || !Array.isArray(objects)) {
      return NextResponse.json({ error: 'No objects provided' }, { status: 400 });
    }

    const roomL = roomDimensions?.length || 20;
    const roomW = roomDimensions?.width || 16;
    const wallPadding = 1.0;

    console.log('Smart layout for room:', roomL, 'x', roomW, 'with', objects.length, 'objects');

    const placedPositions: PlacedItem[] = [];

    // Sort by priority - on-top items come LAST (after their base items are placed)
    const priorityOrder: Record<string, number> = { 
      wall: 0, corner: 1, center: 2, beside: 3, floating: 4, 'on-top': 5
    };
    
    const sortedObjects = [...objects].sort((a, b) => {
      const ruleA = getPlacementRule(a.label);
      const ruleB = getPlacementRule(b.label);
      const priorityDiff = (priorityOrder[ruleA.preferredPosition] || 4) - (priorityOrder[ruleB.preferredPosition] || 4);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      const sizeA = (a.estimatedDimensions?.length || 2) * (a.estimatedDimensions?.width || 2);
      const sizeB = (b.estimatedDimensions?.length || 2) * (b.estimatedDimensions?.width || 2);
      return sizeB - sizeA;
    });

    const positionedObjects = sortedObjects.map((obj) => {
      const rule = getPlacementRule(obj.label);
      const dims = obj.estimatedDimensions || { length: 2, width: 2, height: 2 };
      
      const halfRoomL = roomL / 2;
      const halfRoomW = roomW / 2;
      const halfObjL = dims.length / 2;
      const halfObjW = dims.width / 2;
      const zOff = rule.zOffset || 0.3;

      let targetX = 0;
      let targetZ = 0;
      let rotation = 0;

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

      switch (rule.preferredPosition) {
        case 'wall': {
          const wall = rule.wallPreference || 'back';
          
          if (wall === 'any') {
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
            const pos = wallPos[wall];
            targetX = pos.x;
            targetZ = pos.z;
            chosenWall = wall;
            
            const wallItems = placedPositions.filter(p => {
              if (wall === 'back' || wall === 'front') {
                return Math.abs(p.z - pos.z) < 2;
              }
              return Math.abs(p.x - pos.x) < 2;
            });
            
            if (wallItems.length > 0) {
              const offset = (wallItems.length * 3) * (wallItems.length % 2 === 0 ? 1 : -1);
              if (wall === 'back' || wall === 'front') {
                targetX = offset;
              } else {
                targetZ = offset;
              }
            }
          }
          
          // Set rotation to face into room from the wall
          rotation = getRotationForWall(chosenWall, rule.faceDirection || 'inward');
          break;
        }

        case 'center': {
          if (obj.label.toLowerCase().includes('rug') || obj.label.toLowerCase().includes('carpet')) {
            targetX = 0;
            targetZ = 0;
            rotation = 0;
          } else if (obj.label.toLowerCase().includes('coffee')) {
            const sofa = placedPositions.find(p => 
              p.label.includes('sofa') || p.label.includes('couch') || p.label.includes('sectional')
            );
            if (sofa) {
              targetX = sofa.x;
              targetZ = sofa.z + sofa.width / 2 + dims.width / 2 + 2;
              rotation = sofa.rotation; // Match sofa orientation
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
          let cornerIndex = 0;
          for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            if (!checkOverlap(corner.x, corner.z, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
              targetX = corner.x;
              targetZ = corner.z;
              cornerIndex = i;
              break;
            }
          }
          
          // For corners, face toward room center at 45 degree angle
          rotation = getCornerRotation(targetX, targetZ);
          break;
        }

        case 'beside': {
          let placed = false;
          
          if (rule.nearTo) {
            for (const nearLabel of rule.nearTo) {
              const nearItem = placedPositions.find(p => p.label.includes(nearLabel));
              if (nearItem) {
                let sideX = nearItem.x + nearItem.length / 2 + dims.length / 2 + 0.5;
                let sideZ = nearItem.z;
                
                if (!checkOverlap(sideX, sideZ, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                  targetX = sideX;
                  targetZ = sideZ;
                  rotation = nearItem.rotation; // Match parent orientation
                  placed = true;
                  break;
                }
                
                sideX = nearItem.x - nearItem.length / 2 - dims.length / 2 - 0.5;
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

        case 'on-top': {
          // Find a base item to stack on top of
          const stackTarget = findStackTarget(obj.label, placedPositions);
          
          if (stackTarget) {
            // Place on top of the target item
            targetX = stackTarget.x;
            targetZ = stackTarget.z;
            rotation = stackTarget.rotation; // Match base item rotation
            
            console.log(`Stacking ${obj.label} on top of ${stackTarget.label} at y=${stackTarget.y + stackTarget.height}`);
          } else if (rule.nearTo) {
            // Fallback: find any of the nearTo items
            for (const nearLabel of rule.nearTo) {
              const nearItem = placedPositions.find(p => p.label.includes(nearLabel));
              if (nearItem) {
                targetX = nearItem.x;
                targetZ = nearItem.z;
                rotation = nearItem.rotation;
                break;
              }
            }
          } else {
            // Last resort: wall placement
            targetX = 0;
            targetZ = halfRoomW - halfObjW - wallPadding;
            rotation = Math.PI;
          }
          break;
        }

        case 'floating':
        default: {
          if (rule.nearTo) {
            for (const nearLabel of rule.nearTo) {
              const nearItem = placedPositions.find(p => p.label.includes(nearLabel));
              if (nearItem) {
                // Place in front of related item (for chairs near desks/tables)
                targetX = nearItem.x;
                targetZ = nearItem.z + nearItem.width / 2 + dims.width / 2 + 1.5;
                
                // Face toward the related item (opposite direction)
                rotation = nearItem.rotation + Math.PI;
                break;
              }
            }
          } else {
            const gridSize = Math.ceil(Math.sqrt(sortedObjects.length));
            const idx = placedPositions.length;
            const gridX = (idx % gridSize) - gridSize / 2;
            const gridZ = Math.floor(idx / gridSize) - gridSize / 2;
            targetX = gridX * (roomL / (gridSize + 1));
            targetZ = gridZ * (roomW / (gridSize + 1));
          }
          break;
        }
      }

      // Bounds check
      const maxX = halfRoomL - halfObjL - wallPadding;
      const maxZ = halfRoomW - halfObjW - wallPadding;
      targetX = Math.max(-maxX, Math.min(maxX, targetX));
      targetZ = Math.max(-maxZ, Math.min(maxZ, targetZ));

      // Find non-overlapping position
      const finalPos = findNonOverlappingPosition(
        targetX, targetZ,
        dims.length, dims.width,
        placedPositions,
        rule.minSpacingFeet,
        roomL, roomW
      );

      finalPos.x = Math.max(-maxX, Math.min(maxX, finalPos.x));
      finalPos.z = Math.max(-maxZ, Math.min(maxZ, finalPos.z));

      // Avoid doors
      if (floorplanData?.doors) {
        for (const door of floorplanData.doors) {
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

      // Calculate Y position (stacking)
      let yPosition = 0;
      if (rule.preferredPosition === 'on-top' || rule.stackable) {
        const stackTarget = findStackTarget(obj.label, placedPositions);
        if (stackTarget) {
          yPosition = stackTarget.y + stackTarget.height;
        }
      }

      // Record position
      placedPositions.push({
        id: obj.id,
        x: finalPos.x,
        y: yPosition,
        z: finalPos.z,
        length: dims.length,
        width: dims.width,
        height: dims.height || 2,
        label: obj.label.toLowerCase(),
        rotation: rotation,
      });

      console.log(`Placed ${obj.label} at (${finalPos.x.toFixed(1)}, ${yPosition.toFixed(1)}, ${finalPos.z.toFixed(1)}) rot: ${(rotation * 180 / Math.PI).toFixed(0)}°`);

      return {
        ...obj,
        position3D: {
          x: finalPos.x,
          y: yPosition,
          z: finalPos.z,
          rotation: rotation,
        },
        generationType: 'procedural' as const,
      };
    });

    return NextResponse.json({
      success: true,
      models: positionedObjects,
      layoutInfo: {
        totalObjects: positionedObjects.length,
        roomDimensions: { length: roomL, width: roomW },
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
