# Floorplan-Based Room Generation - Testing Guide

## Overview
The application now uses floorplan images as the **primary source** for generating accurate 3D room layouts with exact dimensions, shapes, doors, and windows.

## What Changed

### 1. **Floorplan is Now Required**
- Users must upload a floorplan image
- The floorplan is analyzed by AI to extract:
  - Exact room dimensions (length, width, height)
  - Room shape (rectangular, L-shape, or custom)
  - Wall segments with cardinal directions (N, S, E, W)
  - Door positions and sizes
  - Window positions and sizes
  - Cardinal orientation

### 2. **New API Endpoint: `/api/generate-room-from-floorplan`**
- Accepts floorplan image
- Uses Groq's Llama Vision model to analyze architectural drawings
- Returns structured room data with:
  - Precise dimensions
  - Wall coordinates
  - Door/window placements
  - Cardinal directions

### 3. **Custom 3D Room Geometry**
- New module: `lib/3d/room-geometry.ts`
- Generates 3D meshes from floorplan data
- Supports:
  - Custom wall shapes (not just rectangles)
  - L-shaped rooms
  - Irregular room shapes
  - Accurate door/window placement on correct walls

### 4. **Smart Furniture Placement**
- Furniture is placed **inside** the generated 3D room
- Respects room boundaries from floorplan
- Avoids doors and windows
- Uses cardinal directions for optimal placement

## Testing Instructions

### Step 1: Start the Server
```bash
npm run dev
```
Server should be running at http://localhost:3000

### Step 2: Add Gemini API Key (Required for AI Analysis)
Create a `.env.local` file in the project root:
```env
GEMINI_API_KEY=AIzaSyDdV_EgLBuaYeztSEN49OOu1XQpAyVk99w
```

The system uses **Google's Gemini AI** for vision analysis, which provides excellent architectural drawing analysis.

### Step 3: Test with the Provided Floorplan

1. **Navigate to Upload Page**
   - Go to http://localhost:3000/upload

2. **Upload Room Photo** (optional but recommended)
   - Upload any room photo for furniture detection

3. **Upload Floorplan** (REQUIRED)
   - Upload the floorplan image you provided (McDowell Second Floor)
   - The image shows:
     - 16'6" × 10'6" room
     - Multiple windows (3 visible)
     - Door on left wall
     - Rectangular shape

4. **Click "Analyze Images"**
   - AI will analyze the floorplan
   - Extract dimensions: ~16.5 × 10.5 × 9 feet
   - Detect 3 windows and 1 door
   - Generate 3D room geometry

5. **View Results**
   - See detected objects
   - Room dimensions should match floorplan
   - Windows and doors should be positioned correctly

6. **Continue to Quiz**
   - Answer personality questions
   - These affect furniture selection and placement

7. **View 3D Design**
   - See the generated 3D room
   - Room shape matches floorplan
   - Windows and doors in correct positions
   - Furniture placed inside the room boundaries

### Step 4: Verify Key Features

#### ✅ Room Dimensions
- Should be approximately 16.5 × 10.5 feet (from floorplan)
- Height: 9 feet (standard)

#### ✅ Windows
- Should see 3 windows:
  - 1 on right wall (east)
  - 2 on south wall (bottom)
- Windows should have frames and glass

#### ✅ Door
- Should see 1 door on left wall (west)
- Door should have frame and handle

#### ✅ Room Shape
- Should be rectangular
- Walls should form correct shape

#### ✅ Furniture Placement
- Furniture should be inside room boundaries
- Should avoid door/window areas
- Should respect wall positions

## Expected AI Response Format

The AI should return JSON like:
```json
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
      // ... more walls
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
      "cardinal": "W"
    }
  ],
  "windows": [
    {
      "position": 8.0,
      "width": 4,
      "height": 4,
      "wall": "east",
      "cardinal": "E"
    },
    {
      "position": 5.0,
      "width": 3,
      "height": 3,
      "wall": "south",
      "cardinal": "S"
    },
    {
      "position": 12.0,
      "width": 3,
      "height": 3,
      "wall": "south",
      "cardinal": "S"
    }
  ]
}
```

## Troubleshooting

### Issue: "Floorplan is required" error
- **Solution**: Make sure you upload a floorplan image before clicking "Analyze Images"

### Issue: AI returns fallback room
- **Cause**: GEMINI_API_KEY not set or API error
- **Solution**: 
  1. Check `.env.local` has `GEMINI_API_KEY=AIzaSyDdV_EgLBuaYeztSEN49OOu1XQpAyVk99w`
  2. Restart server after adding key
  3. Check console for API errors

### Issue: Room dimensions seem wrong
- **Cause**: AI misread floorplan dimensions
- **Solution**: 
  1. Ensure floorplan image is clear and readable
  2. Dimensions should be visible in the image
  3. Try a higher resolution image

### Issue: Windows/doors in wrong positions
- **Cause**: AI misidentified wall positions
- **Solution**:
  1. Check if floorplan has clear wall indicators
  2. Verify cardinal directions are marked
  3. May need to adjust AI prompt for better accuracy

## Architecture Flow

```
1. User uploads floorplan
   ↓
2. /api/generate-room-from-floorplan
   - Sends to Google Gemini Vision AI
   - AI analyzes architectural drawing
   - Returns structured room data
   ↓
3. PhotoUpload component
   - Stores room data in store
   - Includes shape, dimensions, doors, windows
   ↓
4. RoomCanvas component
   - Calls generateRoomGeometry()
   - Creates custom 3D meshes from floorplan data
   - Adds doors and windows at correct positions
   ↓
5. Furniture placement
   - /api/generate-3d-model
   - Places furniture inside room boundaries
   - Respects doors/windows
   ↓
6. 3D visualization
   - User sees accurate room layout
   - Can drag furniture around
   - Room matches floorplan
```

## Files Modified

1. **components/upload/PhotoUpload.tsx** - Made floorplan required
2. **app/api/generate-room-from-floorplan/route.ts** - New API endpoint
3. **lib/3d/room-geometry.ts** - New 3D geometry generator
4. **components/room-viewer/RoomCanvas.tsx** - Uses custom room geometry
5. **lib/types/room.ts** - Added Wall, Door, Window types
6. **lib/types/segmentation.ts** - Added RoomShape type

## Next Steps

1. Test with various floorplan types:
   - L-shaped rooms
   - Rooms with multiple doors
   - Rooms with bay windows
   - Non-rectangular shapes

2. Improve AI prompt for better accuracy

3. Add manual floorplan editing tools

4. Support PDF floorplans

5. Add room measurement validation

