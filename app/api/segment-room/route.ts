import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import sharp from 'sharp';
import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Furniture defaults with rotation hints
const FURNITURE_DEFAULTS: Record<string, {
  category: SegmentedObject['category'];
  baseDimensions: { length: number; width: number; height: number };
  defaultColor: string;
  minScale: number;
  maxScale: number;
  faceDirection: 'inward' | 'outward' | 'toward-center' | 'toward-related';
  relatedTo?: string[]; // Furniture this item should face toward
}> = {
  'sofa': { category: 'furniture', baseDimensions: { length: 6, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'couch': { category: 'furniture', baseDimensions: { length: 6, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'sectional': { category: 'furniture', baseDimensions: { length: 9, width: 6, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'loveseat': { category: 'furniture', baseDimensions: { length: 4.5, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'chair': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 3 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'toward-related', relatedTo: ['desk', 'table', 'dining table'] },
  'armchair': { category: 'furniture', baseDimensions: { length: 2.5, width: 2.5, height: 3 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2, faceDirection: 'toward-center' },
  'dining chair': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 3 }, defaultColor: '#8B4513', minScale: 0.9, maxScale: 1.1, faceDirection: 'toward-related', relatedTo: ['dining table', 'table'] },
  'office chair': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 3.5 }, defaultColor: '#333333', minScale: 0.9, maxScale: 1.1, faceDirection: 'toward-related', relatedTo: ['desk'] },
  'table': { category: 'furniture', baseDimensions: { length: 4, width: 2.5, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5, faceDirection: 'inward' },
  'coffee table': { category: 'furniture', baseDimensions: { length: 3.5, width: 2, height: 1.3 }, defaultColor: '#8B7355', minScale: 0.7, maxScale: 1.3, faceDirection: 'toward-related', relatedTo: ['sofa', 'couch'] },
  'dining table': { category: 'furniture', baseDimensions: { length: 5, width: 3, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.7, maxScale: 1.4, faceDirection: 'inward' },
  'desk': { category: 'furniture', baseDimensions: { length: 4, width: 2, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.3, faceDirection: 'inward' },
  'side table': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'end table': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'king bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 6.5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1, faceDirection: 'inward' },
  'queen bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1, faceDirection: 'inward' },
  'twin bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 3.5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1, faceDirection: 'inward' },
  'bookshelf': { category: 'storage', baseDimensions: { length: 3, width: 1, height: 5.5 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5, faceDirection: 'inward' },
  'shelf': { category: 'storage', baseDimensions: { length: 3, width: 0.8, height: 4 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5, faceDirection: 'inward' },
  'cabinet': { category: 'storage', baseDimensions: { length: 2.5, width: 1.2, height: 3 }, defaultColor: '#D2B48C', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'dresser': { category: 'storage', baseDimensions: { length: 4, width: 1.5, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'nightstand': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.3, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'tv stand': { category: 'furniture', baseDimensions: { length: 4, width: 1.5, height: 2 }, defaultColor: '#333333', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'tv': { category: 'furniture', baseDimensions: { length: 3.5, width: 0.3, height: 2 }, defaultColor: '#1C1C1C', minScale: 0.6, maxScale: 1.5, faceDirection: 'toward-related', relatedTo: ['sofa', 'couch', 'bed'] },
  'lamp': { category: 'lighting', baseDimensions: { length: 0.8, width: 0.8, height: 4.5 }, defaultColor: '#FFD700', minScale: 0.7, maxScale: 1.5, faceDirection: 'inward' },
  'floor lamp': { category: 'lighting', baseDimensions: { length: 1.2, width: 1.2, height: 5 }, defaultColor: '#333333', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'table lamp': { category: 'lighting', baseDimensions: { length: 0.8, width: 0.8, height: 2 }, defaultColor: '#FFD700', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'rug': { category: 'textile', baseDimensions: { length: 7, width: 5, height: 0.05 }, defaultColor: '#8B4789', minScale: 0.5, maxScale: 2, faceDirection: 'inward' },
  'carpet': { category: 'textile', baseDimensions: { length: 9, width: 7, height: 0.05 }, defaultColor: '#696969', minScale: 0.5, maxScale: 2, faceDirection: 'inward' },
  'plant': { category: 'decoration', baseDimensions: { length: 1.2, width: 1.2, height: 3 }, defaultColor: '#228B22', minScale: 0.5, maxScale: 2, faceDirection: 'inward' },
  'mirror': { category: 'decoration', baseDimensions: { length: 0.1, width: 2, height: 3.5 }, defaultColor: '#C0C0C0', minScale: 0.6, maxScale: 1.5, faceDirection: 'inward' },
  'painting': { category: 'decoration', baseDimensions: { length: 0.05, width: 2.5, height: 2 }, defaultColor: '#FFFFFF', minScale: 0.5, maxScale: 2, faceDirection: 'inward' },
  'art': { category: 'decoration', baseDimensions: { length: 0.05, width: 2, height: 2 }, defaultColor: '#FFFFFF', minScale: 0.5, maxScale: 2, faceDirection: 'inward' },
  'curtain': { category: 'textile', baseDimensions: { length: 0.2, width: 4, height: 7 }, defaultColor: '#F5F5DC', minScale: 0.7, maxScale: 1.5, faceDirection: 'inward' },
  'wardrobe': { category: 'storage', baseDimensions: { length: 5, width: 2, height: 6.5 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'closet': { category: 'storage', baseDimensions: { length: 4, width: 2, height: 7 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
  'ottoman': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 1.3 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2, faceDirection: 'toward-related', relatedTo: ['sofa', 'couch'] },
  'bench': { category: 'furniture', baseDimensions: { length: 3.5, width: 1.3, height: 1.5 }, defaultColor: '#8B4513', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'stool': { category: 'furniture', baseDimensions: { length: 1.2, width: 1.2, height: 2 }, defaultColor: '#333333', minScale: 0.8, maxScale: 1.2, faceDirection: 'toward-related', relatedTo: ['counter', 'bar', 'table'] },
  'console': { category: 'furniture', baseDimensions: { length: 3.5, width: 1.2, height: 2.5 }, defaultColor: '#654321', minScale: 0.7, maxScale: 1.3, faceDirection: 'inward' },
  'window': { category: 'decoration', baseDimensions: { length: 0.2, width: 4, height: 5 }, defaultColor: '#87CEEB', minScale: 0.6, maxScale: 1.5, faceDirection: 'inward' },
  'door': { category: 'decoration', baseDimensions: { length: 0.3, width: 3, height: 7 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2, faceDirection: 'inward' },
};

function getDefaults(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [key, value] of Object.entries(FURNITURE_DEFAULTS)) {
    if (lowerLabel.includes(key)) return { key, ...value };
  }
  return {
    key: 'unknown',
    category: 'furniture' as const,
    baseDimensions: { length: 2, width: 2, height: 2 },
    defaultColor: '#808080',
    minScale: 0.7,
    maxScale: 1.3,
    faceDirection: 'inward' as const,
  };
}

function colorNameToHex(colorName: string): string {
  const colors: Record<string, string> = {
    'white': '#FFFFFF', 'black': '#1C1C1C', 'gray': '#808080', 'grey': '#808080',
    'brown': '#8B4513', 'beige': '#F5F5DC', 'tan': '#D2B48C', 'cream': '#FFFDD0',
    'red': '#DC143C', 'maroon': '#800000', 'burgundy': '#722F37',
    'blue': '#4169E1', 'navy': '#000080', 'teal': '#008080', 'turquoise': '#40E0D0',
    'green': '#228B22', 'olive': '#808000', 'forest': '#228B22', 'sage': '#9CAF88',
    'yellow': '#FFD700', 'gold': '#FFD700', 'mustard': '#FFDB58',
    'orange': '#FF8C00', 'coral': '#FF7F50', 'terracotta': '#E2725B',
    'pink': '#FF69B4', 'blush': '#DE5D83', 'rose': '#FF007F',
    'purple': '#9370DB', 'violet': '#EE82EE', 'plum': '#DDA0DD', 'lavender': '#E6E6FA',
    'silver': '#C0C0C0', 'charcoal': '#36454F',
    'wood': '#8B4513', 'walnut': '#5C4033', 'oak': '#C19A6B', 'mahogany': '#C04000',
    'natural': '#DEB887', 'light': '#F5F5F5', 'dark': '#2F2F2F',
  };
  const lowerColor = colorName.toLowerCase();
  for (const [name, hex] of Object.entries(colors)) {
    if (lowerColor.includes(name)) return hex;
  }
  return '#808080';
}

// Calculate rotation based on image position
// Objects on the left facing right, objects on right facing left, etc.
function calculateRotationFromImage(
  bboxCenterX: number, // 0-100 percentage
  bboxCenterY: number, // 0-100 percentage  
  positionHint: string | undefined,
  facingHint: string | undefined
): number {
  // If AI detected facing direction, use it
  if (facingHint) {
    const facingLower = facingHint.toLowerCase();
    if (facingLower.includes('left')) return Math.PI / 2;
    if (facingLower.includes('right')) return -Math.PI / 2;
    if (facingLower.includes('camera') || facingLower.includes('forward') || facingLower.includes('front')) return 0;
    if (facingLower.includes('away') || facingLower.includes('back')) return Math.PI;
  }

  // Infer from position in image
  // Items on left side of image typically face right (into room)
  // Items on right side typically face left
  // Items at back (top of image) face forward (toward camera)
  // Items at front (bottom of image) face away

  if (positionHint) {
    const hint = positionHint.toLowerCase();
    if (hint === 'left') return Math.PI / 2; // Face right
    if (hint === 'right') return -Math.PI / 2; // Face left
    if (hint === 'back') return 0; // Face forward
    if (hint === 'front') return Math.PI; // Face away/back
    if (hint === 'center') return 0; // Face forward
  }

  // Calculate based on bbox position
  // In a typical room photo:
  // - Y position: top = back of room, bottom = front of room
  // - X position: helps determine if against left/right wall

  if (bboxCenterX < 25) {
    // Left side of image - against left wall, face right
    return Math.PI / 2;
  } else if (bboxCenterX > 75) {
    // Right side of image - against right wall, face left
    return -Math.PI / 2;
  } else if (bboxCenterY < 40) {
    // Top/back of image - against back wall, face forward
    return 0;
  } else if (bboxCenterY > 70) {
    // Bottom/front of image - possibly near camera/entrance
    return Math.PI;
  }

  // Center of image - face forward
  return 0;
}

// Convert 2D image position to 3D room position
function imageToRoomPosition(
  bboxCenterX: number, // 0-100 percentage
  bboxCenterY: number, // 0-100 percentage
  roomLength: number,
  roomWidth: number,
  objectLength: number,
  objectWidth: number
): { x: number; z: number } {
  // Map image coordinates to room coordinates
  // Image: left=0, right=100, top=0, bottom=100
  // Room: x from -length/2 to +length/2, z from -width/2 to +width/2
  // In typical room photo: top of image = back wall (-z), bottom = front (+z)
  // left of image = left wall (-x), right = right wall (+x)

  const padding = 1.5; // Wall padding
  const halfLength = roomLength / 2 - padding - objectLength / 2;
  const halfWidth = roomWidth / 2 - padding - objectWidth / 2;

  // X position: left of image to right of image → -halfLength to +halfLength
  const x = ((bboxCenterX / 100) - 0.5) * 2 * halfLength;

  // Z position: top of image (back) to bottom (front) → -halfWidth to +halfWidth
  const z = ((bboxCenterY / 100) - 0.5) * 2 * halfWidth;

  return {
    x: Math.max(-halfLength, Math.min(halfLength, x)),
    z: Math.max(-halfWidth, Math.min(halfWidth, z)),
  };
}

// Determine wall for items at edges
function determineWall(bboxCenterX: number, bboxCenterY: number): 'back' | 'front' | 'left' | 'right' | 'center' {
  if (bboxCenterY < 30) return 'back';
  if (bboxCenterY > 70) return 'front';
  if (bboxCenterX < 25) return 'left';
  if (bboxCenterX > 75) return 'right';
  return 'center';
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const floorplanFile = formData.get('floorplan') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString('base64');
    const contentType = file.type;

    const imageMetadata = await sharp(buffer).metadata();
    const imgWidth = imageMetadata.width || 1000;
    const imgHeight = imageMetadata.height || 1000;

    let detectedObjects: {
      name: string;
      bbox: { x1: number; y1: number; x2: number; y2: number };
      color?: string;
      material?: string;
      style?: string;
      position_hint?: 'left' | 'center' | 'right' | 'back' | 'front';
      facing?: string; // e.g., "facing left", "facing camera", "facing window"
      estimated_size?: 'small' | 'medium' | 'large';
      against_wall?: boolean;
      near?: string[]; // Other objects this is near
    }[] = [];

    // Room info with doors and windows
    let roomInfo = {
      length: 20,
      width: 16,
      height: 10,
      wallColor: '#FAF0E6',
      floorColor: '#B8860B',
      roomType: 'living room',
    };

    let doors: { x: number; z: number; width: number; wall: string }[] = [];
    let windows: { x: number; z: number; width: number; height: number; wall: string }[] = [];

    // Analyze floorplan if provided
    if (floorplanFile) {
      const floorplanBuffer = Buffer.from(await floorplanFile.arrayBuffer());
      const floorplanBase64 = floorplanBuffer.toString('base64');
      const floorplanContentType = floorplanFile.type;

      try {
        const floorplanAnalysis = await groq.chat.completions.create({
          model: 'meta-llama/llama-4-scout-17b-16e-instruct',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: { url: `data:${floorplanContentType};base64,${floorplanBase64}` },
                },
                {
                  type: 'text',
                  text: `Analyze this floorplan. Extract room dimensions (GENEROUSLY overestimate), and locate ALL doors and windows.

Return ONLY valid JSON:
{
  "length": 22,
  "width": 18,
  "height": 10,
  "doors": [
    {"wall": "front", "position": 0.5, "width": 3}
  ],
  "windows": [
    {"wall": "left", "position": 0.5, "width": 4, "height": 4},
    {"wall": "back", "position": 0.3, "width": 3, "height": 3}
  ],
  "roomType": "bedroom"
}

Position is 0-1 along the wall (0=start, 1=end).`,
                },
              ],
            },
          ],
          max_tokens: 2048,
          temperature: 0.1,
        });

        const fpText = floorplanAnalysis.choices[0]?.message?.content || '';
        const fpMatch = fpText.match(/\{[\s\S]*\}/);
        if (fpMatch) {
          const parsed = JSON.parse(fpMatch[0]);
          roomInfo = {
            ...roomInfo,
            length: Math.max(roomInfo.length, (parsed.length || 15) * 1.2),
            width: Math.max(roomInfo.width, (parsed.width || 12) * 1.2),
            height: parsed.height || roomInfo.height,
            roomType: parsed.roomType || roomInfo.roomType,
          };

          // Process doors
          if (parsed.doors) {
            doors = parsed.doors.map((d: any) => {
              const halfL = roomInfo.length / 2;
              const halfW = roomInfo.width / 2;
              let x = 0, z = 0;
              const pos = d.position || 0.5;

              switch (d.wall) {
                case 'front': x = (pos - 0.5) * roomInfo.length; z = halfW - 0.5; break;
                case 'back': x = (pos - 0.5) * roomInfo.length; z = -halfW + 0.5; break;
                case 'left': z = (pos - 0.5) * roomInfo.width; x = -halfL + 0.5; break;
                case 'right': z = (pos - 0.5) * roomInfo.width; x = halfL - 0.5; break;
              }
              return { x, z, width: d.width || 3, wall: d.wall };
            });
          }

          // Process windows
          if (parsed.windows) {
            windows = parsed.windows.map((w: any) => {
              const halfL = roomInfo.length / 2;
              const halfW = roomInfo.width / 2;
              let x = 0, z = 0;
              const pos = w.position || 0.5;

              switch (w.wall) {
                case 'front': x = (pos - 0.5) * roomInfo.length; z = halfW - 0.1; break;
                case 'back': x = (pos - 0.5) * roomInfo.length; z = -halfW + 0.1; break;
                case 'left': z = (pos - 0.5) * roomInfo.width; x = -halfL + 0.1; break;
                case 'right': z = (pos - 0.5) * roomInfo.width; x = halfL - 0.1; break;
              }
              return { x, z, width: w.width || 4, height: w.height || 4, wall: w.wall };
            });
          }

          console.log('Floorplan analyzed:', roomInfo, 'Doors:', doors.length, 'Windows:', windows.length);
        }
      } catch (fpError) {
        console.error('Floorplan analysis error:', fpError);
      }
    }

    // Analyze room photo
    try {
      const chatCompletion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: { url: `data:${contentType};base64,${imageBase64}` },
              },
              {
                type: 'text',
                text: `Analyze this room image CAREFULLY. Detect ALL furniture, doors, and windows.

For EACH object provide:
1. "name": Specific type (e.g., "gray fabric sofa", "oak desk", "window with blinds")
2. "bbox": Bounding box as percentages (0-100):
   - x1: left edge, y1: top edge, x2: right edge, y2: bottom edge
3. "color": Primary color
4. "material": Material (wood, fabric, leather, metal, glass)
5. "position_hint": Position in room ("left", "center", "right", "back", "front")
6. "facing": Which direction it faces ("facing camera", "facing left", "facing right", "facing away", "facing window")
7. "against_wall": true if against a wall
8. "near": List of other objects it's near/related to
9. "estimated_size": "small", "medium", or "large"

IMPORTANT: Detect ANY windows and doors visible in the image!

Return ONLY valid JSON:
{
  "objects": [
    {"name": "gray fabric sofa", "bbox": {"x1": 15, "y1": 45, "x2": 55, "y2": 75}, "color": "gray", "material": "fabric", "position_hint": "back", "facing": "facing camera", "against_wall": true, "near": [], "estimated_size": "large"},
    {"name": "wooden coffee table", "bbox": {"x1": 30, "y1": 60, "x2": 50, "y2": 70}, "color": "brown", "material": "wood", "position_hint": "center", "facing": "facing camera", "against_wall": false, "near": ["sofa"], "estimated_size": "medium"},
    {"name": "office chair", "bbox": {"x1": 70, "y1": 40, "x2": 85, "y2": 70}, "color": "black", "material": "leather", "position_hint": "right", "facing": "facing left", "against_wall": false, "near": ["desk"], "estimated_size": "medium"},
    {"name": "window with white curtains", "bbox": {"x1": 5, "y1": 10, "x2": 35, "y2": 50}, "color": "white", "material": "glass", "position_hint": "left", "facing": "facing right", "against_wall": true, "near": [], "estimated_size": "large"}
  ],
  "room": {
    "length": 20,
    "width": 16,
    "height": 10,
    "wallColor": "#FAF0E6",
    "floorColor": "#B8860B",
    "roomType": "living room"
  }
}`,
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.1,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || '';
      console.log('Groq response:', responseText);

      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        detectedObjects = parsed.objects || [];
        if (parsed.room) {
          const aiLength = (parsed.room.length || 15) * 1.15;
          const aiWidth = (parsed.room.width || 12) * 1.15;
          roomInfo = {
            ...roomInfo,
            length: Math.max(roomInfo.length, aiLength),
            width: Math.max(roomInfo.width, aiWidth),
            height: parsed.room.height || roomInfo.height,
            wallColor: parsed.room.wallColor || roomInfo.wallColor,
            floorColor: parsed.room.floorColor || roomInfo.floorColor,
            roomType: parsed.room.roomType || roomInfo.roomType,
          };
        }
        console.log('Detected', detectedObjects.length, 'objects');

        // Extract doors and windows from detected objects
        for (const obj of detectedObjects) {
          const lowerName = obj.name.toLowerCase();
          const bboxCenterX = (obj.bbox.x1 + obj.bbox.x2) / 2;
          const bboxCenterY = (obj.bbox.y1 + obj.bbox.y2) / 2;
          const bboxWidthPct = (obj.bbox.x2 - obj.bbox.x1) / 100;
          const bboxHeightPct = (obj.bbox.y2 - obj.bbox.y1) / 100;
          const wall = determineWall(bboxCenterX, bboxCenterY);

          if (lowerName.includes('door')) {
            const wallSpan = (wall === 'left' || wall === 'right') ? roomInfo.width : roomInfo.length;
            const doorWidth = Math.max(2, Math.min(6, wallSpan * bboxWidthPct));
            const pos = imageToRoomPosition(bboxCenterX, bboxCenterY, roomInfo.length, roomInfo.width, doorWidth, 0.3);
            const exists = doors.some(d => d.wall === wall && Math.abs(d.x - pos.x) < 1 && Math.abs(d.z - pos.z) < 1);
            if (!exists) {
              doors.push({ x: pos.x, z: pos.z, width: doorWidth, wall });
            }
          }

          if (lowerName.includes('window')) {
            const wallSpan = (wall === 'left' || wall === 'right') ? roomInfo.width : roomInfo.length;
            const windowWidth = Math.max(2, Math.min(8, wallSpan * bboxWidthPct));
            const windowHeight = Math.max(2, Math.min(roomInfo.height * 0.8, roomInfo.height * bboxHeightPct));
            const pos = imageToRoomPosition(bboxCenterX, bboxCenterY, roomInfo.length, roomInfo.width, windowWidth, 0.2);
            const exists = windows.some(w => w.wall === wall && Math.abs(w.x - pos.x) < 1 && Math.abs(w.z - pos.z) < 1);
            if (!exists) {
              windows.push({ x: pos.x, z: pos.z, width: windowWidth, height: windowHeight, wall });
            }
          }
        }
      }
    } catch (groqError) {
      console.error('Groq error:', groqError);
    }

    // Process detected objects into segmented objects with proper positions and rotations
    const segmentedObjects: SegmentedObject[] = [];

    // First pass: create all objects with positions
    for (let i = 0; i < detectedObjects.length; i++) {
      const obj = detectedObjects[i];
      const lowerName = obj.name.toLowerCase();

      // Skip doors and windows from furniture list (they're handled separately)
      if (lowerName.includes('door') || lowerName.includes('window')) continue;

      const defaults = getDefaults(obj.name);

      const x1 = Math.floor((obj.bbox.x1 / 100) * imgWidth);
      const y1 = Math.floor((obj.bbox.y1 / 100) * imgHeight);
      const x2 = Math.floor((obj.bbox.x2 / 100) * imgWidth);
      const y2 = Math.floor((obj.bbox.y2 / 100) * imgHeight);

      const cropWidth = Math.max(10, x2 - x1);
      const cropHeight = Math.max(10, y2 - y1);

      let croppedImageBase64 = '';
      try {
        const croppedBuffer = await sharp(buffer)
          .extract({
            left: Math.max(0, x1),
            top: Math.max(0, y1),
            width: Math.min(cropWidth, imgWidth - x1),
            height: Math.min(cropHeight, imgHeight - y1),
          })
          .resize(256, 256, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
          .png()
          .toBuffer();

        croppedImageBase64 = `data:image/png;base64,${croppedBuffer.toString('base64')}`;
      } catch (cropError) {
        console.error(`Failed to crop ${obj.name}:`, cropError);
      }

      // Calculate scale based on bbox size
      const bboxWidthPct = (obj.bbox.x2 - obj.bbox.x1) / 100;
      const bboxHeightPct = (obj.bbox.y2 - obj.bbox.y1) / 100;
      let scaleFactor = 1.0;

      if (obj.estimated_size === 'small') {
        scaleFactor = defaults.minScale;
      } else if (obj.estimated_size === 'large') {
        scaleFactor = defaults.maxScale;
      } else {
        const avgBboxSize = (bboxWidthPct + bboxHeightPct) / 2;
        scaleFactor = defaults.minScale + (avgBboxSize * 2) * (defaults.maxScale - defaults.minScale);
        scaleFactor = Math.max(defaults.minScale, Math.min(defaults.maxScale, scaleFactor));
      }

      const dims = {
        length: defaults.baseDimensions.length * scaleFactor,
        width: defaults.baseDimensions.width * scaleFactor,
        height: defaults.baseDimensions.height * scaleFactor,
      };

      // Calculate position from image
      const bboxCenterX = (obj.bbox.x1 + obj.bbox.x2) / 2;
      const bboxCenterY = (obj.bbox.y1 + obj.bbox.y2) / 2;

      const position = imageToRoomPosition(
        bboxCenterX, bboxCenterY,
        roomInfo.length, roomInfo.width,
        dims.length, dims.width
      );

      // Calculate rotation
      const rotation = calculateRotationFromImage(
        bboxCenterX, bboxCenterY,
        obj.position_hint,
        obj.facing
      );

      segmentedObjects.push({
        id: `obj-${i}-${Date.now()}`,
        label: obj.name.toLowerCase(),
        category: defaults.category,
        maskUrl: '',
        croppedImageUrl: croppedImageBase64,
        boundingBox: {
          x: obj.bbox.x1,
          y: obj.bbox.y1,
          width: obj.bbox.x2 - obj.bbox.x1,
          height: obj.bbox.y2 - obj.bbox.y1,
        },
        estimatedDimensions: { ...dims, unit: 'ft' },
        modelUrl: '',
        confidence: 0.9,
        position3D: {
          x: position.x,
          y: 0,
          z: position.z,
          rotation: rotation,
        },
        detectedColor: obj.color ? colorNameToHex(obj.color) : defaults.defaultColor,
        material: obj.material,
        style: obj.style,
        nearTo: obj.near,
        againstWall: obj.against_wall,
      });
    }

    const result: SegmentationResult = {
      originalImageUrl: `data:${contentType};base64,${imageBase64}`,
      objects: segmentedObjects,
      roomDimensions: {
        length: roomInfo.length,
        width: roomInfo.width,
        height: roomInfo.height,
        unit: 'ft',
      },
      wallColor: roomInfo.wallColor,
      floorColor: roomInfo.floorColor,
      lighting: 'natural',
    };

    return NextResponse.json({
      ...result,
      doors,
      windows,
      roomType: roomInfo.roomType,
    });
  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json({ error: 'Failed to segment room' }, { status: 500 });
  }
}
