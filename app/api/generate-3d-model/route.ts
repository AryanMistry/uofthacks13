import { NextRequest, NextResponse } from 'next/server';
import { SegmentedObject } from '@/lib/types/segmentation';

// This endpoint generates 3D geometry data for segmented objects
// In a production app, this would call a 2D-to-3D AI service like Meshy, Kaedim, etc.
// For this implementation, we'll generate procedural 3D geometry based on object type

interface Geometry3D {
  type: 'box' | 'cylinder' | 'custom';
  dimensions: { length: number; width: number; height: number };
  color: string;
  position: { x: number; y: number; z: number };
  rotation: number;
}

// Generate 3D geometry based on furniture type
function generateGeometry(object: SegmentedObject, roomDimensions: any): Geometry3D {
  const unit = object.estimatedDimensions?.unit === 'ft' ? 0.3048 : 1;
  const length = (object.estimatedDimensions?.length || 2) * unit;
  const width = (object.estimatedDimensions?.width || 2) * unit;
  const height = (object.estimatedDimensions?.height || 2) * unit;

  // Calculate position based on bounding box percentage and room dimensions
  const roomL = (roomDimensions?.length || 12) * 0.3048;
  const roomW = (roomDimensions?.width || 10) * 0.3048;

  // Convert percentage position to 3D coordinates
  const x = ((object.boundingBox.x / 100) - 0.5) * roomL;
  const z = ((object.boundingBox.y / 100) - 0.5) * roomW;
  const y = height / 2; // Place on floor

  // Color based on category
  const colorMap: Record<string, string> = {
    'furniture': '#8B7355',
    'lighting': '#FFD700',
    'textile': '#9370DB',
    'decoration': '#20B2AA',
    'storage': '#8B4513',
    'unknown': '#808080',
  };

  return {
    type: object.label === 'lamp' ? 'cylinder' : 'box',
    dimensions: { length, width, height },
    color: colorMap[object.category] || '#808080',
    position: { x, y, z },
    rotation: 0,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { objects, roomDimensions } = body as {
      objects: SegmentedObject[];
      roomDimensions?: { length: number; width: number; height: number };
    };

    if (!objects || !Array.isArray(objects)) {
      return NextResponse.json(
        { error: 'No objects provided' },
        { status: 400 }
      );
    }

    // Generate 3D geometry for each object
    const geometries = objects.map((obj) => ({
      id: obj.id,
      label: obj.label,
      category: obj.category,
      geometry: generateGeometry(obj, roomDimensions),
    }));

    return NextResponse.json({
      success: true,
      models: geometries,
    });
  } catch (error) {
    console.error('3D generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate 3D models' },
      { status: 500 }
    );
  }
}
