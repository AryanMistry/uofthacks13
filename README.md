# SpaceIdentity - AI-Powered Room Redesign Platform

Transform your living space to align with your aspirational identity. SpaceIdentity uses AI to analyze your room, understand your identity profile, and generate a photorealistic 3D redesign with shoppable product recommendations.

## Features

- **Room Input**: Upload floorplans, photos, or enter dimensions manually
- **Identity Assessment**: Complete a quiz to discover your aspirational identity
- **AI-Powered Design**: Get personalized room designs based on your profile
- **3D Visualization**: Interactive 3D rendering with before/after comparison
- **Shopping Integration**: Browse and purchase recommended products

## Tech Stack

- **Frontend**: Next.js 15, React 18, TypeScript, Tailwind CSS 4
- **3D Rendering**: Three.js, @react-three/fiber, @react-three/drei
- **AI**: Google Gemini API
- **State Management**: Zustand
- **Forms**: React Hook Form, Zod

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Google Gemini API key (for AI features)

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file:
```
GEMINI_API_KEY=your_api_key_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
/app
  /api              # API routes for AI processing
  /upload           # Room upload page
  /quiz             # Identity assessment page
  /design           # 3D visualization page
/components
  /ui               # shadcn/ui components
  /upload           # Upload components
  /quiz             # Quiz components
  /room-viewer      # 3D rendering components
  /results          # Results display components
/lib
  /types            # TypeScript type definitions
  /store            # Zustand state management
  /ai               # AI client utilities
  /3d               # 3D utilities
```

## Usage

1. **Upload Room**: Go to `/upload` and provide your room information
2. **Take Quiz**: Complete the identity assessment at `/quiz`
3. **View Design**: See your redesigned room in 3D at `/design`
4. **Shop Products**: Browse recommended products and add to cart

## Environment Variables

- `GEMINI_API_KEY`: Your Google Gemini API key (get it from https://aistudio.google.com/app/apikey)

## License

MIT
