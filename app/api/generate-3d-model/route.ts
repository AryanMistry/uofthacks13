import { NextRequest, NextResponse } from 'next/server';
import { SegmentedObject } from '@/lib/types/segmentation';

// Smart furniture placement rules
const PLACEMENT_RULES: Record<string, {
  preferredPosition: 'wall' | 'center' | 'corner' | 'beside' | 'floating';
  wallPreference?: 'back' | 'left' | 'right' | 'front' | 'any';
  nearTo?: string[];
  awayFrom?: string[];
  minSpacingFeet: number;
  zOffset?: number; // How far from wall (for wall items)
}> = {
  'sofa': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 2, zOffset: 0.5 },
  'couch': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 2, zOffset: 0.5 },
  'sectional': { preferredPosition: 'corner', minSpacingFeet: 2 },
  'loveseat': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.5 },
  'coffee table': { preferredPosition: 'center', nearTo: ['sofa', 'couch', 'sectional'], minSpacingFeet: 2 },
  'dining table': { preferredPosition: 'center', minSpacingFeet: 3 },
  'bed': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 1.5, zOffset: 0.3 },
  'nightstand': { preferredPosition: 'beside', nearTo: ['bed'], minSpacingFeet: 0.3 },
  'desk': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 2, zOffset: 0.5 },
  'chair': { preferredPosition: 'floating', nearTo: ['desk', 'dining table'], minSpacingFeet: 0.5 },
  'dining chair': { preferredPosition: 'floating', nearTo: ['dining table'], minSpacingFeet: 0.3 },
  'office chair': { preferredPosition: 'floating', nearTo: ['desk'], minSpacingFeet: 0.5 },
  'armchair': { preferredPosition: 'corner', minSpacingFeet: 1.5 },
  'tv': { preferredPosition: 'wall', wallPreference: 'front', awayFrom: ['sofa', 'couch'], minSpacingFeet: 5, zOffset: 0.2 },
  'tv stand': { preferredPosition: 'wall', wallPreference: 'front', minSpacingFeet: 2, zOffset: 0.3 },
  'bookshelf': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 0.3, zOffset: 0.2 },
  'shelf': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.3, zOffset: 0.2 },
  'wardrobe': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 0.3, zOffset: 0.2 },
  'closet': { preferredPosition: 'wall', wallPreference: 'left', minSpacingFeet: 0.3, zOffset: 0.2 },
  'dresser': { preferredPosition: 'wall', wallPreference: 'right', minSpacingFeet: 0.5, zOffset: 0.3 },
  'cabinet': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.3, zOffset: 0.2 },
  'lamp': { preferredPosition: 'corner', minSpacingFeet: 0.5 },
  'floor lamp': { preferredPosition: 'corner', minSpacingFeet: 0.5 },
  'table lamp': { preferredPosition: 'beside', nearTo: ['nightstand', 'side table', 'desk'], minSpacingFeet: 0.2 },
  'plant': { preferredPosition: 'corner', minSpacingFeet: 0.5 },
  'rug': { preferredPosition: 'center', minSpacingFeet: 0 },
  'carpet': { preferredPosition: 'center', minSpacingFeet: 0 },
  'mirror': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 0.2, zOffset: 0.1 },
  'ottoman': { preferredPosition: 'center', nearTo: ['sofa', 'armchair'], minSpacingFeet: 1 },
  'bench': { preferredPosition: 'wall', wallPreference: 'any', minSpacingFeet: 1, zOffset: 0.3 },
  'console': { preferredPosition: 'wall', wallPreference: 'back', minSpacingFeet: 0.5, zOffset: 0.2 },
  'side table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair', 'bed'], minSpacingFeet: 0.3 },
  'end table': { preferredPosition: 'beside', nearTo: ['sofa', 'armchair'], minSpacingFeet: 0.3 },
};

function getPlacementRule(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [key, rule] of Object.entries(PLACEMENT_RULES)) {
    if (lowerLabel.includes(key)) return rule;
  }
  return { preferredPosition: 'floating' as const, minSpacingFeet: 1.5 };
}

interface PlacedItem {
  x: number;
  z: number;
  length: number;
  width: number;
  label: string;
}

// Check if position overlaps with any existing furniture
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
      return true; // Overlap detected
    }
  }
  return false;
}

// Find a valid position that doesn't overlap
function findNonOverlappingPosition(
  targetX: number, targetZ: number,
  length: number, width: number,
  placed: PlacedItem[],
  minSpacing: number,
  roomL: number, roomW: number,
  maxAttempts: number = 20
): { x: number; z: number } {
  // Try the target position first
  if (!checkOverlap(targetX, targetZ, length, width, placed, minSpacing)) {
    return { x: targetX, z: targetZ };
  }

  // Try spiral outward from target position
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
    
    // Check bounds
    const maxX = (roomL / 2) - (length / 2) - 0.5;
    const maxZ = (roomW / 2) - (width / 2) - 0.5;
    
    if (Math.abs(newX) <= maxX && Math.abs(newZ) <= maxZ) {
      if (!checkOverlap(newX, newZ, length, width, placed, minSpacing)) {
        return { x: newX, z: newZ };
      }
    }
  }

  // Last resort: find any valid position
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const maxX = (roomL / 2) - (length / 2) - 1;
    const maxZ = (roomW / 2) - (width / 2) - 1;
    const randX = (Math.random() - 0.5) * 2 * maxX;
    const randZ = (Math.random() - 0.5) * 2 * maxZ;
    
    if (!checkOverlap(randX, randZ, length, width, placed, minSpacing)) {
      return { x: randX, z: randZ };
    }
  }

  // Absolute fallback - place it anyway but offset from center
  return { x: targetX + (Math.random() - 0.5) * 4, z: targetZ + (Math.random() - 0.5) * 4 };
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

    // Use room dimensions with safety margin
    const roomL = roomDimensions?.length || 20;
    const roomW = roomDimensions?.width || 16;
    const wallPadding = 1.0; // Minimum distance from wall

    console.log('Smart layout for room:', roomL, 'x', roomW, 'with', objects.length, 'objects');

    // Track placed furniture
    const placedPositions: PlacedItem[] = [];

    // Sort objects by priority: large wall items first, then center, then small floating
    const priorityOrder: Record<string, number> = { 
      wall: 0, 
      corner: 1, 
      center: 2, 
      beside: 3, 
      floating: 4 
    };
    
    // Also prioritize by size (larger first)
    const sortedObjects = [...objects].sort((a, b) => {
      const ruleA = getPlacementRule(a.label);
      const ruleB = getPlacementRule(b.label);
      const priorityDiff = (priorityOrder[ruleA.preferredPosition] || 4) - (priorityOrder[ruleB.preferredPosition] || 4);
      
      if (priorityDiff !== 0) return priorityDiff;
      
      // Same priority - sort by size (larger first)
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

      // Calculate wall positions (object center positions when against wall)
      const wallPos = {
        back: { x: 0, z: -halfRoomW + halfObjW + wallPadding + zOff },
        front: { x: 0, z: halfRoomW - halfObjW - wallPadding - zOff },
        left: { x: -halfRoomL + halfObjL + wallPadding + zOff, z: 0 },
        right: { x: halfRoomL - halfObjL - wallPadding - zOff, z: 0 },
      };

      // Corner positions
      const corners = [
        { x: -halfRoomL + halfObjL + wallPadding, z: -halfRoomW + halfObjW + wallPadding },
        { x: halfRoomL - halfObjL - wallPadding, z: -halfRoomW + halfObjW + wallPadding },
        { x: -halfRoomL + halfObjL + wallPadding, z: halfRoomW - halfObjW - wallPadding },
        { x: halfRoomL - halfObjL - wallPadding, z: halfRoomW - halfObjW - wallPadding },
      ];

      switch (rule.preferredPosition) {
        case 'wall': {
          const wall = rule.wallPreference || 'back';
          
          if (wall === 'any') {
            // Try each wall until we find one without overlap
            const walls: ('back' | 'left' | 'right' | 'front')[] = ['back', 'left', 'right', 'front'];
            let found = false;
            
            for (const w of walls) {
              const pos = wallPos[w];
              if (!checkOverlap(pos.x, pos.z, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                targetX = pos.x;
                targetZ = pos.z;
                found = true;
                break;
              }
            }
            
            if (!found) {
              // All walls occupied - spread along back wall
              targetX = (placedPositions.length % 3 - 1) * (roomL / 4);
              targetZ = wallPos.back.z;
            }
          } else {
            const pos = wallPos[wall];
            targetX = pos.x;
            targetZ = pos.z;
            
            // Spread along the wall if needed
            const wallItems = placedPositions.filter(p => {
              if (wall === 'back' || wall === 'front') {
                return Math.abs(p.z - pos.z) < 2;
              }
              return Math.abs(p.x - pos.x) < 2;
            });
            
            if (wallItems.length > 0) {
              // Offset along the wall
              const offset = (wallItems.length * 2) * (wallItems.length % 2 === 0 ? 1 : -1);
              if (wall === 'back' || wall === 'front') {
                targetX = offset;
              } else {
                targetZ = offset;
              }
            }
          }
          break;
        }

        case 'center': {
          // Place in center area
          if (obj.label.toLowerCase().includes('rug') || obj.label.toLowerCase().includes('carpet')) {
            // Rugs go exactly in center
            targetX = 0;
            targetZ = 0;
          } else if (obj.label.toLowerCase().includes('coffee')) {
            // Coffee table goes in front of sofa
            const sofa = placedPositions.find(p => 
              p.label.includes('sofa') || p.label.includes('couch') || p.label.includes('sectional')
            );
            if (sofa) {
              targetX = sofa.x;
              targetZ = sofa.z + sofa.width / 2 + dims.width / 2 + 2; // 2 feet in front
            } else {
              targetX = 0;
              targetZ = 0;
            }
          } else if (obj.label.toLowerCase().includes('dining')) {
            // Dining table slightly toward back
            targetX = 0;
            targetZ = -halfRoomW / 3;
          } else {
            // Generic center placement
            targetX = 0;
            targetZ = 0;
          }
          break;
        }

        case 'corner': {
          // Find an available corner
          let placed = false;
          for (const corner of corners) {
            if (!checkOverlap(corner.x, corner.z, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
              targetX = corner.x;
              targetZ = corner.z;
              placed = true;
              break;
            }
          }
          if (!placed) {
            // Fallback to first corner
            targetX = corners[0].x;
            targetZ = corners[0].z;
          }
          break;
        }

        case 'beside': {
          // Place beside related furniture
          let placed = false;
          
          if (rule.nearTo) {
            for (const nearLabel of rule.nearTo) {
              const nearItem = placedPositions.find(p => p.label.includes(nearLabel));
              if (nearItem) {
                // Try right side first
                let sideX = nearItem.x + nearItem.length / 2 + dims.length / 2 + 0.5;
                let sideZ = nearItem.z;
                
                if (!checkOverlap(sideX, sideZ, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                  targetX = sideX;
                  targetZ = sideZ;
                  placed = true;
                  break;
                }
                
                // Try left side
                sideX = nearItem.x - nearItem.length / 2 - dims.length / 2 - 0.5;
                if (!checkOverlap(sideX, sideZ, dims.length, dims.width, placedPositions, rule.minSpacingFeet)) {
                  targetX = sideX;
                  targetZ = sideZ;
                  placed = true;
                  break;
                }
              }
            }
          }
          
          if (!placed) {
            // Default beside position
            targetX = halfRoomL - halfObjL - wallPadding;
            targetZ = 0;
          }
          break;
        }

        case 'floating':
        default: {
          // Floating items near related furniture
          if (rule.nearTo) {
            for (const nearLabel of rule.nearTo) {
              const nearItem = placedPositions.find(p => p.label.includes(nearLabel));
              if (nearItem) {
                // Place in front of the related item (for chairs near desks/tables)
                targetX = nearItem.x;
                targetZ = nearItem.z + nearItem.width / 2 + dims.width / 2 + 1.5;
                break;
              }
            }
          } else {
            // Distribute in available space
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

      // Ensure bounds and find non-overlapping position
      const maxX = halfRoomL - halfObjL - wallPadding;
      const maxZ = halfRoomW - halfObjW - wallPadding;
      targetX = Math.max(-maxX, Math.min(maxX, targetX));
      targetZ = Math.max(-maxZ, Math.min(maxZ, targetZ));

      // Find a non-overlapping position
      const finalPos = findNonOverlappingPosition(
        targetX, targetZ,
        dims.length, dims.width,
        placedPositions,
        rule.minSpacingFeet,
        roomL, roomW
      );

      // Clamp final position to room bounds
      finalPos.x = Math.max(-maxX, Math.min(maxX, finalPos.x));
      finalPos.z = Math.max(-maxZ, Math.min(maxZ, finalPos.z));

      // Avoid doors if floorplan data provided
      if (floorplanData?.doors) {
        for (const door of floorplanData.doors) {
          const doorMinX = door.x - door.width / 2 - 2;
          const doorMaxX = door.x + door.width / 2 + 2;
          const doorMinZ = door.z - 3;
          const doorMaxZ = door.z + 3;
          
          if (finalPos.x > doorMinX && finalPos.x < doorMaxX &&
              finalPos.z > doorMinZ && finalPos.z < doorMaxZ) {
            // Move away from door
            finalPos.x += 4;
          }
        }
      }

      // Record this position
      placedPositions.push({
        x: finalPos.x,
        z: finalPos.z,
        length: dims.length,
        width: dims.width,
        label: obj.label.toLowerCase(),
      });

      console.log(`Placed ${obj.label} at (${finalPos.x.toFixed(1)}, ${finalPos.z.toFixed(1)})`);

      return {
        ...obj,
        position3D: {
          x: finalPos.x,
          y: 0,
          z: finalPos.z,
          rotation: 0,
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

// Batch endpoint for backwards compatibility
export async function PUT(request: NextRequest) {
  return POST(request);
}
