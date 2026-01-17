import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// Singleton loader instances
let gltfLoader: GLTFLoader | null = null;
let dracoLoader: DRACOLoader | null = null;

export function getGLTFLoader(): GLTFLoader {
  if (!gltfLoader) {
    gltfLoader = new GLTFLoader();
    
    // Set up DRACO loader for compressed models
    dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
    gltfLoader.setDRACOLoader(dracoLoader);
  }
  return gltfLoader;
}

export interface LoadedModel {
  scene: THREE.Group;
  animations: THREE.AnimationClip[];
}

// Cache for loaded models
const modelCache = new Map<string, THREE.Group>();

export async function loadModel(url: string): Promise<THREE.Group> {
  // Check cache first
  if (modelCache.has(url)) {
    return modelCache.get(url)!.clone();
  }

  const loader = getGLTFLoader();
  
  return new Promise((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        // Cache the original
        modelCache.set(url, gltf.scene.clone());
        
        // Enable shadows on all meshes
        gltf.scene.traverse((child) => {
          if (child instanceof THREE.Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        
        resolve(gltf.scene);
      },
      (progress) => {
        // Loading progress
        console.log(`Loading ${url}: ${(progress.loaded / progress.total * 100).toFixed(1)}%`);
      },
      (error) => {
        console.error(`Failed to load model ${url}:`, error);
        reject(error);
      }
    );
  });
}

// Create a fallback procedural model when GLB is not available
export function createFallbackModel(
  category: string,
  dimensions: { length: number; width: number; height: number },
  color?: string
): THREE.Group {
  const group = new THREE.Group();
  
  // Convert feet to meters
  const unit = 0.3048;
  const length = dimensions.length * unit;
  const width = dimensions.width * unit;
  const height = dimensions.height * unit;
  
  // Different shapes based on category
  let geometry: THREE.BufferGeometry;
  let material: THREE.Material;
  
  // Color based on category
  const colorMap: Record<string, number> = {
    'furniture': 0x8B7355,
    'lighting': 0xFFD700,
    'textile': 0x9370DB,
    'decoration': 0x20B2AA,
    'storage': 0x8B4513,
    'unknown': 0x808080,
  };
  
  const meshColor = color ? new THREE.Color(color) : new THREE.Color(colorMap[category] || 0x808080);
  
  switch (category) {
    case 'lighting':
      // Lamp shape: cylinder base + sphere top
      const base = new THREE.Mesh(
        new THREE.CylinderGeometry(width / 4, width / 3, height * 0.1, 16),
        new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.5 })
      );
      base.position.y = height * 0.05;
      group.add(base);
      
      const pole = new THREE.Mesh(
        new THREE.CylinderGeometry(0.02, 0.02, height * 0.7, 8),
        new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.8 })
      );
      pole.position.y = height * 0.45;
      group.add(pole);
      
      const shade = new THREE.Mesh(
        new THREE.ConeGeometry(width / 2, height * 0.25, 16, 1, true),
        new THREE.MeshStandardMaterial({ 
          color: 0xFFF8DC, 
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.9
        })
      );
      shade.rotation.x = Math.PI;
      shade.position.y = height * 0.85;
      group.add(shade);
      break;
      
    case 'textile':
      // Rug: flat box with slight thickness
      geometry = new THREE.BoxGeometry(length, 0.02, width);
      material = new THREE.MeshStandardMaterial({ 
        color: meshColor,
        roughness: 0.9,
        metalness: 0
      });
      const rug = new THREE.Mesh(geometry, material);
      rug.position.y = 0.01;
      group.add(rug);
      break;
      
    case 'furniture':
    default:
      // Furniture: rounded box
      geometry = new THREE.BoxGeometry(length, height, width);
      material = new THREE.MeshStandardMaterial({ 
        color: meshColor,
        roughness: 0.7,
        metalness: 0.1
      });
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.y = height / 2;
      group.add(mesh);
      
      // Add cushion effect for sofa/chair
      if (height < 3 * unit && length > 4 * unit) {
        const cushion = new THREE.Mesh(
          new THREE.BoxGeometry(length * 0.9, height * 0.3, width * 0.8),
          new THREE.MeshStandardMaterial({ 
            color: new THREE.Color(meshColor).multiplyScalar(1.2),
            roughness: 0.8
          })
        );
        cushion.position.y = height * 0.65;
        group.add(cushion);
      }
      break;
  }
  
  // Enable shadows
  group.traverse((child) => {
    if (child instanceof THREE.Mesh) {
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  
  return group;
}

// Dispose of cached models
export function clearModelCache(): void {
  modelCache.forEach((model) => {
    model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  });
  modelCache.clear();
}
