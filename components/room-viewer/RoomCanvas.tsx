'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { Product } from '@/lib/types/product';
import { RoomData } from '@/lib/types/room';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { SegmentedObject } from '@/lib/types/segmentation';

interface RoomCanvasProps {
  roomData: RoomData;
  furniture: Product[];
  showBefore?: boolean;
  onFurnitureClick?: (product: Product) => void;
}

// Create procedural furniture models (fallback when GLB not available)
function createProceduralFurniture(
  label: string,
  category: string,
  dimensions: { length: number; width: number; height: number },
  unit: number = 0.3048
): THREE.Group {
  const group = new THREE.Group();

  const length = dimensions.length * unit;
  const width = dimensions.width * unit;
  const height = dimensions.height * unit;

  // Color based on category
  const colorMap: Record<string, number> = {
    'furniture': 0x8B6914,
    'lighting': 0xFFD700,
    'textile': 0x8B4789,
    'decoration': 0x20B2AA,
    'storage': 0x8B4513,
  };
  const baseColor = colorMap[category] || 0x666666;

  const lowerLabel = label.toLowerCase();

  if (lowerLabel.includes('sofa') || lowerLabel.includes('couch')) {
    // Sofa: base + back + armrests
    const base = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.4, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
    );
    base.position.y = height * 0.2;
    group.add(base);

    // Cushions
    const cushions = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.95, height * 0.15, width * 0.7),
      new THREE.MeshStandardMaterial({ color: baseColor * 1.1, roughness: 0.9 })
    );
    cushions.position.set(0, height * 0.45, -width * 0.1);
    group.add(cushions);

    // Back
    const back = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.5, width * 0.2),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.8 })
    );
    back.position.set(0, height * 0.55, -width * 0.4);
    group.add(back);

    // Armrests
    const armMaterial = new THREE.MeshStandardMaterial({ color: baseColor * 0.9, roughness: 0.8 });
    const leftArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, height * 0.4, width), armMaterial);
    leftArm.position.set(-length / 2 + width * 0.1, height * 0.4, 0);
    group.add(leftArm);

    const rightArm = new THREE.Mesh(new THREE.BoxGeometry(width * 0.2, height * 0.4, width), armMaterial);
    rightArm.position.set(length / 2 - width * 0.1, height * 0.4, 0);
    group.add(rightArm);

  } else if (lowerLabel.includes('chair')) {
    // Chair: seat + back + legs
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

    // Legs
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
    // Table: top + legs
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.08, width),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.5 })
    );
    top.position.y = height * 0.96;
    group.add(top);

    // Legs
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
    // Lamp: base + pole + shade
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

    // Light source
    const light = new THREE.PointLight(0xFFF5E6, 0.5, 5);
    light.position.y = height * 0.75;
    group.add(light);

  } else if (lowerLabel.includes('rug') || lowerLabel.includes('carpet')) {
    // Rug: flat textured plane
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
    // Bed: frame + mattress + pillows
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

    // Headboard
    const headboard = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.6, width * 0.1),
      new THREE.MeshStandardMaterial({ color: 0x4A3728, roughness: 0.7 })
    );
    headboard.position.set(0, height * 0.55, -width * 0.45);
    group.add(headboard);

    // Pillows
    const pillowGeometry = new THREE.BoxGeometry(length * 0.35, height * 0.15, width * 0.2);
    const pillowMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF, roughness: 0.8 });
    const leftPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    leftPillow.position.set(-length * 0.25, height * 0.52, -width * 0.3);
    group.add(leftPillow);
    const rightPillow = new THREE.Mesh(pillowGeometry, pillowMaterial);
    rightPillow.position.set(length * 0.25, height * 0.52, -width * 0.3);
    group.add(rightPillow);

  } else if (lowerLabel.includes('bookshelf') || lowerLabel.includes('shelf')) {
    // Bookshelf: frame + shelves + books
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(length, height, width * 0.1),
      new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 })
    );
    frame.position.set(0, height / 2, -width * 0.45);
    group.add(frame);

    // Sides
    const sideMaterial = new THREE.MeshStandardMaterial({ color: baseColor, roughness: 0.6 });
    const leftSide = new THREE.Mesh(new THREE.BoxGeometry(width * 0.1, height, width), sideMaterial);
    leftSide.position.set(-length / 2 + width * 0.05, height / 2, 0);
    group.add(leftSide);
    const rightSide = new THREE.Mesh(new THREE.BoxGeometry(width * 0.1, height, width), sideMaterial);
    rightSide.position.set(length / 2 - width * 0.05, height / 2, 0);
    group.add(rightSide);

    // Shelves
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
    // Plant: pot + foliage
    const pot = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.3, width * 0.25, height * 0.3, 16),
      new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 })
    );
    pot.position.y = height * 0.15;
    group.add(pot);

    // Soil
    const soil = new THREE.Mesh(
      new THREE.CylinderGeometry(width * 0.28, width * 0.28, height * 0.05, 16),
      new THREE.MeshStandardMaterial({ color: 0x3D2817, roughness: 0.9 })
    );
    soil.position.y = height * 0.3;
    group.add(soil);

    // Foliage (simplified as spheres)
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
    // TV: screen + stand
    const screen = new THREE.Mesh(
      new THREE.BoxGeometry(length, height * 0.6, width * 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.3 })
    );
    screen.position.y = height * 0.5;
    group.add(screen);

    // Screen glass
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

    // Stand
    const stand = new THREE.Mesh(
      new THREE.BoxGeometry(length * 0.6, height * 0.05, width),
      new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.7 })
    );
    stand.position.y = height * 0.15;
    group.add(stand);

  } else {
    // Generic box fallback
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

export function RoomCanvas({ roomData, furniture, showBefore = false, onFurnitureClick }: RoomCanvasProps) {
  const segmentationResult = useSegmentationStore((state) => state.segmentationResult);
  const selectedObjects = useSegmentationStore((state) => state.selectedObjects);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    furnitureGroup: THREE.Group;
    gltfLoader: GLTFLoader;
  } | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);

  // Convert dimensions
  const { dimensions } = roomData;
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
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    scene.fog = new THREE.Fog(0x87ceeb, 15, 40);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(roomLength * 1.8, roomHeight * 1.5, roomWidth * 1.8);
    camera.lookAt(0, roomHeight / 3, 0);

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
    controls.minDistance = 2;
    controls.maxDistance = 25;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, roomHeight / 4, 0);
    controls.update();

    // GLTF Loader
    const gltfLoader = new GLTFLoader();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const hemisphereLight = new THREE.HemisphereLight(0x87ceeb, 0x8B7355, 0.4);
    scene.add(hemisphereLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(8, 15, 8);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -15;
    directionalLight.shadow.camera.right = 15;
    directionalLight.shadow.camera.top = 15;
    directionalLight.shadow.camera.bottom = -15;
    directionalLight.shadow.bias = -0.0001;
    scene.add(directionalLight);

    // Floor with wood texture simulation
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
    scene.add(floor);

    // Walls with subtle color
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xFAF0E6,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    // Back wall
    const backWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomLength, roomHeight),
      wallMaterial
    );
    backWall.position.set(0, roomHeight / 2, -roomWidth / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterial
    );
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomLength / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      new THREE.PlaneGeometry(roomWidth, roomHeight),
      wallMaterial
    );
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomLength / 2, roomHeight / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Baseboard
    const baseboardMaterial = new THREE.MeshStandardMaterial({ color: 0xF5F5F5, roughness: 0.5 });
    const baseboardHeight = 0.08;
    const baseboardGeometry = new THREE.BoxGeometry(roomLength, baseboardHeight, 0.02);

    const backBaseboard = new THREE.Mesh(baseboardGeometry, baseboardMaterial);
    backBaseboard.position.set(0, baseboardHeight / 2, -roomWidth / 2 + 0.01);
    scene.add(backBaseboard);

    // Furniture group
    const furnitureGroup = new THREE.Group();
    scene.add(furnitureGroup);

    sceneRef.current = { scene, camera, renderer, controls, furnitureGroup, gltfLoader };
    setSceneReady(true);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
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

  // Load furniture models
  const loadFurniture = useCallback(async () => {
    if (!sceneRef.current || !sceneReady) return;

    const { furnitureGroup, gltfLoader } = sceneRef.current;

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

    if (showBefore) return;

    setLoadingModels(true);

    // Get objects to render (from segmentation or default furniture)
    let objectsToRender: {
      id: string;
      label: string;
      category: string;
      dimensions: { length: number; width: number; height: number };
      position?: { x: number; y: number; z: number };
      modelUrl?: string;
    }[] = [];

    // First, add segmented objects if available (from uploaded photo)
    if (segmentationResult && selectedObjects.length > 0) {
      const selectedSegments = segmentationResult.objects.filter(
        obj => selectedObjects.includes(obj.id)
      );

      selectedSegments.forEach((obj) => {
        const dims = obj.estimatedDimensions || { length: 2, width: 2, height: 2 };

        // Use the pre-calculated 3D position from segmentation API
        // This maps the 2D image position to proper 3D room coordinates
        let position: { x: number; y: number; z: number };

        if (obj.position3D) {
          // Use the position calculated from image coordinates
          position = {
            x: obj.position3D.x * unit, // Convert feet to meters
            y: 0,
            z: obj.position3D.z * unit,
          };
        } else {
          // Fallback: map bounding box to room position
          const normalizedX = (obj.boundingBox.x / 100) - 0.5;
          const normalizedZ = (obj.boundingBox.y / 100) - 0.5;

          // Keep within room bounds with padding
          const padding = 0.3; // meters from wall
          const maxX = (roomLength / 2) - (dims.length * unit / 2) - padding;
          const maxZ = (roomWidth / 2) - (dims.width * unit / 2) - padding;

          position = {
            x: Math.max(-maxX, Math.min(maxX, normalizedX * roomLength * 0.8)),
            y: 0,
            z: Math.max(-maxZ, Math.min(maxZ, normalizedZ * roomWidth * 0.8)),
          };
        }

        objectsToRender.push({
          id: obj.id,
          label: obj.label,
          category: obj.category,
          dimensions: dims,
          position,
          modelUrl: obj.modelUrl,
        });
      });
    }

    // Add regular furniture if no segmentation
    if (objectsToRender.length === 0 && furniture.length > 0) {
      furniture.forEach((item, index) => {
        objectsToRender.push({
          id: item.id,
          label: item.name.toLowerCase(),
          category: item.category,
          dimensions: {
            length: item.dimensions.length,
            width: item.dimensions.width,
            height: item.dimensions.height,
          },
          position: item.position,
          modelUrl: item.modelUrl,
        });
      });
    }

    // Load each object
    for (const obj of objectsToRender) {
      let model: THREE.Group | null = null;

      // Try to load GLB model first
      if (obj.modelUrl) {
        try {
          const gltf = await new Promise<any>((resolve, reject) => {
            gltfLoader.load(obj.modelUrl!, resolve, undefined, reject);
          });
          model = gltf.scene as THREE.Group;

          // Scale model to match dimensions
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

          // Enable shadows
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

      // Use procedural model as fallback
      if (!model) {
        model = createProceduralFurniture(obj.label, obj.category, obj.dimensions, unit);
      }

      // Position the model - ensure it stays inside room bounds
      const objLength = obj.dimensions.length * unit;
      const objWidth = obj.dimensions.width * unit;
      const padding = 0.1; // Small gap from walls

      // Calculate max positions to keep furniture inside room
      const maxX = (roomLength / 2) - (objLength / 2) - padding;
      const maxZ = (roomWidth / 2) - (objWidth / 2) - padding;

      let posX = 0, posY = 0, posZ = 0;

      if (obj.position) {
        // Clamp position to stay within room bounds
        posX = Math.max(-maxX, Math.min(maxX, obj.position.x));
        posY = obj.position.y;
        posZ = Math.max(-maxZ, Math.min(maxZ, obj.position.z));
      }

      model.position.set(posX, posY, posZ);
      model.userData = { id: obj.id, label: obj.label, category: obj.category };
      furnitureGroup.add(model);
    }

    setLoadingModels(false);
  }, [sceneReady, showBefore, furniture, segmentationResult, selectedObjects, roomLength, roomWidth, unit]);

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
      {loadingModels && (
        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            Loading furniture models...
          </div>
        </div>
      )}
    </div>
  );
}
