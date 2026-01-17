# SpaceIdentity - AI-Powered Room Redesign Platform

Transform your living space to align with your aspirational identity. SpaceIdentity uses AI to analyze your room, understand your identity profile, and generate a photorealistic 3D redesign with shoppable product recommendations.

## Features

- **Room Input**: Upload floorplans, photos, or enter dimensions manually
- **AI Object Detection**: Automatically detect furniture in your room photos using SAM/DETR
- **Identity Assessment**: Complete a quiz to discover your aspirational identity
- **AI-Powered Design**: Get personalized room designs based on your profile
- **3D Visualization**: Interactive 3D rendering with procedural furniture models
- **Before/After Comparison**: Slide to compare your original room vs redesign
- **Shopping Integration**: Browse and purchase recommended products

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS
- **3D Rendering**: Three.js (vanilla), GLTFLoader for 3D models
- **AI**: Groq (free, ultra-fast), Llama 3.2 Vision for room analysis
- **State Management**: Zustand
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Groq API key (free, very fast)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```env
# Required: Groq API (free, ultra-fast)
# Get your key at: https://console.groq.com/keys
GROQ_API_KEY=gsk_your_key_here

# Optional: Hugging Face API (backup)
HUGGINGFACE_API_KEY=
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 3D Furniture Models

The app uses procedural 3D furniture generation by default. For even better visuals, you can add GLB models to `/public/models/`:

- `sofa.glb` - 3-seater sofa
- `chair.glb` - Accent chair  
- `table.glb` - Dining table
- `coffee_table.glb` - Coffee table
- `lamp.glb` - Floor lamp
- `bookshelf.glb` - Bookshelf
- `bed.glb` - Bed
- `plant.glb` - Indoor plant
- `rug.glb` - Area rug

**Free model sources:**
- [Quaternius](https://quaternius.com/packs.html) - Free CC0 furniture packs
- [Poly Pizza](https://poly.pizza/) - Free 3D models
- [Sketchfab](https://sketchfab.com/features/download) - Downloadable models (check license)

## Project Structure

```
/app
  /api              # API routes for AI processing
    /segment-room   # Object detection using Hugging Face DETR
    /analyze-floorplan  # Room analysis
    /generate-design    # Design generation
  /upload           # Room upload page
  /quiz             # Identity assessment page
  /design           # 3D visualization page
/components
  /ui               # shadcn/ui components
  /upload           # Upload + segmentation components
  /quiz             # Quiz components
  /room-viewer      # 3D rendering (vanilla Three.js)
  /results          # Results display components
/lib
  /types            # TypeScript type definitions
  /store            # Zustand state management
  /3d               # 3D model loading utilities
/public
  /models           # GLB furniture models
```

## Usage

1. **Upload Room**: Go to `/upload` and upload a photo of your room
2. **Object Detection**: AI automatically detects furniture in your photo
3. **Select Objects**: Choose which detected items to include in 3D
4. **Take Quiz**: Complete the identity assessment
5. **View Design**: See your redesigned room in 3D at `/design`
6. **Shop Products**: Browse recommended products

### Demo Mode

Visit `/design?demo=true` to see a demo with sample data.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `GROQ_API_KEY` | Yes | Groq API key (free, ultra-fast) - https://console.groq.com/keys |
| `HUGGINGFACE_API_KEY` | No | Hugging Face API token (backup) |
| `GEMINI_API_KEY` | No | Google Gemini API key (optional) |

## License

MIT
