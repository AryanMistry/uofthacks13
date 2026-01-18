import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini client
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;
        const photos = formData.getAll('photos') as File[];

        if (!file && photos.length === 0) {
            return NextResponse.json(
                { error: 'No file or photos provided' },
                { status: 400 }
            );
        }

        // Get the image to analyze
        let imageFile: File;
        if (file) {
            imageFile = file;
        } else {
            imageFile = photos[0];
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const imageBase64 = buffer.toString('base64');
        const contentType = imageFile.type;

        let analysis = {
            dimensions: { length: 15, width: 12, height: 9, unit: 'ft' as const },
            shape: { type: 'rectangle' as const, roomType: 'living-room' },
            doors: [] as any[],
            windows: [] as any[],
            detectedFurniture: [] as string[],
            roomType: 'living-room',
            style: 'modern',
            colorPalette: ['#FAF0E6', '#B8860B', '#8B7355'],
            lighting: 'medium' as const,
        };

        // Use Gemini's vision model
        try {
            const model = genAI.getGenerativeModel({ 
              model: 'gemini-2.0-flash-exp',
              generationConfig: { temperature: 0.3, maxOutputTokens: 1024 }
            });
            
            const imagePart = {
                inlineData: {
                    data: imageBase64,
                    mimeType: contentType,
                },
            };

            const prompt = `Analyze this room image or floorplan. Determine:
1. Room type (bedroom, living-room, kitchen, office, dining-room, bathroom)
2. Estimated dimensions in feet (length, width, height)
3. List of visible furniture items
4. Overall style (modern, traditional, minimalist, bohemian, industrial)
5. Dominant colors

Return a JSON object ONLY with this structure (no other text):
{
  "dimensions": {"length": 15, "width": 12, "height": 9},
  "roomType": "living-room",
  "furniture": ["sofa", "coffee table", "tv"],
  "style": "modern",
  "colors": ["#FAF0E6", "#8B7355", "#4A90E2"]
}`;

            const geminiResult = await model.generateContent([prompt, imagePart]);
            const response = await geminiResult.response;
            const responseText = response.text();
            console.log('Gemini analysis response:', responseText);

            // Parse JSON from response
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);

                analysis = {
                    dimensions: {
                        length: parsed.dimensions?.length || 15,
                        width: parsed.dimensions?.width || 12,
                        height: parsed.dimensions?.height || 9,
                        unit: 'ft',
                    },
                    shape: {
                        type: 'rectangle',
                        roomType: parsed.roomType || 'living-room',
                    },
                    doors: [
                        { type: 'door', position: { x: parsed.dimensions?.length / 2 || 7.5, y: 0 }, width: 3, orientation: 'south' }
                    ],
                    windows: [
                        { type: 'window', position: { x: 0, y: 4.5 }, width: 4, orientation: 'east' }
                    ],
                    detectedFurniture: parsed.furniture || [],
                    roomType: parsed.roomType || 'living-room',
                    style: parsed.style || 'modern',
                    colorPalette: parsed.colors || ['#FAF0E6', '#B8860B', '#8B7355'],
                    lighting: 'medium',
                };
            }
        } catch (groqError) {
            console.error('Groq analysis error:', groqError);
            // Use defaults
        }

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Floorplan analysis error:', error);

        // Return fallback analysis
        return NextResponse.json({
            dimensions: {
                length: 15,
                width: 12,
                height: 9,
                unit: 'ft',
            },
            shape: { type: 'rectangle', roomType: 'living-room' },
            doors: [],
            windows: [],
            detectedFurniture: [],
            roomType: 'living-room',
            style: 'modern',
            colorPalette: ['#FAF0E6', '#B8860B'],
            lighting: 'medium',
        });
    }
}
