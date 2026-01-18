import { NextRequest, NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

interface Wall {
  start: { x: number; z: number };
  end: { x: number; z: number };
  length: number;
  cardinal?: string; // 'N', 'S', 'E', 'W'
}

interface RoomShape {
  type: 'rectangle' | 'L-shape' | 'custom';
  walls: Wall[];
  corners: { x: number; z: number }[];
}

interface Door {
  x: number;
  z: number;
  width: number;
  wall: string;
  cardinal?: string;
}

interface Window {
  x: number;
  z: number;
  width: number;
  height: number;
  wall: string;
  cardinal?: string;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const floorplanFile = formData.get('floorplan') as File;
    const roomPhotoFile = formData.get('roomPhoto') as File | null;

    if (!floorplanFile) {
      return NextResponse.json(
        { error: 'Floorplan is required' },
        { status: 400 }
      );
    }

    // Convert floorplan to base64
    const floorplanBuffer = Buffer.from(await floorplanFile.arrayBuffer());
    const floorplanBase64 = floorplanBuffer.toString('base64');
    const floorplanContentType = floorplanFile.type;

    // Analyze floorplan with OpenAI GPT-4 Vision
    console.log('Analyzing floorplan with OpenAI GPT-4 Vision...');

    const prompt = `Analyze this architectural floorplan in EXTREME DETAIL. Extract:

1. **Exact Dimensions** (in feet):
   - Overall length and width
   - Height (assume 9-10ft if not shown)
   - Measure carefully from the scale/dimensions shown

2. **Room Shape**:
   - Is it rectangular, L-shaped, or custom?
   - List ALL wall segments with start/end coordinates
   - List ALL corner points

3. **Cardinal Orientation**:
   - Which direction is North? (look for compass rose or orientation markers)
   - Label each wall with cardinal direction (N, S, E, W, NE, etc.)

4. **Doors** (for EACH door):
   - Exact position along wall (in feet from corner)
   - Width
   - Which wall (north, south, east, west)
   - Cardinal direction it faces
   - Type (single, double, sliding, etc.)

5. **Windows** (for EACH window):
   - Exact position along wall
   - Width and height
   - Which wall
   - Cardinal direction
   - Sill height if shown

6. **Other Features**:
   - Built-in closets or alcoves
   - Structural columns
   - Any wall offsets or niches

Return ONLY valid JSON with this EXACT structure:
{
  "dimensions": {
    "length": 16.5,
    "width": 10.5,
    "height": 9,
    "unit": "ft"
  },
  "shape": {
    "type": "rectangle",
    "walls": [
      {
        "start": {"x": -8.25, "z": -5.25},
        "end": {"x": 8.25, "z": -5.25},
        "length": 16.5,
        "cardinal": "N"
      },
      {
        "start": {"x": 8.25, "z": -5.25},
        "end": {"x": 8.25, "z": 5.25},
        "length": 10.5,
        "cardinal": "E"
      },
      {
        "start": {"x": 8.25, "z": 5.25},
        "end": {"x": -8.25, "z": 5.25},
        "length": 16.5,
        "cardinal": "S"
      },
      {
        "start": {"x": -8.25, "z": 5.25},
        "end": {"x": -8.25, "z": -5.25},
        "length": 10.5,
        "cardinal": "W"
      }
    ],
    "corners": [
      {"x": -8.25, "z": -5.25},
      {"x": 8.25, "z": -5.25},
      {"x": 8.25, "z": 5.25},
      {"x": -8.25, "z": 5.25}
    ]
  },
  "doors": [
    {
      "position": 2.5,
      "width": 3,
      "wall": "west",
      "cardinal": "W",
      "type": "single"
    }
  ],
  "windows": [
    {
      "position": 8.0,
      "width": 4,
      "height": 4,
      "wall": "east",
      "cardinal": "E",
      "sillHeight": 3
    },
    {
      "position": 5.0,
      "width": 3,
      "height": 3,
      "wall": "south",
      "cardinal": "S",
      "sillHeight": 3
    }
  ],
  "features": {
    "closets": [],
    "alcoves": [],
    "columns": []
  },
  "cardinal": {
    "north": "top",
    "orientation": 0
  },
  "roomType": "bedroom",
  "notes": "Standard rectangular bedroom with windows on east and south walls"
}

CRITICAL: Use the room's center (0, 0) as origin. Negative X = west, Positive X = east, Negative Z = north, Positive Z = south.`;

    console.log('📤 Sending floorplan to OpenAI...');
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            {
              type: "image_url",
              image_url: {
                url: `data:${floorplanContentType};base64,${floorplanBase64}`,
              },
            },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    });
    
    const responseText = response.choices[0]?.message?.content || '';
    
    console.log('========================================');
    console.log('✅ OPENAI GPT-4 VISION RESPONSE RECEIVED');
    console.log('========================================');
    console.log('📊 Response length:', responseText.length, 'characters');
    console.log('========================================');
    console.log('📄 FULL RAW RESPONSE FROM OPENAI:');
    console.log(responseText);
    console.log('========================================');

    // Parse JSON from response
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error('❌ FAILED TO FIND JSON IN RESPONSE');
      throw new Error('Failed to parse floorplan data from AI response');
    }

    const floorplanData = JSON.parse(jsonMatch[0]);
    
    console.log('========================================');
    console.log('🔍 PARSED FLOORPLAN DATA FROM OPENAI:');
    console.log('========================================');
    console.log('📐 Dimensions:', JSON.stringify(floorplanData.dimensions, null, 2));
    console.log('🔷 Shape:', JSON.stringify(floorplanData.shape, null, 2));
    console.log('🚪 Doors:', JSON.stringify(floorplanData.doors, null, 2));
    console.log('🪟 Windows:', JSON.stringify(floorplanData.windows, null, 2));
    console.log('🧭 Cardinal:', JSON.stringify(floorplanData.cardinal, null, 2));
    console.log('🏷️ Room Type:', floorplanData.roomType);
    console.log('========================================');

    // Convert door/window positions to 3D coordinates
    const processedDoors: Door[] = [];
    const processedWindows: Window[] = [];

    const halfLength = floorplanData.dimensions.length / 2;
    const halfWidth = floorplanData.dimensions.width / 2;

    // Process doors
    if (floorplanData.doors) {
      for (const door of floorplanData.doors) {
        let x = 0, z = 0;
        const pos = door.position || 0;

        switch (door.wall.toLowerCase()) {
          case 'north':
          case 'top':
            x = pos - halfLength;
            z = -halfWidth;
            break;
          case 'south':
          case 'bottom':
            x = pos - halfLength;
            z = halfWidth;
            break;
          case 'east':
          case 'right':
            x = halfLength;
            z = pos - halfWidth;
            break;
          case 'west':
          case 'left':
            x = -halfLength;
            z = pos - halfWidth;
            break;
        }

        processedDoors.push({
          x,
          z,
          width: door.width || 3,
          wall: door.wall.toLowerCase(),
          cardinal: door.cardinal,
        });
      }
    }

    // Process windows
    if (floorplanData.windows) {
      for (const window of floorplanData.windows) {
        let x = 0, z = 0;
        const pos = window.position || 0;

        switch (window.wall.toLowerCase()) {
          case 'north':
          case 'top':
            x = pos - halfLength;
            z = -halfWidth;
            break;
          case 'south':
          case 'bottom':
            x = pos - halfLength;
            z = halfWidth;
            break;
          case 'east':
          case 'right':
            x = halfLength;
            z = pos - halfWidth;
            break;
          case 'west':
          case 'left':
            x = -halfLength;
            z = pos - halfWidth;
            break;
        }

        processedWindows.push({
          x,
          z,
          width: window.width || 4,
          height: window.height || 4,
          wall: window.wall.toLowerCase(),
          cardinal: window.cardinal,
        });
      }
    }

    // Build response
    const result = {
      dimensions: floorplanData.dimensions,
      shape: floorplanData.shape,
      doors: processedDoors,
      windows: processedWindows,
      features: floorplanData.features || {},
      cardinal: floorplanData.cardinal || { north: 'top', orientation: 0 },
      roomType: floorplanData.roomType || 'room',
      wallColor: '#FAF0E6',
      floorColor: '#B8860B',
      notes: floorplanData.notes,
    };

    console.log('Processed floorplan data:', JSON.stringify(result, null, 2));

    return NextResponse.json(result);
  } catch (error) {
    console.error('❌ Floorplan analysis error:', error);
    console.error('Error details:', JSON.stringify(error, null, 2));

    // Return fallback rectangular room
    console.log('⚠️  Using fallback room layout due to API error');
    return NextResponse.json({
      dimensions: {
        length: 16,
        width: 12,
        height: 9,
        unit: 'ft',
      },
      shape: {
        type: 'rectangle',
        walls: [
          {
            start: { x: -8, z: -6 },
            end: { x: 8, z: -6 },
            length: 16,
            cardinal: 'N',
          },
          {
            start: { x: 8, z: -6 },
            end: { x: 8, z: 6 },
            length: 12,
            cardinal: 'E',
          },
          {
            start: { x: 8, z: 6 },
            end: { x: -8, z: 6 },
            length: 16,
            cardinal: 'S',
          },
          {
            start: { x: -8, z: 6 },
            end: { x: -8, z: -6 },
            length: 12,
            cardinal: 'W',
          },
        ],
        corners: [
          { x: -8, z: -6 },
          { x: 8, z: -6 },
          { x: 8, z: 6 },
          { x: -8, z: 6 },
        ],
      },
      doors: [],
      windows: [],
      features: {},
      cardinal: { north: 'top', orientation: 0 },
      roomType: 'room',
      wallColor: '#FAF0E6',
      floorColor: '#B8860B',
      error: 'Used fallback room layout',
    });
  }
}

