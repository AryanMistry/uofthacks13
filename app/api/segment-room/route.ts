import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import sharp from 'sharp';
import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Furniture defaults - used as BASE for dimension estimation
// Actual dimensions will be scaled based on bounding box size
const FURNITURE_DEFAULTS: Record<string, {
  category: SegmentedObject['category'];
  baseDimensions: { length: number; width: number; height: number };
  defaultColor: string;
  minScale: number; // Minimum scale factor
  maxScale: number; // Maximum scale factor
}> = {
  'sofa': { category: 'furniture', baseDimensions: { length: 6, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.7, maxScale: 1.3 },
  'couch': { category: 'furniture', baseDimensions: { length: 6, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.7, maxScale: 1.3 },
  'sectional': { category: 'furniture', baseDimensions: { length: 9, width: 6, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2 },
  'loveseat': { category: 'furniture', baseDimensions: { length: 4.5, width: 3, height: 2.5 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2 },
  'chair': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 3 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2 },
  'armchair': { category: 'furniture', baseDimensions: { length: 2.5, width: 2.5, height: 3 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2 },
  'dining chair': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 3 }, defaultColor: '#8B4513', minScale: 0.9, maxScale: 1.1 },
  'office chair': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 3.5 }, defaultColor: '#333333', minScale: 0.9, maxScale: 1.1 },
  'table': { category: 'furniture', baseDimensions: { length: 4, width: 2.5, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5 },
  'coffee table': { category: 'furniture', baseDimensions: { length: 3.5, width: 2, height: 1.3 }, defaultColor: '#8B7355', minScale: 0.7, maxScale: 1.3 },
  'dining table': { category: 'furniture', baseDimensions: { length: 5, width: 3, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.7, maxScale: 1.4 },
  'desk': { category: 'furniture', baseDimensions: { length: 4, width: 2, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.3 },
  'side table': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2 },
  'end table': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.5, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2 },
  'bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.8, maxScale: 1.2 },
  'king bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 6.5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1 },
  'queen bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1 },
  'twin bed': { category: 'furniture', baseDimensions: { length: 6.5, width: 3.5, height: 2.5 }, defaultColor: '#F5F5DC', minScale: 0.9, maxScale: 1.1 },
  'bookshelf': { category: 'storage', baseDimensions: { length: 3, width: 1, height: 5.5 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5 },
  'shelf': { category: 'storage', baseDimensions: { length: 3, width: 0.8, height: 4 }, defaultColor: '#8B4513', minScale: 0.6, maxScale: 1.5 },
  'cabinet': { category: 'storage', baseDimensions: { length: 2.5, width: 1.2, height: 3 }, defaultColor: '#D2B48C', minScale: 0.7, maxScale: 1.3 },
  'dresser': { category: 'storage', baseDimensions: { length: 4, width: 1.5, height: 2.5 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2 },
  'nightstand': { category: 'furniture', baseDimensions: { length: 1.5, width: 1.3, height: 2 }, defaultColor: '#8B4513', minScale: 0.8, maxScale: 1.2 },
  'tv stand': { category: 'furniture', baseDimensions: { length: 4, width: 1.5, height: 2 }, defaultColor: '#333333', minScale: 0.7, maxScale: 1.3 },
  'tv': { category: 'furniture', baseDimensions: { length: 3.5, width: 0.3, height: 2 }, defaultColor: '#1C1C1C', minScale: 0.6, maxScale: 1.5 },
  'lamp': { category: 'lighting', baseDimensions: { length: 0.8, width: 0.8, height: 4.5 }, defaultColor: '#FFD700', minScale: 0.7, maxScale: 1.5 },
  'floor lamp': { category: 'lighting', baseDimensions: { length: 1.2, width: 1.2, height: 5 }, defaultColor: '#333333', minScale: 0.8, maxScale: 1.2 },
  'table lamp': { category: 'lighting', baseDimensions: { length: 0.8, width: 0.8, height: 2 }, defaultColor: '#FFD700', minScale: 0.8, maxScale: 1.2 },
  'rug': { category: 'textile', baseDimensions: { length: 7, width: 5, height: 0.05 }, defaultColor: '#8B4789', minScale: 0.5, maxScale: 2 },
  'carpet': { category: 'textile', baseDimensions: { length: 9, width: 7, height: 0.05 }, defaultColor: '#696969', minScale: 0.5, maxScale: 2 },
  'plant': { category: 'decoration', baseDimensions: { length: 1.2, width: 1.2, height: 3 }, defaultColor: '#228B22', minScale: 0.5, maxScale: 2 },
  'mirror': { category: 'decoration', baseDimensions: { length: 0.1, width: 2, height: 3.5 }, defaultColor: '#C0C0C0', minScale: 0.6, maxScale: 1.5 },
  'painting': { category: 'decoration', baseDimensions: { length: 0.05, width: 2.5, height: 2 }, defaultColor: '#FFFFFF', minScale: 0.5, maxScale: 2 },
  'art': { category: 'decoration', baseDimensions: { length: 0.05, width: 2, height: 2 }, defaultColor: '#FFFFFF', minScale: 0.5, maxScale: 2 },
  'curtain': { category: 'textile', baseDimensions: { length: 0.2, width: 4, height: 7 }, defaultColor: '#F5F5DC', minScale: 0.7, maxScale: 1.5 },
  'wardrobe': { category: 'storage', baseDimensions: { length: 5, width: 2, height: 6.5 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2 },
  'closet': { category: 'storage', baseDimensions: { length: 4, width: 2, height: 7 }, defaultColor: '#654321', minScale: 0.8, maxScale: 1.2 },
  'ottoman': { category: 'furniture', baseDimensions: { length: 2, width: 2, height: 1.3 }, defaultColor: '#8B6914', minScale: 0.8, maxScale: 1.2 },
  'bench': { category: 'furniture', baseDimensions: { length: 3.5, width: 1.3, height: 1.5 }, defaultColor: '#8B4513', minScale: 0.7, maxScale: 1.3 },
  'stool': { category: 'furniture', baseDimensions: { length: 1.2, width: 1.2, height: 2 }, defaultColor: '#333333', minScale: 0.8, maxScale: 1.2 },
  'console': { category: 'furniture', baseDimensions: { length: 3.5, width: 1.2, height: 2.5 }, defaultColor: '#654321', minScale: 0.7, maxScale: 1.3 },
};

function getDefaults(label: string) {
  const lowerLabel = label.toLowerCase();
  for (const [key, value] of Object.entries(FURNITURE_DEFAULTS)) {
    if (lowerLabel.includes(key)) return value;
  }
  return {
    category: 'furniture' as const,
    baseDimensions: { length: 2, width: 2, height: 2 },
    defaultColor: '#808080',
    minScale: 0.7,
    maxScale: 1.3,
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

    // Get image dimensions for accurate cropping
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
      estimated_size?: 'small' | 'medium' | 'large';
    }[] = [];

    // Default room dimensions - GENEROUS to avoid cramping
    // Overestimate to give furniture breathing room
    let roomInfo = {
      length: 20, // Increased from 15
      width: 16,  // Increased from 12
      height: 10,
      wallColor: '#FAF0E6',
      floorColor: '#B8860B',
      roomType: 'living room',
    };

    // If floorplan is provided, analyze it first for room dimensions
    let floorplanData: {
      doors?: { x: number; z: number; width: number }[];
      windows?: { x: number; z: number; width: number; wall: string }[];
    } | undefined;

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
                  text: `Analyze this floorplan image. Extract room dimensions in feet.
IMPORTANT: Be GENEROUS with dimensions - it's better to overestimate than underestimate.

Return ONLY valid JSON:
{
  "length": 20,
  "width": 16,
  "height": 10,
  "doors": [{"x": 0, "z": 8, "width": 3}],
  "windows": [{"x": -10, "z": 0, "width": 4, "wall": "left"}],
  "roomType": "living room"
}`,
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
          // Apply a 1.2x multiplier to ensure enough space
          roomInfo = {
            ...roomInfo,
            length: Math.max(roomInfo.length, (parsed.length || 15) * 1.2),
            width: Math.max(roomInfo.width, (parsed.width || 12) * 1.2),
            height: parsed.height || roomInfo.height,
            roomType: parsed.roomType || roomInfo.roomType,
          };
          floorplanData = {
            doors: parsed.doors,
            windows: parsed.windows,
          };
          console.log('Floorplan analysis (with 1.2x multiplier):', roomInfo);
        }
      } catch (fpError) {
        console.error('Floorplan analysis error:', fpError);
      }
    }

    // Analyze room photo for furniture detection
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
                text: `Analyze this room image to detect ALL furniture and objects.

For EACH piece of furniture/object, provide:
1. "name": Specific furniture type (e.g., "gray sectional sofa", "wooden coffee table", "floor lamp")
2. "bbox": Bounding box as percentages (0-100):
   - x1: left edge, y1: top edge, x2: right edge, y2: bottom edge
3. "color": Primary color
4. "material": Material type (wood, fabric, leather, metal, glass, etc.)
5. "position_hint": Where in room ("left", "center", "right", "back", "front")
6. "estimated_size": Relative size ("small", "medium", "large")

Also estimate room dimensions in feet. BE GENEROUS - it's better to overestimate room size.

Return ONLY valid JSON:
{
  "objects": [
    {"name": "gray sectional sofa", "bbox": {"x1": 10, "y1": 40, "x2": 60, "y2": 75}, "color": "gray", "material": "fabric", "position_hint": "back", "estimated_size": "large"},
    {"name": "wooden coffee table", "bbox": {"x1": 30, "y1": 55, "x2": 50, "y2": 65}, "color": "brown", "material": "wood", "position_hint": "center", "estimated_size": "medium"},
    {"name": "floor lamp", "bbox": {"x1": 3, "y1": 15, "x2": 10, "y2": 55}, "color": "black", "material": "metal", "position_hint": "left", "estimated_size": "small"}
  ],
  "room": {
    "length": 22,
    "width": 18,
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
          // Take the larger of AI estimate and our defaults (with multiplier)
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
        console.log('Detected', detectedObjects.length, 'objects, room size:', roomInfo.length, 'x', roomInfo.width);
      }
    } catch (groqError) {
      console.error('Groq error:', groqError);
    }

    // Process each detected object with SCALED dimensions
    const segmentedObjects: SegmentedObject[] = [];

    for (let i = 0; i < detectedObjects.length; i++) {
      const obj = detectedObjects[i];
      const defaults = getDefaults(obj.name);

      // Calculate pixel coordinates from percentage bounding box
      const x1 = Math.floor((obj.bbox.x1 / 100) * imgWidth);
      const y1 = Math.floor((obj.bbox.y1 / 100) * imgHeight);
      const x2 = Math.floor((obj.bbox.x2 / 100) * imgWidth);
      const y2 = Math.floor((obj.bbox.y2 / 100) * imgHeight);

      const cropWidth = Math.max(10, x2 - x1);
      const cropHeight = Math.max(10, y2 - y1);

      // Crop the object from the image
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

      // SCALE dimensions based on bounding box size and estimated_size
      const bboxWidthPct = (obj.bbox.x2 - obj.bbox.x1) / 100;
      const bboxHeightPct = (obj.bbox.y2 - obj.bbox.y1) / 100;

      // Calculate scale factor based on bbox size
      // Larger bbox = larger furniture
      let scaleFactor = 1.0;
      if (obj.estimated_size === 'small') {
        scaleFactor = defaults.minScale;
      } else if (obj.estimated_size === 'large') {
        scaleFactor = defaults.maxScale;
      } else {
        // Medium or undefined - scale based on bbox
        const avgBboxSize = (bboxWidthPct + bboxHeightPct) / 2;
        scaleFactor = defaults.minScale + (avgBboxSize * 2) * (defaults.maxScale - defaults.minScale);
        scaleFactor = Math.max(defaults.minScale, Math.min(defaults.maxScale, scaleFactor));
      }

      const dims = {
        length: defaults.baseDimensions.length * scaleFactor,
        width: defaults.baseDimensions.width * scaleFactor,
        height: defaults.baseDimensions.height * scaleFactor,
      };

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
          x: 0, // Will be set by smart layout API
          y: 0,
          z: 0,
        },
        detectedColor: obj.color ? colorNameToHex(obj.color) : defaults.defaultColor,
        material: obj.material,
        style: obj.style,
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
      floorplanData,
      roomType: roomInfo.roomType,
    });
  } catch (error) {
    console.error('Segmentation error:', error);
    return NextResponse.json({ error: 'Failed to segment room' }, { status: 500 });
  }
}
