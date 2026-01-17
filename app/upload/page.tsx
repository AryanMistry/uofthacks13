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
import Link from 'next/link';

type UploadMethod = 'floorplan' | 'photos' | 'manual';

export default function UploadPage() {
  const [method, setMethod] = useState<UploadMethod>('floorplan');
  const [showSegmentation, setShowSegmentation] = useState(false);
  const router = useRouter();
  const roomData = useDesignStore((state) => state.roomData);
  const segmentationResult = useSegmentationStore((state) => state.segmentationResult);
  const generatedModels = useSegmentationStore((state) => state.generatedModels);

  const handleContinue = () => {
    if (roomData) {
      router.push('/quiz');
    }
  };

  const handleSegmentationComplete = () => {
    setShowSegmentation(false);
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
        <div className="flex gap-4 mb-8 justify-center">
          <button
            onClick={() => setMethod('floorplan')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              method === 'floorplan'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Floorplan
          </button>
          <button
            onClick={() => setMethod('photos')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              method === 'photos'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Photos
          </button>
          <button
            onClick={() => setMethod('manual')}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              method === 'manual'
                ? 'bg-primary text-primary-foreground'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            Manual
          </button>
        </div>

        {/* Upload Component */}
        <div className="mb-8">
          {method === 'floorplan' && <FloorplanUpload />}
          {method === 'photos' && <PhotoUpload />}
          {method === 'manual' && <ManualInput />}
        </div>

        {/* Segmentation Preview */}
        {segmentationResult && segmentationResult.objects.length > 0 && (
          <div className="mb-8">
            <SegmentationPreview onComplete={handleSegmentationComplete} />
          </div>
        )}

        {/* Generated Models Info */}
        {generatedModels.length > 0 && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 text-green-700">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-medium">
                {generatedModels.length} 3D models generated from your room!
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
