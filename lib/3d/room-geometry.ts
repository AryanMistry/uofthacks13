import * as THREE from 'three';
import { Wall, RoomShape } from '@/lib/types/segmentation';

/**
 * Generate 3D room geometry from floorplan data
 */
export function generateRoomGeometry(
  roomShape: RoomShape | undefined,
  roomLength: number,
  roomWidth: number,
  roomHeight: number,
  unit: number = 0.3048
): {
  floor: THREE.Mesh;
  walls: THREE.Mesh[];
  ceiling?: THREE.Mesh;
} {
  // If we have custom walls from floorplan, use them
  if (roomShape?.walls && roomShape.walls.length > 0) {
    return generateCustomRoomGeometry(roomShape, roomHeight, unit);
  }

  // Otherwise, generate standard rectangular room
  return generateRectangularRoom(roomLength, roomWidth, roomHeight);
}

/**
 * Generate rectangular room (fallback)
 */
function generateRectangularRoom(
  roomLength: number,
  roomWidth: number,
  roomHeight: number
): {
  floor: THREE.Mesh;
  walls: THREE.Mesh[];
  ceiling?: THREE.Mesh;
} {
  // Floor
  const floorGeometry = new THREE.PlaneGeometry(roomLength, roomWidth, 20, 20);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xB8860B,
    roughness: 0.7,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.name = 'floor';

  // Walls
  const createWallMaterial = () =>
    new THREE.MeshStandardMaterial({
      color: 0xFAF0E6,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });

  const walls: THREE.Mesh[] = [];

  // Back wall
  const backWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomLength, roomHeight),
    createWallMaterial()
  );
  backWall.position.set(0, roomHeight / 2, -roomWidth / 2);
  backWall.receiveShadow = true;
  backWall.name = 'wall-back';
  walls.push(backWall);

  // Front wall
  const frontWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomLength, roomHeight),
    createWallMaterial()
  );
  frontWall.position.set(0, roomHeight / 2, roomWidth / 2);
  frontWall.rotation.y = Math.PI;
  frontWall.receiveShadow = true;
  frontWall.name = 'wall-front';
  walls.push(frontWall);

  // Left wall
  const leftWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomHeight),
    createWallMaterial()
  );
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(-roomLength / 2, roomHeight / 2, 0);
  leftWall.receiveShadow = true;
  leftWall.name = 'wall-left';
  walls.push(leftWall);

  // Right wall
  const rightWall = new THREE.Mesh(
    new THREE.PlaneGeometry(roomWidth, roomHeight),
    createWallMaterial()
  );
  rightWall.rotation.y = -Math.PI / 2;
  rightWall.position.set(roomLength / 2, roomHeight / 2, 0);
  rightWall.receiveShadow = true;
  rightWall.name = 'wall-right';
  walls.push(rightWall);

  return { floor, walls };
}

/**
 * Generate custom room from floorplan walls
 */
function generateCustomRoomGeometry(
  roomShape: RoomShape,
  roomHeight: number,
  unit: number
): {
  floor: THREE.Mesh;
  walls: THREE.Mesh[];
  ceiling?: THREE.Mesh;
} {
  const walls: THREE.Mesh[] = [];
  const corners = roomShape.corners || [];

  console.log('🏠 GENERATING CUSTOM ROOM GEOMETRY');
  console.log('📐 Input data:', { corners, walls: roomShape.walls, unit, roomHeight });

  // Create floor from corners
  let floorShape: THREE.Shape;
  
  if (corners.length >= 3) {
    // Create custom floor shape
    // Note: Floor is rotated -90° on X axis, so we use x and -z
    console.log('🟫 GENERATING FLOOR FROM CORNERS:');
    floorShape = new THREE.Shape();
    console.log(`  Corner 0: (${corners[0].x}, ${corners[0].z}) → moveTo(${(corners[0].x * unit).toFixed(2)}, ${(-corners[0].z * unit).toFixed(2)})`);
    floorShape.moveTo(corners[0].x * unit, -corners[0].z * unit);
    for (let i = 1; i < corners.length; i++) {
      console.log(`  Corner ${i}: (${corners[i].x}, ${corners[i].z}) → lineTo(${(corners[i].x * unit).toFixed(2)}, ${(-corners[i].z * unit).toFixed(2)})`);
      floorShape.lineTo(corners[i].x * unit, -corners[i].z * unit);
    }
    floorShape.closePath();
    console.log('✅ Floor shape closed');
  } else {
    // Fallback to rectangle
    const maxX = Math.max(...(roomShape.walls?.map(w => Math.max(w.start.x, w.end.x)) || [8]));
    const minX = Math.min(...(roomShape.walls?.map(w => Math.min(w.start.x, w.end.x)) || [-8]));
    const maxZ = Math.max(...(roomShape.walls?.map(w => Math.max(w.start.z, w.end.z)) || [6]));
    const minZ = Math.min(...(roomShape.walls?.map(w => Math.min(w.start.z, w.end.z)) || [-6]));
    
    const width = (maxX - minX) * unit;
    const depth = (maxZ - minZ) * unit;
    
    console.log('🟫 GENERATING FALLBACK RECTANGULAR FLOOR:', { width, depth });
    floorShape = new THREE.Shape();
    floorShape.moveTo(-width / 2, -depth / 2);
    floorShape.lineTo(width / 2, -depth / 2);
    floorShape.lineTo(width / 2, depth / 2);
    floorShape.lineTo(-width / 2, depth / 2);
    floorShape.closePath();
  }

  const floorGeometry = new THREE.ShapeGeometry(floorShape);
  const floorMaterial = new THREE.MeshStandardMaterial({
    color: 0xB8860B,
    roughness: 0.7,
    metalness: 0.05,
  });
  const floor = new THREE.Mesh(floorGeometry, floorMaterial);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = 0;
  floor.receiveShadow = true;
  floor.name = 'floor-custom';

  // Create walls from wall segments
  const createWallMaterial = () =>
    new THREE.MeshStandardMaterial({
      color: 0xFAF0E6,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });

  if (roomShape.walls) {
    console.log('🏗️ GENERATING WALLS FROM FLOORPLAN DATA:');
    roomShape.walls.forEach((wall, index) => {
      const startX = wall.start.x * unit;
      const startZ = wall.start.z * unit;
      const endX = wall.end.x * unit;
      const endZ = wall.end.z * unit;

      const wallLength = wall.length * unit;
      const centerX = (startX + endX) / 2;
      const centerZ = (startZ + endZ) / 2;

      // Calculate wall rotation based on direction
      // In Three.js, a plane by default faces +Z (forward)
      // We need to rotate it to be perpendicular to the wall direction
      // and face inward (toward room center at 0,0)
      const dx = endX - startX;
      const dz = endZ - startZ;
      
      // The wall runs along vector (dx, dz)
      // To face inward, we need the normal to point toward (0,0) from the wall center
      // For a rectangle centered at origin, this is simple:
      // - North wall (z < 0): normal points +Z (south/inward)
      // - South wall (z > 0): normal points -Z (north/inward)
      // - East wall (x > 0): normal points -X (west/inward)
      // - West wall (x < 0): normal points +X (east/inward)
      
      let angle = 0;
      if (Math.abs(dz) < 0.01) {
        // Horizontal wall (runs along X axis)
        if (centerZ < 0) {
          // North wall - face south (0°)
          angle = 0;
        } else {
          // South wall - face north (180°)
          angle = Math.PI;
        }
      } else if (Math.abs(dx) < 0.01) {
        // Vertical wall (runs along Z axis)
        if (centerX < 0) {
          // West wall - face east (90°)
          angle = Math.PI / 2;
        } else {
          // East wall - face west (-90° or 270°)
          angle = -Math.PI / 2;
        }
      } else {
        // Diagonal wall - use perpendicular calculation
        angle = Math.atan2(dz, dx) + Math.PI / 2;
      }

      console.log(`  Wall ${wall.cardinal || index}:`);
      console.log(`    Start: (${wall.start.x}, ${wall.start.z}) → (${startX.toFixed(2)}, ${startZ.toFixed(2)}) meters`);
      console.log(`    End: (${wall.end.x}, ${wall.end.z}) → (${endX.toFixed(2)}, ${endZ.toFixed(2)}) meters`);
      console.log(`    Center: (${centerX.toFixed(2)}, ${centerZ.toFixed(2)})`);
      console.log(`    Length: ${wallLength.toFixed(2)} meters`);
      console.log(`    Direction: dx=${dx.toFixed(2)}, dz=${dz.toFixed(2)}`);
      console.log(`    Rotation: ${angle.toFixed(2)} rad (${(angle * 180 / Math.PI).toFixed(1)}°)`);

      const wallMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(wallLength, roomHeight),
        createWallMaterial()
      );
      wallMesh.position.set(centerX, roomHeight / 2, centerZ);
      wallMesh.rotation.y = angle;
      wallMesh.receiveShadow = true;
      wallMesh.name = `wall-${wall.cardinal || index}`;
      wallMesh.userData = { cardinal: wall.cardinal, wallIndex: index };

      walls.push(wallMesh);
    });
    console.log('✅ Wall generation complete');
  }

  return { floor, walls };
}

/**
 * Add doors to the scene
 */
export function addDoors(
  scene: THREE.Scene,
  doors: Array<{ x: number; z: number; width: number; wall: string }> | undefined,
  roomHeight: number,
  unit: number = 0.3048
): THREE.Group[] {
  if (!doors || doors.length === 0) return [];

  const doorGroups: THREE.Group[] = [];

  for (const door of doors) {
    const doorWidth = door.width * unit;
    const doorHeight = roomHeight * 0.85;
    const doorX = door.x * unit;
    const doorZ = door.z * unit;

    const doorMaterial = new THREE.MeshStandardMaterial({
      color: 0x8B4513,
      roughness: 0.6,
    });
    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xF5F5F5,
      roughness: 0.3,
    });

    const doorGroup = new THREE.Group();

    // Door panel
    const doorPanel = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth * 0.9, doorHeight * 0.95, 0.04),
      doorMaterial
    );
    doorPanel.castShadow = true;
    doorGroup.add(doorPanel);

    // Door handle
    const handleMaterial = new THREE.MeshStandardMaterial({
      color: 0xC0C0C0,
      metalness: 0.8,
      roughness: 0.2,
    });
    const handle = new THREE.Mesh(
      new THREE.BoxGeometry(0.1, 0.03, 0.08),
      handleMaterial
    );
    handle.position.set(doorWidth * 0.35, 0, 0.04);
    doorGroup.add(handle);

    // Door frame
    const frameThickness = 0.05;
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth + frameThickness * 2, frameThickness, 0.06),
      frameMaterial
    );
    topFrame.position.y = doorHeight / 2;
    doorGroup.add(topFrame);

    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness, 0.06),
      frameMaterial
    );
    leftFrame.position.x = -doorWidth / 2;
    doorGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, doorHeight + frameThickness, 0.06),
      frameMaterial
    );
    rightFrame.position.x = doorWidth / 2;
    doorGroup.add(rightFrame);

    doorGroup.position.set(doorX, doorHeight / 2, doorZ);
    doorGroup.name = 'door';
    scene.add(doorGroup);
    doorGroups.push(doorGroup);
  }

  return doorGroups;
}

/**
 * Add windows to the scene
 */
export function addWindows(
  scene: THREE.Scene,
  windows: Array<{ x: number; z: number; width: number; height: number; wall: string }> | undefined,
  roomHeight: number,
  unit: number = 0.3048
): THREE.Group[] {
  if (!windows || windows.length === 0) return [];

  const windowGroups: THREE.Group[] = [];

  for (const win of windows) {
    const winWidth = win.width * unit;
    const winHeight = win.height * unit;
    const winX = win.x * unit;
    const winZ = win.z * unit;

    const frameMaterial = new THREE.MeshStandardMaterial({
      color: 0xFFFFFF,
      roughness: 0.3,
    });
    const glassMaterial = new THREE.MeshStandardMaterial({
      color: 0x87CEEB,
      transparent: true,
      opacity: 0.3,
      metalness: 0.1,
      roughness: 0.1,
    });

    const windowGroup = new THREE.Group();

    // Glass pane
    const glass = new THREE.Mesh(
      new THREE.PlaneGeometry(winWidth, winHeight),
      glassMaterial
    );
    windowGroup.add(glass);

    // Window frame
    const frameThickness = 0.05;
    const topFrame = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + frameThickness * 2, frameThickness, 0.02),
      frameMaterial
    );
    topFrame.position.y = winHeight / 2;
    windowGroup.add(topFrame);

    const bottomFrame = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth + frameThickness * 2, frameThickness, 0.02),
      frameMaterial
    );
    bottomFrame.position.y = -winHeight / 2;
    windowGroup.add(bottomFrame);

    const leftFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, winHeight, 0.02),
      frameMaterial
    );
    leftFrame.position.x = -winWidth / 2;
    windowGroup.add(leftFrame);

    const rightFrame = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness, winHeight, 0.02),
      frameMaterial
    );
    rightFrame.position.x = winWidth / 2;
    windowGroup.add(rightFrame);

    // Center dividers
    const centerVertical = new THREE.Mesh(
      new THREE.BoxGeometry(frameThickness / 2, winHeight, 0.02),
      frameMaterial
    );
    windowGroup.add(centerVertical);

    const centerHorizontal = new THREE.Mesh(
      new THREE.BoxGeometry(winWidth, frameThickness / 2, 0.02),
      frameMaterial
    );
    windowGroup.add(centerHorizontal);

    windowGroup.position.set(winX, roomHeight * 0.55, winZ);
    windowGroup.name = 'window';
    scene.add(windowGroup);
    windowGroups.push(windowGroup);
  }

  return windowGroups;
}

