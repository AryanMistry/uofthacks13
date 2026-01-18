'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Product } from '@/lib/types/product';
import { RoomData } from '@/lib/types/room';
import { useSegmentationStore } from '@/lib/store/segmentation-store';

interface RoomCanvasProps {
  roomData: RoomData;
  furniture: Product[];
  showBefore?: boolean;
  onFurnitureClick?: (product: Product) => void;
  editMode?: boolean; // Enable furniture dragging
}

// Create procedural furniture models (fallback when GLB not available)
function createProceduralFurniture(
  label: string,
  category: string,
  dimensions: { length: number; width: number; height: number },
  unit: number = 0.3048,
  customColor?: string
): THREE.Group {
  const group = new THREE.Group();

  const length = dimensions.length * unit;
  const width = dimensions.width * unit;
  const height = dimensions.height * unit;

  // Extended color palette based on category
  const colorPalette: Record<string, number[]> = {
    'furniture': [0x8B6914, 0x654321, 0x4A4A4A, 0x5C4033, 0x2F4F4F, 0x3C280D, 0xD2691E],
    'lighting': [0xFFD700, 0xF0E68C, 0xFFFFE0, 0xFFF8DC, 0xB8860B, 0xDAA520],
    'textile': [0x8B4789, 0x4169E1, 0xCD5C5C, 0x9370DB, 0xDEB887, 0x6B8E23, 0x708090],
    'decoration': [0x228B22, 0x20B2AA, 0xFF69B4, 0xFFD700, 0xDEB887, 0x87CEEB],
    'storage': [0x8B4513, 0x5C4033, 0x654321, 0xD2B48C, 0x2F2F2F, 0xF5F5F5],
  };

  // Use custom color if provided, otherwise pick from palette
  let baseColor: number;
  if (customColor) {
    baseColor = parseInt(customColor.replace('#', ''), 16);
  } else {
    const palette = colorPalette[category] || [0x808080];
    const hash = label.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    baseColor = palette[hash % palette.length];
  }

  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('sofa') || lowerLabel.includes('couch')) {
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.4, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
    );
    base.position.y = height * 0.2;
    group.add(base);

    const cushions = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.95, height * 0.15, width * 0.7),
      new THREE.MeshStandardMaterial({ color: baseColor * 1.1, roughness: 0.9 })
    );
    cushions.position.set(0, height * 0.45, -width * 0.1);
    group.add(cushions);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.5, width * 0.2),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
    );
    back.position.set(0, height * 0.55, -width * 0.4);
    group.add(back);

    const armMaterial = new THREE.MeshStandardMaterial({ color: baseColor * 0.9, roughness: 0.8 });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, height * 0.4, width), armMaterial);
    leftArm.position.set(-length / 2 + width * 0.1, height * 0.4, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, height * 0.4, width), armMaterial);
    rightArm.position.set(length / 2 - width * 0.1, height * 0.4, 0);
    group.add(rightArm);

  } else if (lowerLabel.includes('chair')) {
    const seat = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.1, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 })
    );
    seat.position.y = height * 0.45;
    group.add(seat);

    const back = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.9, height * 0.45, width * 0.1),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 })
    );
    back.position.set(0, height * 0.75, -width * 0.45);
    group.add(back);

    const legGeometry = new THREE.CylinderGeometry(0.03, 0.03, height * 0.45, 8);
    const legMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.5 });
    const legPositions = [
      [-length * 0.4, -width * 0.4],
      [length * 0.4, -width * 0.4],
      [-length * 0.4, width * 0.4],
      [length * 0.4, width * 0.4],
    ];
    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, height * 0.225, z);
      group.add(leg);
    });

  } else if (lowerLabel.includes('table') || lowerLabel.includes('desk')) {
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.08, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.5 })
    );
    top.position.y = height * 0.96;
    group.add(top);

    const legGeometry = new THREE.BoxGeometry(0.08, height * 0.92, 0.08);
    const legMaterial = new THREE.MeshStandardMaterial({ color: baseColor * 0.8, roughness: 0.6 });
    const legPositions = [
      [-length * 0.45, -width * 0.45],
      [length * 0.45, -width * 0.45],
      [-length * 0.45, width * 0.45],
      [length * 0.45, width * 0.45],
    ];
    legPositions.forEach(([x, z]) => {
      const leg = new THREE.Mesh(legGeometry, legMaterial);
      leg.position.set(x, height * 0.46, z);
      group.add(leg);
    });

  } else if (lowerLabel.includes('lamp')) {
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.4, width * 0.5, height * 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8 })
    );
    base.position.y = height * 0.025;
    group.add(base);

    const pole = new THREE.Mesh(
      new THREE.CylinderGeometry(0.02, 0.02, height * 0.7, 8),
      new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.9 })
    );
    pole.position.y = height * 0.4;
    group.add(pole);

    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.3, width * 0.5, height * 0.25, 16, 1, true),
      new THREE.MeshStandardMaterial({
        color: 0xFFF8DC,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.85,
        emissive: 0xFFE4B5,
        emissiveIntensity: 0.3
      })
    );
    shade.position.y = height * 0.85;
    group.add(shade);

    const light = new THREE.PointLight(0xFFF5E6, 0.5, 5);
    light.position.y = height * 0.75;
    group.add(light);

  } else if (lowerLabel.includes('rug') || lowerLabel.includes('carpet')) {
    const rug = new THREE.Mesh(
      new THREE.PlaneGeometry(length, width),
      new THREE.MeshStandardMaterial({
        color: baseColor,
        roughness: 0.95,
        side: THREE.DoubleSide
      })
    );
    rug.rotation.x = -Math.PI / 2;
    rug.position.y = 0.01;
    group.add(rug);

  } else if (lowerLabel.includes('bed')) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.25, width),
      new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.7 })
    );
    frame.position.y = height * 0.125;
    group.add(frame);

    const mattress = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.95, height * 0.2, width * 0.9),
      new THREE.MeshStandardMaterial({ color: 0xF5F5DC, roughness: 0.9 })
    );
    mattress.position.y = height * 0.35;
    group.add(mattress);

    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.6, width * 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.7 })
    );
    headboard.position.set(0, height * 0.55, -width * 0.45);
    group.add(headboard);

    const pillowGeometry = new THREE.BoxGeometry(length * 0.35, height * 0.15, width * 0.2);
    const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
    const leftPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    leftPillow.position.set(-length * 0.25, height * 0.52, -width * 0.3);
    group.add(leftPillow);
    const rightPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    rightPillow.position.set(length * 0.25, height * 0.52, -width * 0.3);
    group.add(rightPillow);

  } else if (lowerLabel.includes('bookshelf') || lowerLabel.includes('shelf')) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, width * 0.1),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 })
    );
    frame.position.set(0, height / 2, -width * 0.45);
    group.add(frame);

    const sideMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 });
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(width * 0.1, height, width), sideMaterial);
    leftSide.position.set(-length / 2 + width * 0.05, height / 2, 0);
    group.add(leftSide);
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(width * 0.1, height, width), sideMaterial);
    rightSide.position.set(length / 2 - width * 0.05, height / 2, 0);
    group.add(rightSide);

    const shelfCount = 5;
    for (let i = 0; i <= shelfCount; i++) {
      const shelf = new THREE.Mesh(
        new THREE.BoxGeometry(length - width * 0.2, height * 0.03, width),
        new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 })
      );
      shelf.position.set(0, (i / shelfCount) * height, 0);
      group.add(shelf);
    }

  } else if (lowerLabel.includes('plant')) {
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.3, width * 0.25, height * 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    pot.position.y = height * 0.15;
    group.add(pot);

    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.28, width * 0.28, height * 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.9 })
    );
    soil.position.y = height * 0.3;
    group.add(soil);

    const foliageMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22, roughness: 0.8 });
    const foliagePositions = [
      [0, height * 0.6, 0, width * 0.4],
      [-width * 0.2, height * 0.5, width * 0.1, width * 0.25],
      [width * 0.15, height * 0.55, -width * 0.1, width * 0.3],
    ];
    foliagePositions.forEach(([x, y, z, size]) => {
      const foliage = new THREE.Mesh(new THREE.SphereGeometry(size, 8, 8), foliageMaterial);
      foliage.position.set(x, y, z);
      group.add(foliage);
    });

  } else if (lowerLabel.includes('tv') || lowerLabel.includes('television')) {
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.6, width * 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
    );
    screen.position.y = height * 0.5;
    group.add(screen);

    const glass = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.95, height * 0.55, width * 0.05),
      new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.1,
        metalness: 0.5
      })
    );
    glass.position.set(0, height * 0.5, width * 0.05);
    group.add(glass);

    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.6, height * 0.05, width),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    stand.position.y = height * 0.15;
    group.add(stand);

  } else {
    const box = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.7 })
    );
    box.position.y = height / 2;
    group.add(box);
  }

  // Enable shadows on all meshes
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });

  return group;
}

// Create selection outline for furniture
function createSelectionOutline(object: THREE.Object3D): THREE.LineSegments {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3());
  const center = box.getCenter(new THREE.Vector3());

  const geometry = new THREE.BoxGeometry(size.x + 0.1, size.y + 0.1, size.z + 0.1);
  const edges = new THREE.EdgesGeometry(geometry);
  const line = new THREE.LineSegments(
    edges,
    new THREE.LineBasicMaterial({ color: 0x00ff00, linewidth: 2 })
  );
  line.position.copy(center);
  line.position.y = center.y;
  return line;
}

export function RoomCanvas({ roomData, furniture, showBefore = false, onFurnitureClick, editMode = true }: RoomCanvasProps) {
  const segmentationResult = useSegmentationStore((state) => state.segmentationResult);
  const selectedObjects = useSegmentationStore((state) => state.selectedObjects);
  const generatedModels = useSegmentationStore((state) => state.generatedModels);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    furnitureGroup: THREE.Group;
    gltfLoader: GLTFLoader;
    raycaster: THREE.Raycaster;
    mouse: THREE.Vector2;
    floorPlane: THREE.Plane;
  } | null>(null);

  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [selectedFurniture, setSelectedFurniture] = useState<THREE.Object3D | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [hoveredFurniture, setHoveredFurniture] = useState<THREE.Object3D | null>(null);

  const selectionOutlineRef = useRef<THREE.LineSegments | null>(null);
  const dragOffsetRef = useRef(new THREE.Vector3());

  // Convert dimensions - prefer segmentation result dimensions (larger/more accurate)
  const segDims = segmentationResult?.roomDimensions;
  const baseDims = roomData.dimensions;

  const dimensions = {
    length: Math.max(segDims?.length || 0, baseDims.length),
    width: Math.max(segDims?.width || 0, baseDims.width),
    height: Math.max(segDims?.height || 0, baseDims.height),
    unit: segDims?.unit || baseDims.unit,
  };

  const unit = dimensions.unit === 'ft' ? 0.3048 : 1;
  const roomLength = dimensions.length * unit;
  const roomWidth = dimensions.width * unit;
  const roomHeight = dimensions.height * unit;

  useEffect(() => {
    setMounted(true);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!mounted || !containerRef.current) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb);
    const maxDim = Math.max(roomLength, roomWidth);
    scene.fog = new THREE.Fog(0x87ceeb, maxDim * 0.5, maxDim * 3);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    const cameraDistance = Math.max(roomLength, roomWidth) * 1.2;
    camera.position.set(cameraDistance, roomHeight * 1.3, cameraDistance);
    camera.lookAt(0, roomHeight / 4, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 1;
    controls.maxDistance = maxDim * 3;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, roomHeight / 4, 0);
    controls.update();

    // GLTF Loader
    const gltfLoader = new GLTFLoader();

    // Raycaster for object picking
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    // Floor plane for dragging
    const floorPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8B7355, 0.4);
    scene.add(hemisphereLight);

    const shadowSize = maxDim * 0.8;
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(maxDim * 0.5, roomHeight * 2, maxDim * 0.5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = maxDim * 4;
    directionalLight.shadow.camera.left = -shadowSize;
    directionalLight.shadow.camera.right = shadowSize;
    directionalLight.shadow.camera.top = shadowSize;
    directionalLight.shadow.camera.bottom = -shadowSize;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomLength, roomWidth, 20, 20);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xB8860B,
      roughness: 0.7,
      metalness: 0.05
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    floor.name = 'floor';
    scene.add(floor);

    // Walls
    const createWallMaterial = () => new THREE.MeshStandardMaterial({
      color: 0xFAF0E6,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: 1,
    });

    const backWallMat = createWallMaterial();
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), backWallMat);
    backWall.position.set(0, roomHeight / 2, -roomWidth / 2);
    backWall.receiveShadow = true;
    backWall.name = 'wall-back';
    scene.add(backWall);

    const frontWallMat = createWallMaterial();
    const frontWall = new THREE.Mesh(new THREE.PlaneGeometry(roomLength, roomHeight), frontWallMat);
    frontWall.position.set(0, roomHeight / 2, roomWidth / 2);
    frontWall.rotation.y = Math.PI;
    frontWall.receiveShadow = true;
    frontWall.name = 'wall-front';
    scene.add(frontWall);

    const leftWallMat = createWallMaterial();
    const leftWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), leftWallMat);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomLength / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    leftWall.name = 'wall-left';
    scene.add(leftWall);

    const rightWallMat = createWallMaterial();
    const rightWall = new THREE.Mesh(new THREE.PlaneGeometry(roomWidth, roomHeight), rightWallMat);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomLength / 2, roomHeight / 2, 0);
    rightWall.receiveShadow = true;
    rightWall.name = 'wall-right';
    scene.add(rightWall);

    const walls = {
      back: { mesh: backWall, mat: backWallMat },
      front: { mesh: frontWall, mat: frontWallMat },
      left: { mesh: leftWall, mat: leftWallMat },
      right: { mesh: rightWall, mat: rightWallMat },
    };

    // Baseboard
    const baseboardMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.5 });
    const baseboardHeight = 0.08;
    const backBaseboard = new THREE.Mesh(
      new THREE.BoxGeometry(roomLength, baseboardHeight, 0.02),
      baseboardMaterial
    );
    backBaseboard.position.set(0, baseboardHeight / 2, -roomWidth / 2 + 0.01);
    scene.add(backBaseboard);

    // Furniture group
    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);

    sceneRef.current = { scene, camera, renderer, controls, furnitureGroup, gltfLoader, raycaster, mouse, floorPlane };
    setSceneReady(true);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();

      // Dynamic wall visibility
      const camPos = camera.position;
      const targetOpacity = 0.15;
      const fadeSpeed = 0.1;

      const shouldShowBack = camPos.z < 0;
      const shouldShowFront = camPos.z > roomWidth;
      const shouldShowLeft = camPos.x < 0;
      const shouldShowRight = camPos.x > 0;

      const fadeWall = (wall: { mat: THREE.MeshStandardMaterial }, show: boolean) => {
        const targetOp = show ? 1 : targetOpacity;
        wall.mat.opacity += (targetOp - wall.mat.opacity) * fadeSpeed;
      };

      fadeWall(walls.back, shouldShowBack);
      fadeWall(walls.front, !shouldShowFront);
      fadeWall(walls.left, shouldShowLeft);
      fadeWall(walls.right, !shouldShowRight);

      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
      setSceneReady(false);
    };
  }, [mounted, roomLength, roomWidth, roomHeight]);

  // Mouse event handlers for dragging furniture
  useEffect(() => {
    if (!sceneRef.current || !containerRef.current || !editMode) return;

    const { scene, camera, renderer, controls, furnitureGroup, raycaster, mouse, floorPlane } = sceneRef.current;
    const container = containerRef.current;

    const getMousePosition = (event: MouseEvent | TouchEvent) => {
      const rect = container.getBoundingClientRect();
      let clientX: number, clientY: number;

      if ('touches' in event) {
        clientX = event.touches[0].clientX;
        clientY = event.touches[0].clientY;
      } else {
        clientX = event.clientX;
        clientY = event.clientY;
      }

      mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    };

    const getFurnitureAtMouse = (): THREE.Object3D | null => {
      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(furnitureGroup.children, true);

      if (intersects.length > 0) {
        // Find the root furniture group
        let obj = intersects[0].object;
        while (obj.parent && obj.parent !== furnitureGroup) {
          obj = obj.parent;
        }
        return obj.parent === furnitureGroup ? obj : null;
      }
      return null;
    };

    const getFloorIntersection = (): THREE.Vector3 | null => {
      raycaster.setFromCamera(mouse, camera);
      const target = new THREE.Vector3();
      const intersected = raycaster.ray.intersectPlane(floorPlane, target);
      return intersected ? target : null;
    };

    const onMouseDown = (event: MouseEvent | TouchEvent) => {
      event.preventDefault();
      getMousePosition(event);

      const furniture = getFurnitureAtMouse();

      if (furniture) {
        setSelectedFurniture(furniture);
        setIsDragging(true);
        controls.enabled = false; // Disable orbit controls while dragging

        // Calculate offset from furniture center to click point
        const floorPoint = getFloorIntersection();
        if (floorPoint) {
          dragOffsetRef.current.copy(furniture.position).sub(floorPoint);
        }

        // Add selection outline
        if (selectionOutlineRef.current) {
          scene.remove(selectionOutlineRef.current);
        }
        const outline = createSelectionOutline(furniture);
        outline.position.copy(furniture.position);
        scene.add(outline);
        selectionOutlineRef.current = outline;
      } else {
        // Clicked empty space - deselect
        setSelectedFurniture(null);
        if (selectionOutlineRef.current) {
          scene.remove(selectionOutlineRef.current);
          selectionOutlineRef.current = null;
        }
      }
    };

    const onMouseMove = (event: MouseEvent | TouchEvent) => {
      getMousePosition(event);

      if (isDragging && selectedFurniture) {
        const floorPoint = getFloorIntersection();
        if (floorPoint) {
          // Calculate new position with offset
          let newX = floorPoint.x + dragOffsetRef.current.x;
          let newZ = floorPoint.z + dragOffsetRef.current.z;

          // Get furniture bounds for clamping
          const box = new THREE.Box3().setFromObject(selectedFurniture);
          const size = box.getSize(new THREE.Vector3());

          // Clamp to room bounds
          const maxX = (roomLength / 2) - (size.x / 2) - 0.1;
          const maxZ = (roomWidth / 2) - (size.z / 2) - 0.1;

          newX = Math.max(-maxX, Math.min(maxX, newX));
          newZ = Math.max(-maxZ, Math.min(maxZ, newZ));

          selectedFurniture.position.x = newX;
          selectedFurniture.position.z = newZ;

          // Update selection outline
          if (selectionOutlineRef.current) {
            selectionOutlineRef.current.position.x = newX;
            selectionOutlineRef.current.position.z = newZ;
          }
        }
      } else {
        // Hover effect
        const furniture = getFurnitureAtMouse();
        if (furniture !== hoveredFurniture) {
          // Reset previous hover
          if (hoveredFurniture) {
            hoveredFurniture.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive.setHex(0x000000);
              }
            });
          }

          // Apply new hover
          if (furniture && furniture !== selectedFurniture) {
            furniture.traverse((child) => {
              if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
                child.material.emissive.setHex(0x333333);
              }
            });
          }

          setHoveredFurniture(furniture);
        }

        // Update cursor
        container.style.cursor = furniture ? 'grab' : 'default';
      }
    };

    const onMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        controls.enabled = true;
        container.style.cursor = 'default';
      }
    };

    // Add event listeners
    container.addEventListener('mousedown', onMouseDown);
    container.addEventListener('mousemove', onMouseMove);
    container.addEventListener('mouseup', onMouseUp);
    container.addEventListener('mouseleave', onMouseUp);

    // Touch support
    container.addEventListener('touchstart', onMouseDown, { passive: false });
    container.addEventListener('touchmove', onMouseMove, { passive: false });
    container.addEventListener('touchend', onMouseUp);

    return () => {
      container.removeEventListener('mousedown', onMouseDown);
      container.removeEventListener('mousemove', onMouseMove);
      container.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('mouseleave', onMouseUp);
      container.removeEventListener('touchstart', onMouseDown);
      container.removeEventListener('touchmove', onMouseMove);
      container.removeEventListener('touchend', onMouseUp);
    };
  }, [sceneReady, editMode, isDragging, selectedFurniture, hoveredFurniture, roomLength, roomWidth]);

  // Load furniture models
  const loadFurniture = useCallback(async () => {
    if (!sceneRef.current || !sceneReady) return;

    const { furnitureGroup, gltfLoader, scene } = sceneRef.current;

    // Clear existing furniture
    while (furnitureGroup.children.length > 0) {
      const child = furnitureGroup.children[0];
      furnitureGroup.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    // Clear selection
    if (selectionOutlineRef.current) {
      scene.remove(selectionOutlineRef.current);
      selectionOutlineRef.current = null;
    }
    setSelectedFurniture(null);

    if (showBefore) return;

    setLoadingModels(true);

    // Get objects to render
    let objectsToRender: {
      id: string;
      label: string;
      category: string;
      dimensions: { length: number; width: number; height: number };
      position: { x: number; y: number; z: number };
      modelUrl?: string | null;
      color?: string;
    }[] = [];

    if (generatedModels && generatedModels.length > 0) {
      console.log('Loading', generatedModels.length, 'generated models');

      generatedModels.forEach((model: any) => {
        const dims = model.dimensions || { length: 2, width: 2, height: 2 };
        const position = model.position3D ? {
          x: model.position3D.x * unit,
          y: 0,
          z: model.position3D.z * unit,
        } : { x: 0, y: 0, z: 0 };

        objectsToRender.push({
          id: model.id,
          label: model.label,
          category: model.category,
          dimensions: dims,
          position,
          modelUrl: model.modelUrl,
          color: model.detectedColor,
        });
      });
    } else if (segmentationResult && selectedObjects.length > 0) {
      const selectedSegments = segmentationResult.objects.filter(
        obj => selectedObjects.includes(obj.id)
      );

      selectedSegments.forEach((obj) => {
        const dims = obj.estimatedDimensions || { length: 2, width: 2, height: 2 };
        const position = obj.position3D ? {
          x: obj.position3D.x * unit,
          y: 0,
          z: obj.position3D.z * unit,
        } : { x: 0, y: 0, z: 0 };

        objectsToRender.push({
          id: obj.id,
          label: obj.label,
          category: obj.category,
          dimensions: dims,
          position,
          modelUrl: obj.modelUrl,
          color: obj.detectedColor,
        });
      });
    } else if (furniture.length > 0) {
      furniture.forEach((item) => {
        const pos = item.position || { x: 0, y: 0, z: 0 };
        objectsToRender.push({
          id: item.id,
          label: item.name.toLowerCase(),
          category: item.category,
          dimensions: {
            length: item.dimensions.length,
            width: item.dimensions.width,
            height: item.dimensions.height,
          },
          position: {
            x: (pos.x || 0) * unit,
            y: 0,
            z: (pos.z || 0) * unit,
          },
          modelUrl: item.modelUrl,
        });
      });
    }

    console.log('Rendering', objectsToRender.length, 'objects');

    // Load each object
    for (const obj of objectsToRender) {
      let model: THREE.Group | null = null;

      if (obj.modelUrl) {
        try {
          const gltf = await new Promise<any>((resolve, reject) => {
            gltfLoader.load(obj.modelUrl!, resolve, undefined, reject);
          });
          model = gltf.scene as THREE.Group;

          const box = new THREE.Box3().setFromObject(model);
          const modelSize = box.getSize(new THREE.Vector3());
          const targetSize = new THREE.Vector3(
            obj.dimensions.length * unit,
            obj.dimensions.height * unit,
            obj.dimensions.width * unit
          );

          const scale = Math.min(
            targetSize.x / modelSize.x,
            targetSize.y / modelSize.y,
            targetSize.z / modelSize.z
          );
          model.scale.setScalar(scale);

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
            }
          });
        } catch (error) {
          console.log(`GLB not found for ${obj.label}, using procedural model`);
          model = null;
        }
      }

      if (!model) {
        model = createProceduralFurniture(obj.label, obj.category, obj.dimensions, unit, obj.color);
      }

      // Position the model
      const objLength = obj.dimensions.length * unit;
      const objWidth = obj.dimensions.width * unit;
      const padding = 0.1;

      const maxX = (roomLength / 2) - (objLength / 2) - padding;
      const maxZ = (roomWidth / 2) - (objWidth / 2) - padding;

      let posX = 0, posY = 0, posZ = 0;

      if (obj.position) {
        posX = Math.max(-maxX, Math.min(maxX, obj.position.x));
        posY = obj.position.y;
        posZ = Math.max(-maxZ, Math.min(maxZ, obj.position.z));
      }

      model.position.set(posX, posY, posZ);
      model.userData = { id: obj.id, label: obj.label, category: obj.category, dimensions: obj.dimensions };
      furnitureGroup.add(model);
    }

    setLoadingModels(false);
  }, [sceneReady, showBefore, furniture, segmentationResult, selectedObjects, generatedModels, roomLength, roomWidth, unit]);

  // Trigger furniture loading when dependencies change
  useEffect(() => {
    loadFurniture();
  }, [loadFurniture]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gradient-to-b from-sky-200 to-sky-300 flex items-center justify-center">
        <div className="text-gray-700 font-medium">Initializing 3D view...</div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      <div
        ref={containerRef}
        className="w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* Loading overlay */}
      {loadingModels && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            Loading furniture models...
          </div>
        </div>
      )}

      {/* Edit mode indicator & controls */}
      {editMode && !showBefore && (
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end pointer-events-none">
          <div className="bg-black/70 text-white text-xs px-3 py-2 rounded-lg pointer-events-auto">
            <div className="font-medium mb-1">🎮 Edit Mode</div>
            <div className="opacity-80">Click to select • Drag to move</div>
          </div>

          {selectedFurniture && (
            <div className="bg-white/95 backdrop-blur text-sm px-4 py-2 rounded-lg shadow-lg pointer-events-auto">
              <div className="font-medium text-gray-800">
                Selected: {selectedFurniture.userData?.label || 'Furniture'}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                Position: ({selectedFurniture.position.x.toFixed(1)}, {selectedFurniture.position.z.toFixed(1)})
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
