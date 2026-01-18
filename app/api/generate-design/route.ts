import { NextRequest, NextResponse } from 'next/server';
import { RoomData } from '@/lib/types/room';
import { IdentityProfile, getDesignParameters } from '@/lib/types/identity';
import { getOnlineModelUrl } from '@/lib/3d/asset-library';
import { DesignResult, DesignLayout } from '@/lib/types/design';
import { Product } from '@/lib/types/product';

// Mock product database with realistic furniture
const mockProducts: Product[] = [
  {
    id: 'sofa-1',
    name: 'Modern Sofa',
    description: 'Comfortable 3-seater sofa in neutral gray',
    price: 899,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    category: 'furniture',
    dimensions: { length: 7, width: 3, height: 2.5, unit: 'ft' },
    brand: 'Furniture Co',
    modelUrl: getOnlineModelUrl('sofa') || undefined,
  },
  {
    id: 'coffee-table-1',
    name: 'Coffee Table',
    description: 'Minimalist wooden coffee table',
    price: 299,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400',
    category: 'furniture',
    dimensions: { length: 4, width: 2, height: 1.5, unit: 'ft' },
    modelUrl: getOnlineModelUrl('coffee table') || undefined,
  },
  {
    id: 'lamp-1',
    name: 'Floor Lamp',
    description: 'Modern arc floor lamp with warm lighting',
    price: 149,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'lighting',
    dimensions: { length: 1, width: 1, height: 5, unit: 'ft' },
    modelUrl: getOnlineModelUrl('lamp') || undefined,
  },
  {
    id: 'rug-1',
    name: 'Area Rug',
    description: 'Soft textured area rug in earth tones',
    price: 399,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
    category: 'textile',
    dimensions: { length: 8, width: 6, height: 0.1, unit: 'ft' },
    modelUrl: getOnlineModelUrl('rug') || undefined,
  },
  {
    id: 'bookshelf-1',
    name: 'Bookshelf',
    description: 'Tall wooden bookshelf with 5 shelves',
    price: 449,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a048?w=400',
    category: 'storage',
    dimensions: { length: 3, width: 1, height: 6, unit: 'ft' },
    modelUrl: getOnlineModelUrl('bookshelf') || undefined,
  },
  {
    id: 'chair-1',
    name: 'Accent Chair',
    description: 'Comfortable accent chair',
    price: 349,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=400',
    category: 'furniture',
    dimensions: { length: 2.5, width: 2.5, height: 3, unit: 'ft' },
    modelUrl: getOnlineModelUrl('chair') || undefined,
  },
  {
    id: 'desk-1',
    name: 'Work Desk',
    description: 'Minimalist wooden work desk',
    price: 449,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1518455027359-f3f8164ba6bd?w=400',
    category: 'furniture',
    dimensions: { length: 5, width: 2.5, height: 2.5, unit: 'ft' },
    modelUrl: getOnlineModelUrl('desk') || undefined,
  },
  {
    id: 'plant-1',
    name: 'Indoor Plant',
    description: 'Decorative indoor plant in ceramic pot',
    price: 79,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1485955900006-10f4d324d411?w=400',
    category: 'decoration',
    dimensions: { length: 1, width: 1, height: 3, unit: 'ft' },
    modelUrl: getOnlineModelUrl('plant') || undefined,
  },
  {
    id: 'bed-1',
    name: 'Queen Bed',
    description: 'Comfortable queen-size bed with headboard',
    price: 1299,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=400',
    category: 'furniture',
    dimensions: { length: 7, width: 5.5, height: 3, unit: 'ft' },
    modelUrl: getOnlineModelUrl('bed') || undefined,
  },
  {
    id: 'tv-1',
    name: 'Smart TV',
    description: '55-inch Smart TV',
    price: 599,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1593359677879-a4bb92f829d1?w=400',
    category: 'furniture',
    dimensions: { length: 4, width: 0.5, height: 2.5, unit: 'ft' },
    modelUrl: getOnlineModelUrl('tv') || undefined,
  },
];

// Room type to furniture mapping
const roomFurniture: Record<string, string[]> = {
  'living-room': ['sofa-1', 'coffee-table-1', 'lamp-1', 'rug-1', 'bookshelf-1', 'tv-1', 'plant-1'],
  'bedroom': ['bed-1', 'lamp-1', 'bookshelf-1', 'chair-1', 'rug-1', 'plant-1'],
  'office': ['desk-1', 'chair-1', 'lamp-1', 'bookshelf-1', 'plant-1'],
  'dining-room': ['coffee-table-1', 'chair-1', 'lamp-1', 'rug-1', 'plant-1'],
  'default': ['sofa-1', 'coffee-table-1', 'lamp-1', 'rug-1', 'plant-1'],
};

// Generate smart furniture layout based on room dimensions
// All positions are in FEET (matching the dimensions input)
function generateLayout(
  products: Product[],
  roomLength: number, // in feet
  roomWidth: number,  // in feet
  _roomHeight: number
): Product[] {
  const layoutProducts: Product[] = [];

  // Sort products by size (largest first for better placement)
  const sortedProducts = [...products].sort((a, b) => {
    const areaA = a.dimensions.length * a.dimensions.width;
    const areaB = b.dimensions.length * b.dimensions.width;
    return areaB - areaA;
  });

  // Define zones in the room (all in feet, centered at origin)
  // Padding from walls = 1 foot
  const padding = 1;
  const zones = {
    center: { x: 0, z: 0 },
    backWall: { x: 0, z: -(roomWidth / 2 - padding - 1.5) },  // Near back wall
    leftWall: { x: -(roomLength / 2 - padding - 1), z: 0 },   // Near left wall
    rightWall: { x: (roomLength / 2 - padding - 1), z: 0 },   // Near right wall
    frontWall: { x: 0, z: (roomWidth / 2 - padding - 1) },    // Near front wall
    frontLeft: { x: -(roomLength / 4), z: (roomWidth / 4) },
    frontRight: { x: (roomLength / 4), z: (roomWidth / 4) },
    backLeft: { x: -(roomLength / 4), z: -(roomWidth / 4) },
    backRight: { x: (roomLength / 4), z: -(roomWidth / 4) },
  };

  sortedProducts.forEach((product, index) => {
    let position = { x: 0, y: 0, z: 0 };
    let rotation = 0;
    const name = product.name.toLowerCase();
    const prodLength = product.dimensions.length;
    const prodWidth = product.dimensions.width;

    // Calculate bounds to keep furniture inside room
    const maxX = (roomLength / 2) - (prodLength / 2) - 0.5;
    const maxZ = (roomWidth / 2) - (prodWidth / 2) - 0.5;

    if (name.includes('sofa') || name.includes('couch')) {
      // Sofa against back wall, facing center
      position = { x: 0, y: 0, z: Math.max(-maxZ, zones.backWall.z) };
      rotation = 0;
    } else if (name.includes('coffee table')) {
      // Coffee table in center, in front of sofa
      position = { x: 0, y: 0, z: 0 };
    } else if (name.includes('lamp')) {
      // Lamp in back corner
      position = { 
        x: Math.min(maxX, zones.backRight.x), 
        y: 0, 
        z: Math.max(-maxZ, zones.backRight.z) 
      };
    } else if (name.includes('rug') || name.includes('carpet')) {
      // Rug in center
      position = { x: 0, y: 0, z: 0 };
    } else if (name.includes('bookshelf') || name.includes('shelf')) {
      // Bookshelf against left wall
      position = { 
        x: Math.max(-maxX, zones.leftWall.x), 
        y: 0, 
        z: 0 
      };
      rotation = Math.PI / 2;
    } else if (name.includes('chair')) {
      // Chair facing center, in front area
      position = { 
        x: Math.max(-maxX, zones.frontLeft.x), 
        y: 0, 
        z: Math.min(maxZ, zones.frontLeft.z) 
      };
      rotation = Math.PI;
    } else if (name.includes('desk')) {
      // Desk against right wall
      position = { 
        x: Math.min(maxX, zones.rightWall.x), 
        y: 0, 
        z: Math.max(-maxZ, zones.backRight.z) 
      };
      rotation = -Math.PI / 2;
    } else if (name.includes('bed')) {
      // Bed centered against back wall
      position = { x: 0, y: 0, z: Math.max(-maxZ, zones.backWall.z) };
    } else if (name.includes('tv')) {
      // TV on front wall, facing back
      position = { x: 0, y: 0, z: Math.min(maxZ, zones.frontWall.z) };
      rotation = Math.PI;
    } else if (name.includes('plant')) {
      // Plant in back left corner
      position = { 
        x: Math.max(-maxX, zones.leftWall.x), 
        y: 0, 
        z: Math.max(-maxZ, zones.backLeft.z) 
      };
    } else {
      // Default grid position (stay inside bounds)
      const gridX = (index % 3) - 1;
      const gridZ = Math.floor(index / 3) - 1;
      position = {
        x: Math.max(-maxX, Math.min(maxX, gridX * (roomLength / 5))),
        y: 0,
        z: Math.max(-maxZ, Math.min(maxZ, gridZ * (roomWidth / 5))),
      };
    }

    layoutProducts.push({
      ...product,
      position: {
        x: position.x, // Already in feet
        y: position.y,
        z: position.z,
        rotation,
      },
    });
  });

  return layoutProducts;
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { roomData, identityProfile } = body as {
    roomData: RoomData;
    identityProfile: IdentityProfile;
  };

  try {
    const { dimensions } = roomData;
    const roomLength = dimensions.length;
    const roomWidth = dimensions.width;
    const roomHeight = dimensions.height;

    // Get design parameters from identity profile
    const designParams = getDesignParameters(identityProfile);
    console.log('Design parameters from quiz:', designParams);

    // Determine room type from various sources
    let roomType = 'default';
    if (roomData.shape && 'roomType' in roomData.shape) {
      roomType = (roomData.shape as any).roomType || 'default';
    }

    // Select furniture based on room type
    let furnitureIds = roomFurniture[roomType] || roomFurniture['default'];
    
    // Adjust furniture count based on chaos level
    if (designParams.furnitureCount === 'minimal') {
      // Keep only essential items (first 3-4 items)
      furnitureIds = furnitureIds.slice(0, 4);
    } else if (designParams.furnitureCount === 'dense') {
      // Add extra decorative items
      furnitureIds = [...furnitureIds, 'plant-1', 'chair-1'];
    }
    
    // Add extra seating for hosts/extroverts
    if (designParams.seatingCapacity === 'social') {
      if (!furnitureIds.includes('chair-1')) furnitureIds.push('chair-1');
    }

    const selectedProducts = mockProducts.filter((p) => furnitureIds.includes(p.id));

    // Filter by budget if specified
    const budgetMax = identityProfile.budget.max || Infinity;
    const affordableProducts = selectedProducts.filter((p) => p.price <= budgetMax);

    // Calculate total to stay within budget
    let totalPrice = 0;
    const budgetFitProducts: Product[] = [];
    for (const product of affordableProducts) {
      if (totalPrice + product.price <= budgetMax) {
        budgetFitProducts.push(product);
        totalPrice += product.price;
      }
    }

    // Generate layout with positions
    const layoutProducts = generateLayout(
      budgetFitProducts.length > 0 ? budgetFitProducts : affordableProducts.slice(0, 5),
      roomLength,
      roomWidth,
      roomHeight
    );

    // Separate by category
    const furniture = layoutProducts.filter((p) => p.category === 'furniture' || p.category === 'storage');
    const lighting = layoutProducts.filter((p) => p.category === 'lighting');
    let decorations = layoutProducts.filter((p) => p.category === 'decoration' || p.category === 'textile');
    
    // Adjust decoration count based on chaos level
    if (designParams.decorationCount === 'minimal') {
      decorations = decorations.slice(0, 1);
    } else if (designParams.decorationCount === 'dense') {
      // Would add more decorations in a real implementation
    }

    // Generate color scheme based on identity profile and new parameters
    const colorPalette = designParams.colorPalette;
    const lightingTemp = designParams.lightingTemp;
    
    // Wall colors based on preferences
    let wallColor = '#FAF0E6'; // Default linen
    if (colorPalette === 'warm') {
      wallColor = lightingTemp === 'warm' ? '#FFF8E7' : '#FAEBD7'; // Warm cream/antique white
    } else if (colorPalette === 'cool') {
      wallColor = lightingTemp === 'cool' ? '#F0F8FF' : '#F5F5FA'; // Alice blue/lavender white
    } else if (colorPalette === 'bold') {
      wallColor = '#F5F0E8'; // Warm neutral to let bold accents pop
    }
    
    // Floor color based on material preference
    let floorColor = '#B8860B'; // Default wood
    if (designParams.primaryMaterial === 'metal' || designParams.materialStyle === 'modern') {
      floorColor = '#A0A0A0'; // Concrete gray
    } else if (designParams.materialStyle === 'vintage') {
      floorColor = '#8B4513'; // Saddle brown (darker wood)
    }
    
    // Accent color based on palette
    let accentColor = '#4A90E2'; // Default blue
    if (colorPalette === 'warm') {
      accentColor = '#E07B39'; // Burnt orange
    } else if (colorPalette === 'cool') {
      accentColor = '#4A90E2'; // Blue
    } else if (colorPalette === 'bold') {
      accentColor = '#9B59B6'; // Purple
    }
    
    const colorScheme = {
      walls: wallColor,
      floor: floorColor,
      ceiling: '#FFFFFF',
      accent: accentColor,
      lightingTemp: lightingTemp,
      hasRGBLighting: designParams.hasRGBLighting,
    };

    const designLayout: DesignLayout = {
      roomData,
      furniture,
      lighting,
      decorations,
      colorScheme,
      layout: {
        furniture: layoutProducts.map((p) => ({
          productId: p.id,
          position: p.position || { x: 0, y: 0, z: 0 },
          rotation: p.position?.rotation || 0,
        })),
      },
    };

    const designResult: DesignResult = {
      id: `design-${Date.now()}`,
      identityProfile,
      originalRoom: roomData,
      designLayout,
      createdAt: new Date(),
    };

    return NextResponse.json(designResult);
  } catch (error) {
    console.error('Design generation error:', error);

    // Fallback design
    const fallbackProducts = generateLayout(
      mockProducts.slice(0, 5),
      roomData.dimensions.length,
      roomData.dimensions.width,
      roomData.dimensions.height
    );

    const fallbackLayout: DesignLayout = {
      roomData,
      furniture: fallbackProducts.filter((p) => p.category === 'furniture'),
      lighting: fallbackProducts.filter((p) => p.category === 'lighting'),
      decorations: fallbackProducts.filter((p) => p.category === 'decoration' || p.category === 'textile'),
      colorScheme: {
        walls: '#FAF0E6',
        floor: '#B8860B',
        ceiling: '#FFFFFF',
        accent: '#4A90E2',
      },
      layout: {
        furniture: fallbackProducts.map((p) => ({
          productId: p.id,
          position: p.position || { x: 0, y: 0, z: 0 },
          rotation: p.position?.rotation || 0,
        })),
      },
    };

    const fallbackResult: DesignResult = {
      id: `design-${Date.now()}`,
      identityProfile,
      originalRoom: roomData,
      designLayout: fallbackLayout,
      createdAt: new Date(),
    };

    return NextResponse.json(fallbackResult);
  }
}
