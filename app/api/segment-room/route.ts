import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';
import { SegmentedObject, SegmentationResult } from '@/lib/types/segmentation';

// Initialize Groq client
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || '',
});

// Furniture type mapping for 3D model matching
const FURNITURE_MODELS: Record<string, { category: SegmentedObject['category']; modelFile: string; defaultDimensions: { length: number; width: number; height: number } }> = {
  'couch': { category: 'furniture', modelFile: 'sofa.glb', defaultDimensions: { length: 7, width: 3, height: 2.5 } },
  'sofa': { category: 'furniture', modelFile: 'sofa.glb', defaultDimensions: { length: 7, width: 3, height: 2.5 } },
  'chair': { category: 'furniture', modelFile: 'chair.glb', defaultDimensions: { length: 2.5, width: 2.5, height: 3 } },
  'armchair': { category: 'furniture', modelFile: 'chair.glb', defaultDimensions: { length: 2.5, width: 2.5, height: 3 } },
  'table': { category: 'furniture', modelFile: 'table.glb', defaultDimensions: { length: 4, width: 2.5, height: 2.5 } },
  'dining table': { category: 'furniture', modelFile: 'table.glb', defaultDimensions: { length: 6, width: 3, height: 2.5 } },
  'coffee table': { category: 'furniture', modelFile: 'coffee_table.glb', defaultDimensions: { length: 4, width: 2, height: 1.5 } },
  'desk': { category: 'furniture', modelFile: 'desk.glb', defaultDimensions: { length: 5, width: 2.5, height: 2.5 } },
  'bed': { category: 'furniture', modelFile: 'bed.glb', defaultDimensions: { length: 7, width: 5, height: 2 } },
  'wardrobe': { category: 'storage', modelFile: 'wardrobe.glb', defaultDimensions: { length: 4, width: 2, height: 7 } },
  'cabinet': { category: 'storage', modelFile: 'cabinet.glb', defaultDimensions: { length: 3, width: 1.5, height: 4 } },
  'bookshelf': { category: 'storage', modelFile: 'bookshelf.glb', defaultDimensions: { length: 3, width: 1, height: 6 } },
  'shelf': { category: 'storage', modelFile: 'bookshelf.glb', defaultDimensions: { length: 3, width: 1, height: 6 } },
  'lamp': { category: 'lighting', modelFile: 'lamp.glb', defaultDimensions: { length: 1, width: 1, height: 5 } },
  'floor lamp': { category: 'lighting', modelFile: 'lamp.glb', defaultDimensions: { length: 1, width: 1, height: 5 } },
  'rug': { category: 'textile', modelFile: 'rug.glb', defaultDimensions: { length: 8, width: 6, height: 0.1 } },
  'carpet': { category: 'textile', modelFile: 'rug.glb', defaultDimensions: { length: 8, width: 6, height: 0.1 } },
  'plant': { category: 'decoration', modelFile: 'plant.glb', defaultDimensions: { length: 1, width: 1, height: 3 } },
  'potted plant': { category: 'decoration', modelFile: 'plant.glb', defaultDimensions: { length: 1, width: 1, height: 3 } },
  'tv': { category: 'furniture', modelFile: 'tv.glb', defaultDimensions: { length: 4, width: 0.5, height: 2.5 } },
  'television': { category: 'furniture', modelFile: 'tv.glb', defaultDimensions: { length: 4, width: 0.5, height: 2.5 } },
  'nightstand': { category: 'furniture', modelFile: 'nightstand.glb', defaultDimensions: { length: 1.5, width: 1.5, height: 2 } },
  'dresser': { category: 'storage', modelFile: 'dresser.glb', defaultDimensions: { length: 4, width: 1.5, height: 3 } },
  'mirror': { category: 'decoration', modelFile: 'mirror.glb', defaultDimensions: { length: 0.2, width: 2, height: 4 } },
  'curtain': { category: 'textile', modelFile: 'curtain.glb', defaultDimensions: { length: 0.5, width: 4, height: 8 } },
  'window': { category: 'decoration', modelFile: 'window.glb', defaultDimensions: { length: 0.2, width: 4, height: 5 } },
};

function findMatchingModel(label: string): { category: SegmentedObject['category']; modelFile: string; defaultDimensions: { length: number; width: number; height: number } } | null {
  const lowerLabel = label.toLowerCase();

  // Direct match
  if (FURNITURE_MODELS[lowerLabel]) {
    return FURNITURE_MODELS[lowerLabel];
  }

  // Partial match
  for (const [key, value] of Object.entries(FURNITURE_MODELS)) {
    if (lowerLabel.includes(key) || key.includes(lowerLabel)) {
      return value;
    }
  }

  // Generic furniture fallback
  return {
    category: 'furniture',
    modelFile: 'generic.glb',
    defaultDimensions: { length: 2, width: 2, height: 2 }
  };
}

// Convert 2D image position (percentage) to 3D room position
// Image: x=0 is left, x=100 is right, y=0 is top, y=100 is bottom
// Room: x is left-right, z is front-back (y=100 in image = front of room)
function imagePositionToRoomPosition(
  imageX: number, // 0-100
  imageY: number, // 0-100
  roomLength: number, // in feet
  roomWidth: number, // in feet
  objectLength: number,
  objectWidth: number
): { x: number; z: number } {
  // Map image X (0-100) to room X (-roomLength/2 to +roomLength/2)
  // Keep furniture inside walls with padding
  const padding = 0.5; // feet from wall
  const usableLength = roomLength - objectLength - padding * 2;
  const usableWidth = roomWidth - objectWidth - padding * 2;

  // Image coordinates: x=0 left, x=100 right, y=0 top (back of room), y=100 bottom (front)
  const normalizedX = (imageX / 100) - 0.5; // -0.5 to 0.5
  const normalizedZ = (imageY / 100) - 0.5; // -0.5 to 0.5 (y=0 is back wall, y=100 is front)

  return {
    x: normalizedX * usableLength,
    z: normalizedZ * usableWidth,
  };
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Convert file to base64
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const imageBase64 = buffer.toString('base64');
    const contentType = file.type;

    let detectedObjects: { name: string; position: { x: number; y: number }; size?: { width: number; height: number } }[] = [];
    let roomDimensions = { length: 15, width: 12, height: 9 };

    // Use Groq's vision model
    try {
      const chatCompletion = await groq.chat.completions.create({
        model: 'meta-llama/llama-4-scout-17b-16e-instruct',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image_url',
                image_url: {
                  url: `data:${contentType};base64,${imageBase64}`,
                },
              },
              {
                type: 'text',
                text: `You are analyzing a room photo to identify furniture for 3D reconstruction.

IMPORTANT: Identify EACH piece of furniture visible in this image.

For each furniture item, provide:
1. "name": The furniture type (sofa, chair, table, bed, lamp, rug, tv, bookshelf, plant, desk, nightstand, dresser, cabinet, etc.)
2. "position": Where it appears in the image as percentage (x: 0=left edge, 100=right edge; y: 0=top/back of room, 100=bottom/front of room)
3. "size": Approximate size as percentage of image (width and height)

Also estimate the room dimensions in feet.

Return ONLY a valid JSON object with this exact structure:
{
  "objects": [
    {"name": "sofa", "position": {"x": 50, "y": 70}, "size": {"width": 40, "height": 20}},
    {"name": "coffee table", "position": {"x": 50, "y": 50}, "size": {"width": 20, "height": 15}},
    {"name": "lamp", "position": {"x": 15, "y": 30}, "size": {"width": 5, "height": 25}}
  ],
  "roomDimensions": {"length": 15, "width": 12, "height": 9}
}

Be thorough - list ALL visible furniture pieces with their positions.`,
              },
            ],
          },
        ],
        max_tokens: 2048,
        temperature: 0.2,
      });

      const responseText = chatCompletion.choices[0]?.message?.content || '';
      console.log('Groq Vision response:', responseText);

      // Parse JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          detectedObjects = parsed.objects || [];
          if (parsed.roomDimensions) {
            roomDimensions = {
              length: parsed.roomDimensions.length || 15,
              width: parsed.roomDimensions.width || 12,
              height: parsed.roomDimensions.height || 9,
            };
          }
          console.log('Detected objects:', detectedObjects);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
        }
      }
    } catch (groqError) {
      console.error('Groq Vision error:', groqError);
    }

    // Convert detected objects to segmented objects with 3D positioning
    const segmentedObjects: SegmentedObject[] = detectedObjects
      .map((obj, index) => {
        const match = findMatchingModel(obj.name);
        if (!match) return null;

        // Get dimensions
        const dimensions = match.defaultDimensions;

        // Calculate 3D position from 2D image position
        const pos3D = imagePositionToRoomPosition(
          obj.position?.x ?? 50,
          obj.position?.y ?? 50,
          roomDimensions.length,
          roomDimensions.width,
          dimensions.length,
          dimensions.width
        );

        return {
          id: `obj-${index}-${Date.now()}`,
          label: obj.name.toLowerCase(),
          category: match.category,
          maskUrl: '',
          croppedImageUrl: '',
          boundingBox: {
            x: obj.position?.x ?? 50,
            y: obj.position?.y ?? 50,
            width: obj.size?.width ?? 20,
            height: obj.size?.height ?? 20,
          },
          estimatedDimensions: {
            ...dimensions,
            unit: 'ft' as const,
          },
          modelUrl: `/models/${match.modelFile}`,
          confidence: 0.9,
          // Store the calculated 3D position
          position3D: {
            x: pos3D.x,
            y: 0,
            z: pos3D.z,
          },
        };
      })
      .filter((obj): obj is SegmentedObject & { position3D: { x: number; y: number; z: number } } => obj !== null);

    const segmentationResult: SegmentationResult = {
      originalImageUrl: `data:${contentType};base64,${imageBase64}`,
      objects: segmentedObjects,
      roomDimensions: {
        ...roomDimensions,
        unit: 'ft',
      },
    };

    return NextResponse.json(segmentationResult);
  } catch (error) {
    console.error('Segmentation error:', error);

    return NextResponse.json(
      { error: 'Failed to segment room image' },
      { status: 500 }
    );
  }
}
