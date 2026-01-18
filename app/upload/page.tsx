'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloorplanUpload } from '@/components/upload/FloorplanUpload';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { ManualInput } from '@/components/upload/ManualInput';
import { SegmentationPreview } from '@/components/upload/SegmentationPreview';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesignStore } from '@/lib/store/design-store';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { getDefaultRoomLayout, RoomType } from '@/lib/defaults/bedroom-layout';
import Link from 'next/link';
import { Bed, Sofa, Upload, FileImage, PenTool } from 'lucide-react';

type UploadMethod = 'floorplan' | 'photos' | 'manual' | 'preset';

export default function UploadPage() {
  const [method, setMethod] = useState<UploadMethod>('preset');
  const router = useRouter();
  const { roomData, setRoomData } = useDesignStore();
  const { segmentationResult, generatedModels, setSegmentationResult, setGeneratedModels, selectAllObjects } = useSegmentationStore();

  const handleContinue = () => {
    if (roomData) {
      router.push('/quiz');
    }
  };

  const handleSegmentationComplete = () => {
    // Continue flow handled by segmentation preview
  };

  const loadPresetRoom = (type: RoomType) => {
    const layout = getDefaultRoomLayout(type);
    
    // Set room data
    setRoomData({
      dimensions: layout.roomDimensions!,
      shape: { type: 'rectangle' },
    });

    // Set segmentation result (so furniture shows up)
    setSegmentationResult(layout);
    
    // Auto-select all objects
    setTimeout(() => {
      selectAllObjects();
      
      // Also set generated models directly (they're already positioned)
      const models = layout.objects.map(obj => ({
        id: obj.id,
        label: obj.label,
        category: obj.category,
        dimensions: obj.estimatedDimensions || { length: 2, width: 2, height: 2 },
        position3D: obj.position3D,
        modelUrl: null,
        croppedImageUrl: obj.croppedImageUrl,
        detectedColor: obj.detectedColor,
        generationType: 'procedural' as const,
      }));
      setGeneratedModels(models);
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Upload Your Room</h1>
          <p className="text-gray-600">
            Choose how you'd like to provide your room information
          </p>
        </div>

        {/* Method Selection */}
        <div className="flex flex-wrap gap-3 mb-8 justify-center">
          <button
            onClick={() => setMethod('preset')}
            className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              method === 'preset'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Bed className="w-4 h-4" />
            Presets
          </button>
          <button
            onClick={() => setMethod('photos')}
            className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              method === 'photos'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <FileImage className="w-4 h-4" />
            Photos
          </button>
          <button
            onClick={() => setMethod('floorplan')}
            className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              method === 'floorplan'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <Upload className="w-4 h-4" />
            Floorplan
          </button>
          <button
            onClick={() => setMethod('manual')}
            className={`px-5 py-3 rounded-lg font-medium transition-all flex items-center gap-2 ${
              method === 'manual'
                ? 'bg-primary text-primary-foreground shadow-lg'
                : 'bg-white text-gray-700 hover:bg-gray-50 shadow'
            }`}
          >
            <PenTool className="w-4 h-4" />
            Manual
          </button>
        </div>

        {/* Preset Rooms */}
        {method === 'preset' && (
          <div className="mb-8">
            <Card>
              <CardHeader>
                <CardTitle>Choose a Room Preset</CardTitle>
                <CardDescription>
                  Start with a pre-designed room layout. Perfect for exploring the app or getting inspiration.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Bedroom Preset */}
                  <button
                    onClick={() => loadPresetRoom('bedroom')}
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-primary transition-all p-6 text-left bg-gradient-to-br from-indigo-50 to-purple-50 hover:from-indigo-100 hover:to-purple-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-indigo-100 rounded-lg group-hover:bg-indigo-200 transition-colors">
                        <Bed className="w-8 h-8 text-indigo-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Modern Bedroom</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Queen bed, nightstands, dresser, wardrobe, accent chair, and more.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">14×12 ft</span>
                          <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">11 items</span>
                        </div>
                      </div>
                    </div>
                  </button>

                  {/* Living Room Preset */}
                  <button
                    onClick={() => loadPresetRoom('living-room')}
                    className="group relative overflow-hidden rounded-xl border-2 border-gray-200 hover:border-primary transition-all p-6 text-left bg-gradient-to-br from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100"
                  >
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-amber-100 rounded-lg group-hover:bg-amber-200 transition-colors">
                        <Sofa className="w-8 h-8 text-amber-600" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-gray-900">Modern Living Room</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          Sectional sofa, coffee table, TV stand, armchair, bookshelf, and more.
                        </p>
                        <div className="flex flex-wrap gap-2 mt-3">
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">18×14 ft</span>
                          <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded">9 items</span>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                {roomData && segmentationResult && (
                  <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center gap-2 text-green-700">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      <span className="font-medium">
                        Room loaded! {segmentationResult.objects.length} furniture items ready.
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upload Components */}
        <div className="mb-8">
          {method === 'floorplan' && <FloorplanUpload />}
          {method === 'photos' && <PhotoUpload />}
          {method === 'manual' && <ManualInput />}
        </div>

        {/* Segmentation Preview (for photo uploads) */}
        {method === 'photos' && segmentationResult && segmentationResult.objects.length > 0 && (
          <div className="mb-8">
            <SegmentationPreview onComplete={handleSegmentationComplete} />
          </div>
        )}

        {/* Generated Models Info */}
        {generatedModels.length > 0 && method !== 'preset' && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {generatedModels.length} 3D models ready!
              </span>
            </div>
            <p className="text-sm text-green-600 mt-1">
              These will be used in your redesigned room visualization.
            </p>
          </div>
        )}

        {/* Continue Button */}
        {roomData && (
          <div className="flex justify-center gap-4">
            <Link href="/">
              <Button variant="outline">Back</Button>
            </Link>
            <Button onClick={handleContinue} size="lg">
              Continue to Identity Quiz →
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
