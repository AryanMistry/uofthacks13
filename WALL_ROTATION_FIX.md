# Wall Rotation Fix - January 18, 2026

## Problem
The 3D room was rendering as a weird cross shape instead of a proper rectangle, even though OpenAI was correctly extracting rectangular room data from the floorplan.

## Root Cause
The wall rotation calculation in `lib/3d/room-geometry.ts` was incorrect. The formula `Math.atan2(-dx, -dz)` was not properly calculating the angle for walls to face inward toward the room center.

## Solution
Changed the wall rotation calculation from:
```typescript
const angle = Math.atan2(-dx, -dz);
```

To:
```typescript
// For a wall from start to end, the inward normal is perpendicular
// Rotate the direction vector 90° clockwise: (dx, dz) -> (dz, -dx)
const angle = Math.atan2(dz, dx) + Math.PI / 2;
```

## How It Works
1. Calculate the direction vector from wall start to end: `(dx, dz)`
2. To get the perpendicular inward-facing normal, rotate 90° clockwise
3. In Three.js coordinate system:
   - +X is right
   - +Z is forward (toward camera)
   - Y-axis rotation controls which way the wall faces
4. The formula `atan2(dz, dx) + π/2` correctly orients each wall segment to face inward

## Expected Result
- North wall (from -8.25,-5.25 to 8.25,-5.25): Should face south (inward)
- East wall (from 8.25,-5.25 to 8.25,5.25): Should face west (inward)
- South wall (from 8.25,5.25 to -8.25,5.25): Should face north (inward)
- West wall (from -8.25,5.25 to -8.25,-5.25): Should face east (inward)

This creates a proper rectangular room with all walls facing inward.

## Testing
1. Go to `http://localhost:3000`
2. Hard refresh (Cmd+Shift+R on Mac / Ctrl+Shift+F5 on Windows)
3. Upload your floorplan and room photo
4. The 3D room should now render as a proper 16.5ft x 10.5ft rectangle

## Files Modified
- `lib/3d/room-geometry.ts` (line 192-196)

