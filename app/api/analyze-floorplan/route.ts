import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';

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

        // Convert file(s) to base64
        let imageBase64: string;
        let contentType: string;

        if (file) {
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageBase64 = buffer.toString('base64');
            contentType = file.type;
        } else {
            // Use first photo for analysis
            const firstPhoto = photos[0];
            const arrayBuffer = await firstPhoto.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            imageBase64 = buffer.toString('base64');
            contentType = firstPhoto.type;
        }

        // Analyze with Gemini Vision API
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        const prompt = `Analyze this room floorplan or photo and extract:
1. Room dimensions (length, width, height in feet or meters)
2. Room shape (rectangle, L-shape, or custom)
3. Doors and windows positions (if visible)
4. Existing furniture (if any)
5. Room type (bedroom, living-room, kitchen, office, dining-room, other)
6. Current style and color palette

Return a JSON object with this structure:
{
  "dimensions": { "length": number, "width": number, "height": number, "unit": "ft" | "meters" },
  "shape": { "type": "rectangle" | "l-shape" | "custom" },
  "doors": [{ "type": "door", "position": { "x": number, "y": number }, "width": number, "orientation": "north" | "south" | "east" | "west" }],
  "windows": [{ "type": "window", "position": { "x": number, "y": number }, "width": number, "orientation": "north" | "south" | "east" | "west" }],
  "detectedFurniture": ["item1", "item2"],
  "roomType": "bedroom" | "living-room" | "kitchen" | "office" | "dining-room" | "other",
  "style": "description",
  "colorPalette": ["color1", "color2"],
  "lighting": "bright" | "medium" | "dim"
}`;

        const result = await model.generateContent([
            {
                inlineData: {
                    data: imageBase64,
                    mimeType: contentType,
                },
            },
            { text: prompt },
        ]);

        const response = await result.response;
        const responseText = response.text();

        // Extract JSON from response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('Failed to parse AI response');
        }

        const analysis = JSON.parse(jsonMatch[0]);

        return NextResponse.json(analysis);
    } catch (error) {
        console.error('Floorplan analysis error:', error);
        return NextResponse.json(
            { error: 'Failed to analyze floorplan' },
            { status: 500 }
        );
    }
}
