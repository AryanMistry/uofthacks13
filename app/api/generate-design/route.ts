import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { RoomData } from '@/lib/types/room';
import { IdentityProfile } from '@/lib/types/identity';
import { DesignResult, DesignLayout } from '@/lib/types/design';
import { Product } from '@/lib/types/product';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

// Mock product database (in production, this would come from a real database)
const mockProducts: Product[] = [
  {
    id: '1',
    name: 'Modern Sofa',
    description: 'Comfortable 3-seater sofa in neutral gray',
    price: 899,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=400',
    category: 'furniture',
    dimensions: { length: 7, width: 3, height: 2.5, unit: 'ft' },
    brand: 'Furniture Co',
  },
  {
    id: '2',
    name: 'Coffee Table',
    description: 'Minimalist wooden coffee table',
    price: 299,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1532372320572-cda25653a26d?w=400',
    category: 'furniture',
    dimensions: { length: 4, width: 2, height: 1.5, unit: 'ft' },
  },
  {
    id: '3',
    name: 'Floor Lamp',
    description: 'Modern arc floor lamp',
    price: 149,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=400',
    category: 'lighting',
    dimensions: { length: 1, width: 1, height: 5, unit: 'ft' },
  },
  {
    id: '4',
    name: 'Area Rug',
    description: 'Soft textured area rug',
    price: 399,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400',
    category: 'textile',
    dimensions: { length: 8, width: 6, height: 0.1, unit: 'ft' },
  },
  {
    id: '5',
    name: 'Bookshelf',
    description: 'Tall wooden bookshelf',
    price: 449,
    currency: 'USD',
    imageUrl: 'https://images.unsplash.com/photo-1594620302200-9a762244a048?w=400',
    category: 'furniture',
    dimensions: { length: 3, width: 1, height: 6, unit: 'ft' },
  },
];

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { roomData, identityProfile } = body as {
    roomData: RoomData;
    identityProfile: IdentityProfile;
  };

  try {
    // Generate design using Gemini
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = `You are an interior design AI. Design a room based on:

Room Data:
- Dimensions: ${roomData.dimensions.length} x ${roomData.dimensions.width} x ${roomData.dimensions.height} ${roomData.dimensions.unit}
- Shape: ${roomData.shape.type}
- Room Type: ${roomData.shape.type}

Identity Profile:
- Primary Traits: ${identityProfile.primaryTraits.join(', ')}
- Color Preferences: ${identityProfile.colorPreferences.join(', ')}
- Lifestyle: ${identityProfile.lifestyle}
- Work from Home: ${identityProfile.workFromHome}
- Budget: $${identityProfile.budget.min} - $${identityProfile.budget.max}

Available Products:
${mockProducts.map(p => `- ${p.name}: $${p.price} (${p.dimensions.length}x${p.dimensions.width}x${p.dimensions.height}ft)`).join('\n')}

Create a room design that:
1. Selects appropriate furniture from the available products (stay within budget)
2. Positions furniture optimally in the room
3. Chooses a color scheme matching the identity profile
4. Creates a layout that supports the user's lifestyle and traits

Return a JSON object with this structure:
{
  "furniture": [{"productId": "id", "position": {"x": number, "y": number, "z": number}, "rotation": number}],
  "lighting": [{"productId": "id", "position": {"x": number, "y": number, "z": number}, "rotation": number}],
  "decorations": [{"productId": "id", "position": {"x": number, "y": number, "z": number}, "rotation": number}],
  "colorScheme": {
    "walls": "hex color",
    "floor": "hex color",
    "ceiling": "hex color",
    "accent": "hex color"
  }
}`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const responseText = response.text();
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Failed to parse AI response');
    }

    const layoutData = JSON.parse(jsonMatch[0]);

    // Build design layout
    const furniture: Product[] = layoutData.furniture.map((item: any) => {
      const product = mockProducts.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        ...product,
        position: item.position,
      };
    }).filter(Boolean);

    const lighting: Product[] = layoutData.lighting.map((item: any) => {
      const product = mockProducts.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        ...product,
        position: item.position,
      };
    }).filter(Boolean);

    const decorations: Product[] = layoutData.decorations.map((item: any) => {
      const product = mockProducts.find(p => p.id === item.productId);
      if (!product) return null;
      return {
        ...product,
        position: item.position,
      };
    }).filter(Boolean);

    const designLayout: DesignLayout = {
      roomData,
      furniture,
      lighting,
      decorations,
      colorScheme: layoutData.colorScheme,
      layout: {
        furniture: layoutData.furniture,
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
    
    // Return a mock design if AI fails

    // Add positions to mock products based on room dimensions
    const roomUnit = roomData.dimensions.unit === 'ft' ? 1 : 3.28;
    const roomL = roomData.dimensions.length;
    const roomW = roomData.dimensions.width;

    const mockLayout: DesignLayout = {
      roomData,
      furniture: [
        { ...mockProducts[0], position: { x: -roomL/4, y: 0, z: roomW/4, rotation: 0 } }, // Sofa - back left
        { ...mockProducts[1], position: { x: -roomL/4, y: 0, z: 0, rotation: 0 } }, // Coffee table - center left
        { ...mockProducts[4], position: { x: roomL/3, y: 0, z: -roomW/3, rotation: 0 } }, // Bookshelf - front right
      ],
      lighting: [
        { ...mockProducts[2], position: { x: roomL/4, y: 0, z: roomW/4, rotation: 0 } }, // Floor lamp - back right
      ],
      decorations: [
        { ...mockProducts[3], position: { x: 0, y: 0.05, z: 0, rotation: 0 } }, // Rug - center
      ],
      colorScheme: {
        walls: '#f5f5f5',
        floor: '#d4a574',
        ceiling: '#ffffff',
        accent: '#4a90e2',
      },
      layout: {
        furniture: [
          { productId: '1', position: { x: -roomL/4, y: 0, z: roomW/4 }, rotation: 0 },
          { productId: '2', position: { x: -roomL/4, y: 0, z: 0 }, rotation: 0 },
          { productId: '5', position: { x: roomL/3, y: 0, z: -roomW/3 }, rotation: 0 },
          { productId: '3', position: { x: roomL/4, y: 0, z: roomW/4 }, rotation: 0 },
          { productId: '4', position: { x: 0, y: 0.05, z: 0 }, rotation: 0 },
        ],
      },
    };

    const mockResult: DesignResult = {
      id: `design-${Date.now()}`,
      identityProfile,
      originalRoom: roomData,
      designLayout: mockLayout,
      createdAt: new Date(),
    };

    return NextResponse.json(mockResult);
  }
}
