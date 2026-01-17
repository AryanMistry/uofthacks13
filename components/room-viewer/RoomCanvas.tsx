'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { Product } from '@/lib/types/product';
import { RoomData } from '@/lib/types/room';

interface RoomCanvasProps {
  roomData: RoomData;
  furniture: Product[];
  showBefore?: boolean;
  onFurnitureClick?: (product: Product) => void;
}

export function RoomCanvas({ roomData, furniture, showBefore = false, onFurnitureClick }: RoomCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    furnitureMeshes: Map<string, THREE.Mesh>;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

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
    scene.background = new THREE.Color(0x87ceeb); // Sky blue background

    // Camera
    const camera = new THREE.PerspectiveCamera(50, width / height, 0.1, 1000);
    camera.position.set(roomLength * 1.5, roomHeight * 1.2, roomWidth * 1.5);
    camera.lookAt(0, roomHeight / 2, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    container.appendChild(renderer.domElement);

    // Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 2;
    controls.maxDistance = 30;
    controls.maxPolarAngle = Math.PI / 2;
    controls.target.set(0, roomHeight / 3, 0);
    controls.update();

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xfff5e6, 0.4);
    pointLight.position.set(0, roomHeight * 0.8, 0);
    scene.add(pointLight);

    // Floor
    const floorGeometry = new THREE.PlaneGeometry(roomLength, roomWidth);
    const floorMaterial = new THREE.MeshStandardMaterial({
      color: 0xd4a574,
      roughness: 0.8,
      metalness: 0.1
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Walls
    const wallMaterial = new THREE.MeshStandardMaterial({
      color: 0xf5f5f5,
      roughness: 0.9,
      side: THREE.DoubleSide
    });

    // Back wall
    const backWallGeometry = new THREE.PlaneGeometry(roomLength, roomHeight);
    const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
    backWall.position.set(0, roomHeight / 2, -roomWidth / 2);
    backWall.receiveShadow = true;
    scene.add(backWall);

    // Left wall
    const leftWallGeometry = new THREE.PlaneGeometry(roomWidth, roomHeight);
    const leftWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    leftWall.rotation.y = Math.PI / 2;
    leftWall.position.set(-roomLength / 2, roomHeight / 2, 0);
    leftWall.receiveShadow = true;
    scene.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(leftWallGeometry, wallMaterial);
    rightWall.rotation.y = -Math.PI / 2;
    rightWall.position.set(roomLength / 2, roomHeight / 2, 0);
    rightWall.receiveShadow = true;
    scene.add(rightWall);

    // Store furniture meshes for click detection
    const furnitureMeshes = new Map<string, THREE.Mesh>();

    sceneRef.current = { scene, camera, renderer, controls, furnitureMeshes };

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

    // Handle clicks for furniture selection
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleClick = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const meshes = Array.from(furnitureMeshes.values());
      const intersects = raycaster.intersectObjects(meshes);

      if (intersects.length > 0) {
        const clickedMesh = intersects[0].object as THREE.Mesh;
        const productId = clickedMesh.userData.productId;
        const product = furniture.find(f => f.id === productId);
        if (product && onFurnitureClick) {
          onFurnitureClick(product);
        }
      }
    };
    container.addEventListener('click', handleClick);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      container.removeEventListener('click', handleClick);
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, [mounted, roomLength, roomWidth, roomHeight]);

  // Update furniture when showBefore changes or furniture updates
  useEffect(() => {
    if (!sceneRef.current) return;

    const { scene, furnitureMeshes } = sceneRef.current;

    // Remove existing furniture
    furnitureMeshes.forEach((mesh) => {
      scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as THREE.Material).dispose();
    });
    furnitureMeshes.clear();

    // Add furniture if not showing "before" state
    if (!showBefore) {
      furniture.forEach((item, index) => {
        const itemUnit = item.dimensions.unit === 'ft' ? 0.3048 : 1;
        const itemLength = item.dimensions.length * itemUnit;
        const itemWidth = item.dimensions.width * itemUnit;
        const itemHeight = item.dimensions.height * itemUnit;

        // Create furniture mesh
        const geometry = new THREE.BoxGeometry(itemLength, itemHeight, itemWidth);

        // Different colors for different furniture types
        let color = 0x8b7355; // Default brown
        if (item.category === 'lighting') {
          color = 0xffd700; // Gold for lamps
        } else if (item.category === 'textile') {
          color = 0x9370db; // Purple for rugs
        } else if (item.category === 'decoration') {
          color = 0x20b2aa; // Teal for decorations
        }

        const material = new THREE.MeshStandardMaterial({
          color,
          roughness: 0.7,
          metalness: 0.1
        });

        const mesh = new THREE.Mesh(geometry, material);

        // Position furniture - use provided position or calculate grid position
        let x, y, z;
        if (item.position) {
          const posUnit = item.dimensions.unit === 'ft' ? 0.3048 : 1;
          x = item.position.x * posUnit;
          y = item.position.y * posUnit + itemHeight / 2;
          z = item.position.z * posUnit;
        } else {
          // Arrange furniture in a grid pattern
          const gridX = (index % 3) - 1;
          const gridZ = Math.floor(index / 3) - 0.5;
          x = gridX * (roomLength / 4);
          y = itemHeight / 2;
          z = gridZ * (roomWidth / 3);
        }

        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        mesh.userData.productId = item.id;

        scene.add(mesh);
        furnitureMeshes.set(item.id, mesh);
      });
    }
  }, [showBefore, furniture, roomLength, roomWidth, roomHeight]);

  if (!mounted) {
    return (
      <div className="w-full h-full bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading 3D view...</div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="w-full h-full"
      style={{ touchAction: 'none' }}
    />
  );
}
