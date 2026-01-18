import * as THREE from 'three';

// Helper to create rounded box geometry
function createRoundedBoxGeometry(
  width: number,
  height: number,
  depth: number,
  radius: number = 0.02,
  segments: number = 4
): THREE.BufferGeometry {
  const shape = new THREE.Shape();
  const eps = 0.00001;
  const r = Math.min(radius, Math.min(width, height) / 2 - eps);

  shape.absarc(r, r, r, Math.PI, Math.PI / 2, true);
  shape.lineTo(width - r, 0);
  shape.absarc(width - r, r, r, Math.PI / 2, 0, true);
  shape.lineTo(width, height - r);
  shape.absarc(width - r, height - r, r, 0, -Math.PI / 2, true);
  shape.lineTo(r, height);
  shape.absarc(r, height - r, r, -Math.PI / 2, Math.PI, true);

  const extrudeSettings = {
    depth: depth,
    bevelEnabled: true,
    bevelThickness: r * 0.5,
    bevelSize: r * 0.5,
    bevelSegments: segments,
  };

  const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
  geometry.center();
  return geometry;
}

// Create fabric texture-like material
function createFabricMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.9,
    metalness: 0,
    flatShading: false,
  });
}

// Create wood material
function createWoodMaterial(color: number, dark: boolean = false): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: dark ? color * 0.7 : color,
    roughness: 0.6,
    metalness: 0.05,
  });
}

// Create metal material
function createMetalMaterial(color: number = 0x888888): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.3,
    metalness: 0.8,
  });
}

// Create leather material
function createLeatherMaterial(color: number): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.7,
    metalness: 0.1,
  });
}

// Create glass material
function createGlassMaterial(): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({
    color: 0xffffff,
    roughness: 0.05,
    metalness: 0.1,
    transparent: true,
    opacity: 0.3,
  });
}

export function createDetailedSofa(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const fabricMat = createFabricMaterial(color);
  const legMat = createWoodMaterial(0x3D2817);

  // Base/seat with rounded edges
  const seatHeight = height * 0.35;
  const seatGeom = new THREE.BoxGeometry(length, seatHeight, width * 0.85);
  seatGeom.translate(0, seatHeight / 2, width * 0.05);
  const seat = new THREE.Mesh(seatGeom, fabricMat);
  group.add(seat);

  // Seat cushions (individual with gaps)
  const cushionCount = Math.max(2, Math.floor(length / 0.8));
  const cushionWidth = (length - 0.05 * (cushionCount + 1)) / cushionCount;
  const cushionMat = createFabricMaterial(color * 1.1);
  
  for (let i = 0; i < cushionCount; i++) {
    const cushion = new THREE.Mesh(
      new THREE.BoxGeometry(cushionWidth, height * 0.12, width * 0.65),
      cushionMat
    );
    cushion.position.set(
      (i - (cushionCount - 1) / 2) * (cushionWidth + 0.03),
      seatHeight + height * 0.06,
      -width * 0.05
    );
    // Round the cushion edges
    cushion.geometry.translate(0, 0, 0);
    group.add(cushion);
  }

  // Back rest with curved profile
  const backHeight = height * 0.55;
  const backGeom = new THREE.BoxGeometry(length * 0.98, backHeight, width * 0.2);
  const back = new THREE.Mesh(backGeom, fabricMat);
  back.position.set(0, seatHeight + backHeight / 2, -width * 0.4);
  group.add(back);

  // Back cushions
  for (let i = 0; i < cushionCount; i++) {
    const backCushion = new THREE.Mesh(
      new THREE.BoxGeometry(cushionWidth * 0.9, backHeight * 0.7, width * 0.15),
      cushionMat
    );
    backCushion.position.set(
      (i - (cushionCount - 1) / 2) * (cushionWidth + 0.03),
      seatHeight + backHeight * 0.5,
      -width * 0.28
    );
    group.add(backCushion);
  }

  // Armrests with rounded tops
  const armHeight = height * 0.5;
  const armWidth = width * 0.12;
  const armMat = createFabricMaterial(color * 0.9);
  
  [-1, 1].forEach(side => {
    const arm = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, armHeight, width),
      armMat
    );
    arm.position.set(side * (length / 2 - armWidth / 2), armHeight / 2, 0);
    group.add(arm);

    // Rounded arm top
    const armTop = new THREE.Mesh(
      new THREE.CylinderGeometry(armWidth / 2, armWidth / 2, width, 16),
      armMat
    );
    armTop.rotation.x = Math.PI / 2;
    armTop.position.set(side * (length / 2 - armWidth / 2), armHeight, 0);
    group.add(armTop);
  });

  // Legs
  const legHeight = height * 0.08;
  const legRadius = 0.03;
  const legGeom = new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legHeight, 8);
  
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(legGeom, legMat);
    leg.position.set(
      x * (length / 2 - 0.1),
      legHeight / 2,
      z * (width / 2 - 0.1)
    );
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedBed(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);
  const fabricMat = createFabricMaterial(0xF5F5F0);

  // Bed frame base
  const frameHeight = height * 0.2;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(length, frameHeight, width),
    woodMat
  );
  frame.position.y = frameHeight / 2;
  group.add(frame);

  // Mattress
  const mattressHeight = height * 0.25;
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.95, mattressHeight, width * 0.92),
    new THREE.MeshStandardMaterial({ color: 0xFFFFF0, roughness: 0.8 })
  );
  mattress.position.set(0, frameHeight + mattressHeight / 2, -width * 0.02);
  group.add(mattress);

  // Bedding/comforter with slight wave
  const beddingHeight = height * 0.08;
  const bedding = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.93, beddingHeight, width * 0.85),
    createFabricMaterial(0xDCDCDC)
  );
  bedding.position.set(0, frameHeight + mattressHeight + beddingHeight / 2, width * 0.02);
  group.add(bedding);

  // Pillows with rounded shape
  const pillowCount = Math.max(2, Math.floor(length / 0.7));
  const pillowWidth = (length * 0.9) / pillowCount;
  
  for (let i = 0; i < pillowCount; i++) {
    const pillow = new THREE.Mesh(
      new THREE.BoxGeometry(pillowWidth * 0.85, height * 0.12, width * 0.2),
      new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.85 })
    );
    pillow.position.set(
      (i - (pillowCount - 1) / 2) * pillowWidth,
      frameHeight + mattressHeight + height * 0.1,
      -width * 0.35
    );
    group.add(pillow);
  }

  // Headboard with paneling
  const headboardHeight = height * 0.7;
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.02, headboardHeight, width * 0.08),
    woodMat
  );
  headboard.position.set(0, headboardHeight / 2 + height * 0.1, -width / 2);
  group.add(headboard);

  // Headboard panels for detail
  const panelCount = 3;
  const panelWidth = (length * 0.9) / panelCount;
  for (let i = 0; i < panelCount; i++) {
    const panel = new THREE.Mesh(
      new THREE.BoxGeometry(panelWidth * 0.85, headboardHeight * 0.7, 0.02),
      woodDarkMat
    );
    panel.position.set(
      (i - 1) * panelWidth,
      headboardHeight / 2 + height * 0.15,
      -width / 2 + 0.05
    );
    group.add(panel);
  }

  // Footboard
  const footboardHeight = height * 0.35;
  const footboard = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.02, footboardHeight, width * 0.06),
    woodMat
  );
  footboard.position.set(0, footboardHeight / 2, width / 2 - 0.03);
  group.add(footboard);

  // Legs
  const legSize = 0.08;
  const legHeight = height * 0.05;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(legSize, legHeight, legSize),
      woodDarkMat
    );
    leg.position.set(
      x * (length / 2 - legSize),
      legHeight / 2,
      z * (width / 2 - legSize)
    );
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedChair(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const fabricMat = createFabricMaterial(color);
  const legMat = createMetalMaterial(0x333333);

  const seatHeight = height * 0.45;
  const seatThickness = height * 0.08;

  // Seat cushion (curved)
  const seatGeom = new THREE.BoxGeometry(length, seatThickness, width);
  const seat = new THREE.Mesh(seatGeom, fabricMat);
  seat.position.y = seatHeight;
  group.add(seat);

  // Back rest (curved)
  const backHeight = height * 0.5;
  const backGeom = new THREE.BoxGeometry(length * 0.95, backHeight, width * 0.1);
  const back = new THREE.Mesh(backGeom, fabricMat);
  back.position.set(0, seatHeight + backHeight / 2 + seatThickness / 2, -width * 0.4);
  // Slight tilt
  back.rotation.x = -0.15;
  group.add(back);

  // Back cushion
  const backCushion = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.8, backHeight * 0.7, width * 0.12),
    createFabricMaterial(color * 1.05)
  );
  backCushion.position.set(0, seatHeight + backHeight / 2 + seatThickness / 2, -width * 0.32);
  backCushion.rotation.x = -0.15;
  group.add(backCushion);

  // Armrests (optional, for armchair)
  const armHeight = height * 0.25;
  const armWidth = length * 0.1;
  [-1, 1].forEach(side => {
    // Arm support
    const armSupport = new THREE.Mesh(
      new THREE.BoxGeometry(armWidth, armHeight, width * 0.7),
      fabricMat
    );
    armSupport.position.set(
      side * (length / 2 - armWidth / 2),
      seatHeight + armHeight / 2,
      -width * 0.1
    );
    group.add(armSupport);
  });

  // Modern tapered legs
  const legHeight = seatHeight - seatThickness / 2;
  const legTopRadius = 0.025;
  const legBottomRadius = 0.015;
  
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(legTopRadius, legBottomRadius, legHeight, 8),
      legMat
    );
    leg.position.set(
      x * (length / 2 - 0.08),
      legHeight / 2,
      z * (width / 2 - 0.08)
    );
    // Slight outward angle
    leg.rotation.z = x * 0.05;
    leg.rotation.x = z * 0.05;
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedTable(
  length: number,
  width: number,
  height: number,
  color: number,
  isCoffeeTable: boolean = false
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);

  // Table top with beveled edges
  const topThickness = height * 0.06;
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(length, topThickness, width),
    woodMat
  );
  top.position.y = height - topThickness / 2;
  group.add(top);

  // Decorative edge/apron
  const apronHeight = height * 0.08;
  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.95, apronHeight, width * 0.95),
    woodDarkMat
  );
  apron.position.y = height - topThickness - apronHeight / 2;
  group.add(apron);

  if (isCoffeeTable) {
    // Coffee table has a lower shelf
    const shelfHeight = height * 0.03;
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.8, shelfHeight, width * 0.8),
      woodMat
    );
    shelf.position.y = height * 0.25;
    group.add(shelf);
  }

  // Legs with taper
  const legHeight = height - topThickness - apronHeight;
  const legTopSize = 0.06;
  const legBottomSize = 0.04;
  
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    // Tapered leg (box for now, could be cylinder)
    const legGeom = new THREE.BoxGeometry(legTopSize, legHeight, legTopSize);
    const leg = new THREE.Mesh(legGeom, woodDarkMat);
    leg.position.set(
      x * (length / 2 - legTopSize * 1.5),
      legHeight / 2,
      z * (width / 2 - legTopSize * 1.5)
    );
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedLamp(
  length: number,
  width: number,
  height: number,
  color: number,
  isFloorLamp: boolean = true
): THREE.Group {
  const group = new THREE.Group();
  const metalMat = createMetalMaterial(0x2F2F2F);
  const shadeMat = new THREE.MeshStandardMaterial({
    color: color || 0xFFF8DC,
    roughness: 0.8,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.9,
    emissive: 0xFFE4B5,
    emissiveIntensity: 0.2,
  });

  const baseRadius = isFloorLamp ? width * 0.35 : width * 0.25;
  const baseHeight = isFloorLamp ? height * 0.04 : height * 0.08;

  // Base
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(baseRadius, baseRadius * 1.1, baseHeight, 24),
    metalMat
  );
  base.position.y = baseHeight / 2;
  group.add(base);

  // Pole/stem
  const poleHeight = isFloorLamp ? height * 0.65 : height * 0.5;
  const poleRadius = isFloorLamp ? 0.02 : 0.015;
  const pole = new THREE.Mesh(
    new THREE.CylinderGeometry(poleRadius, poleRadius, poleHeight, 12),
    metalMat
  );
  pole.position.y = baseHeight + poleHeight / 2;
  group.add(pole);

  // Shade (cone or drum)
  const shadeTopRadius = width * 0.3;
  const shadeBottomRadius = width * 0.5;
  const shadeHeight = height * 0.25;
  
  const shade = new THREE.Mesh(
    new THREE.CylinderGeometry(shadeTopRadius, shadeBottomRadius, shadeHeight, 32, 1, true),
    shadeMat
  );
  shade.position.y = baseHeight + poleHeight + shadeHeight / 2 - 0.05;
  group.add(shade);

  // Top cap
  const topCap = new THREE.Mesh(
    new THREE.CircleGeometry(shadeTopRadius, 32),
    metalMat
  );
  topCap.rotation.x = -Math.PI / 2;
  topCap.position.y = baseHeight + poleHeight + shadeHeight - 0.05;
  group.add(topCap);

  // Light bulb glow
  const light = new THREE.PointLight(0xFFF5E6, 0.6, isFloorLamp ? 6 : 3);
  light.position.y = baseHeight + poleHeight;
  group.add(light);

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedPlant(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  
  // Pot
  const potHeight = height * 0.25;
  const potTopRadius = width * 0.35;
  const potBottomRadius = width * 0.28;
  const potMat = new THREE.MeshStandardMaterial({ 
    color: 0xB87333, 
    roughness: 0.7,
    metalness: 0.1,
  });
  
  const pot = new THREE.Mesh(
    new THREE.CylinderGeometry(potTopRadius, potBottomRadius, potHeight, 16),
    potMat
  );
  pot.position.y = potHeight / 2;
  group.add(pot);

  // Pot rim
  const rim = new THREE.Mesh(
    new THREE.TorusGeometry(potTopRadius, 0.02, 8, 24),
    potMat
  );
  rim.rotation.x = Math.PI / 2;
  rim.position.y = potHeight;
  group.add(rim);

  // Soil
  const soil = new THREE.Mesh(
    new THREE.CylinderGeometry(potTopRadius * 0.95, potTopRadius * 0.95, 0.03, 16),
    new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.95 })
  );
  soil.position.y = potHeight - 0.02;
  group.add(soil);

  // Foliage - multiple spheres for fullness
  const foliageMat = new THREE.MeshStandardMaterial({
    color: color || 0x228B22,
    roughness: 0.8,
  });

  const foliagePositions = [
    { pos: [0, height * 0.55, 0], size: width * 0.4 },
    { pos: [width * 0.15, height * 0.45, width * 0.1], size: width * 0.3 },
    { pos: [-width * 0.12, height * 0.5, -width * 0.08], size: width * 0.32 },
    { pos: [0, height * 0.7, 0], size: width * 0.25 },
    { pos: [width * 0.08, height * 0.4, -width * 0.12], size: width * 0.28 },
  ];

  foliagePositions.forEach(({ pos, size }) => {
    const foliage = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 12),
      foliageMat
    );
    foliage.position.set(pos[0], pos[1], pos[2]);
    // Squash slightly for more natural look
    foliage.scale.y = 0.9;
    group.add(foliage);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedDresser(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);
  const metalMat = createMetalMaterial(0xC0C0C0);

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(length, height * 0.95, width),
    woodMat
  );
  body.position.y = height * 0.475 + height * 0.05;
  group.add(body);

  // Top surface
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.02, height * 0.04, width * 1.02),
    woodDarkMat
  );
  top.position.y = height;
  group.add(top);

  // Drawers (4 rows)
  const drawerRows = 4;
  const drawerHeight = (height * 0.9) / drawerRows;
  const drawerInset = 0.02;

  for (let i = 0; i < drawerRows; i++) {
    // Drawer face
    const drawer = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.96, drawerHeight * 0.85, 0.02),
      woodDarkMat
    );
    drawer.position.set(
      0,
      height * 0.1 + (i + 0.5) * drawerHeight,
      width / 2 + 0.01
    );
    group.add(drawer);

    // Drawer handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.01, 0.01, length * 0.15, 8),
      metalMat
    );
    handle.rotation.z = Math.PI / 2;
    handle.position.set(
      0,
      height * 0.1 + (i + 0.5) * drawerHeight,
      width / 2 + 0.04
    );
    group.add(handle);
  }

  // Legs
  const legHeight = height * 0.05;
  const legSize = 0.06;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.BoxGeometry(legSize, legHeight, legSize),
      woodDarkMat
    );
    leg.position.set(
      x * (length / 2 - legSize),
      legHeight / 2,
      z * (width / 2 - legSize)
    );
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedTV(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const screenMat = new THREE.MeshStandardMaterial({
    color: 0x111111,
    roughness: 0.1,
    metalness: 0.5,
  });
  const frameMat = new THREE.MeshStandardMaterial({
    color: 0x1C1C1C,
    roughness: 0.3,
    metalness: 0.3,
  });

  // Screen frame
  const frameThickness = 0.03;
  const frame = new THREE.Mesh(
    new THREE.BoxGeometry(length, height * 0.6, width * 0.5),
    frameMat
  );
  frame.position.y = height * 0.5;
  group.add(frame);

  // Screen glass
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(length * 0.96, height * 0.56),
    screenMat
  );
  screen.position.set(0, height * 0.5, width * 0.26);
  group.add(screen);

  // Stand base
  const standWidth = length * 0.4;
  const standBase = new THREE.Mesh(
    new THREE.BoxGeometry(standWidth, 0.02, width * 1.5),
    frameMat
  );
  standBase.position.y = 0.01;
  group.add(standBase);

  // Stand neck
  const neckHeight = height * 0.15;
  const neck = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, neckHeight, 0.04),
    frameMat
  );
  neck.position.y = neckHeight / 2;
  group.add(neck);

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedBookshelf(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);

  // Back panel
  const backPanel = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, 0.02),
    woodMat
  );
  backPanel.position.set(0, height / 2, -width / 2 + 0.01);
  group.add(backPanel);

  // Side panels
  [-1, 1].forEach(side => {
    const sidePanel = new THREE.Mesh(
      new THREE.BoxGeometry(0.03, height, width),
      woodMat
    );
    sidePanel.position.set(side * (length / 2 - 0.015), height / 2, 0);
    group.add(sidePanel);
  });

  // Top and bottom
  [0, height].forEach((y, i) => {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(length, 0.03, width),
      woodMat
    );
    shelf.position.set(0, y + (i === 0 ? 0.015 : -0.015), 0);
    group.add(shelf);
  });

  // Interior shelves
  const shelfCount = 4;
  for (let i = 1; i < shelfCount; i++) {
    const shelf = new THREE.Mesh(
      new THREE.BoxGeometry(length - 0.06, 0.025, width - 0.02),
      woodDarkMat
    );
    shelf.position.set(0, (i / shelfCount) * height, 0.01);
    group.add(shelf);
  }

  // Some decorative books on shelves
  const bookColors = [0x8B0000, 0x00008B, 0x006400, 0x8B4513, 0x4B0082];
  for (let shelf = 1; shelf < shelfCount; shelf++) {
    const booksOnShelf = Math.floor(Math.random() * 3) + 2;
    let xPos = -length / 2 + 0.1;
    
    for (let b = 0; b < booksOnShelf; b++) {
      const bookWidth = 0.03 + Math.random() * 0.03;
      const bookHeight = (height / shelfCount) * (0.6 + Math.random() * 0.3);
      const book = new THREE.Mesh(
        new THREE.BoxGeometry(bookWidth, bookHeight, width * 0.7),
        new THREE.MeshStandardMaterial({ 
          color: bookColors[Math.floor(Math.random() * bookColors.length)],
          roughness: 0.8,
        })
      );
      book.position.set(
        xPos + bookWidth / 2,
        (shelf / shelfCount) * height + bookHeight / 2 + 0.015,
        0.05
      );
      group.add(book);
      xPos += bookWidth + 0.01;
    }
  }

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedRug(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  
  // Main rug surface
  const rugMat = new THREE.MeshStandardMaterial({
    color: color,
    roughness: 0.95,
    side: THREE.DoubleSide,
  });

  const rug = new THREE.Mesh(
    new THREE.PlaneGeometry(length, width),
    rugMat
  );
  rug.rotation.x = -Math.PI / 2;
  rug.position.y = 0.01;
  group.add(rug);

  // Border
  const borderWidth = 0.08;
  const borderMat = new THREE.MeshStandardMaterial({
    color: color * 0.7,
    roughness: 0.9,
    side: THREE.DoubleSide,
  });

  // Create border as separate strips for visual interest
  const createBorderStrip = (w: number, h: number, x: number, z: number, rotY: number = 0) => {
    const strip = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      borderMat
    );
    strip.rotation.x = -Math.PI / 2;
    strip.rotation.z = rotY;
    strip.position.set(x, 0.015, z);
    return strip;
  };

  // Top and bottom borders
  group.add(createBorderStrip(length, borderWidth, 0, width / 2 - borderWidth / 2));
  group.add(createBorderStrip(length, borderWidth, 0, -width / 2 + borderWidth / 2));
  
  // Left and right borders
  group.add(createBorderStrip(width - borderWidth * 2, borderWidth, length / 2 - borderWidth / 2, 0, Math.PI / 2));
  group.add(createBorderStrip(width - borderWidth * 2, borderWidth, -length / 2 + borderWidth / 2, 0, Math.PI / 2));

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedNightstand(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);
  const metalMat = createMetalMaterial(0xC0C0C0);

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(length, height * 0.85, width),
    woodMat
  );
  body.position.y = height * 0.425 + height * 0.08;
  group.add(body);

  // Top
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.05, height * 0.05, width * 1.05),
    woodDarkMat
  );
  top.position.y = height - height * 0.025;
  group.add(top);

  // Single drawer
  const drawer = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.9, height * 0.35, 0.02),
    woodDarkMat
  );
  drawer.position.set(0, height * 0.55, width / 2 + 0.01);
  group.add(drawer);

  // Drawer handle
  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(0.008, 0.008, length * 0.2, 8),
    metalMat
  );
  handle.rotation.z = Math.PI / 2;
  handle.position.set(0, height * 0.55, width / 2 + 0.03);
  group.add(handle);

  // Open shelf below
  const shelf = new THREE.Mesh(
    new THREE.BoxGeometry(length * 0.95, 0.02, width * 0.9),
    woodMat
  );
  shelf.position.set(0, height * 0.25, 0);
  group.add(shelf);

  // Legs
  const legHeight = height * 0.08;
  const legRadius = 0.025;
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([x, z]) => {
    const leg = new THREE.Mesh(
      new THREE.CylinderGeometry(legRadius, legRadius * 0.8, legHeight, 8),
      woodDarkMat
    );
    leg.position.set(
      x * (length / 2 - 0.05),
      legHeight / 2,
      z * (width / 2 - 0.05)
    );
    group.add(leg);
  });

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

export function createDetailedWardrobe(
  length: number,
  width: number,
  height: number,
  color: number
): THREE.Group {
  const group = new THREE.Group();
  const woodMat = createWoodMaterial(color);
  const woodDarkMat = createWoodMaterial(color, true);
  const metalMat = createMetalMaterial(0xC0C0C0);

  // Main body
  const body = new THREE.Mesh(
    new THREE.BoxGeometry(length, height * 0.95, width),
    woodMat
  );
  body.position.y = height * 0.475 + height * 0.025;
  group.add(body);

  // Top crown molding
  const crown = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.03, height * 0.04, width * 1.02),
    woodDarkMat
  );
  crown.position.y = height - 0.02;
  group.add(crown);

  // Doors (2 doors)
  const doorWidth = (length * 0.48);
  [-0.5, 0.5].forEach(side => {
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(doorWidth, height * 0.88, 0.02),
      woodDarkMat
    );
    door.position.set(side * (doorWidth + 0.02), height * 0.5, width / 2 + 0.01);
    group.add(door);

    // Door handle
    const handle = new THREE.Mesh(
      new THREE.CylinderGeometry(0.012, 0.012, height * 0.12, 8),
      metalMat
    );
    handle.position.set(
      side * (doorWidth + 0.02) + side * -doorWidth * 0.4,
      height * 0.5,
      width / 2 + 0.04
    );
    group.add(handle);
  });

  // Base
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(length * 1.01, height * 0.05, width * 1.01),
    woodDarkMat
  );
  base.position.y = height * 0.025;
  group.add(base);

  group.traverse(child => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

// Main function to create detailed procedural furniture
export function createDetailedProceduralFurniture(
  label: string,
  category: string,
  dimensions: { length: number; width: number; height: number },
  unit: number = 0.3048,
  customColor?: string
): THREE.Group {
  const length = dimensions.length * unit;
  const width = dimensions.width * unit;
  const height = dimensions.height * unit;

  // Parse color
  let baseColor = 0x808080;
  if (customColor) {
    baseColor = parseInt(customColor.replace('#', ''), 16);
  }

  const lowerLabel = label.toLowerCase();

  // Route to appropriate detailed creator
  if (lowerLabel.includes('sofa') || lowerLabel.includes('couch') || lowerLabel.includes('sectional') || lowerLabel.includes('loveseat')) {
    return createDetailedSofa(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('bed')) {
    return createDetailedBed(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('chair') || lowerLabel.includes('armchair')) {
    return createDetailedChair(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('coffee table')) {
    return createDetailedTable(length, width, height, baseColor, true);
  }
  
  if (lowerLabel.includes('table') || lowerLabel.includes('desk')) {
    return createDetailedTable(length, width, height, baseColor, false);
  }
  
  if (lowerLabel.includes('lamp')) {
    const isFloor = lowerLabel.includes('floor') || height > 1;
    return createDetailedLamp(length, width, height, baseColor, isFloor);
  }
  
  if (lowerLabel.includes('plant')) {
    return createDetailedPlant(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('dresser')) {
    return createDetailedDresser(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('nightstand') || lowerLabel.includes('side table') || lowerLabel.includes('end table')) {
    return createDetailedNightstand(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('tv') || lowerLabel.includes('television')) {
    return createDetailedTV(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('bookshelf') || lowerLabel.includes('shelf') || lowerLabel.includes('cabinet')) {
    return createDetailedBookshelf(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('wardrobe') || lowerLabel.includes('closet')) {
    return createDetailedWardrobe(length, width, height, baseColor);
  }
  
  if (lowerLabel.includes('rug') || lowerLabel.includes('carpet')) {
    return createDetailedRug(length, width, height, baseColor);
  }

  // Fallback: create a simple box with better materials
  const group = new THREE.Group();
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(length, height, width),
    new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 })
  );
  mesh.position.y = height / 2;
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  group.add(mesh);
  
  return group;
}
