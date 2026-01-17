'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FloorplanUpload } from '@/components/upload/FloorplanUpload';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { ManualInput } from '@/components/upload/ManualInput';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useDesignStore } from '@/lib/store/design-store';
import Link from 'next/link';

type UploadMethod = 'floorplan' | 'photos' | 'manual';

export default function UploadPage() {
  const [method, setMethod] = useState<UploadMethod>('floorplan');
  const router = useRouter();
  const roomData = useDesignStore((state) => state.roomData);

  const handleContinue = () => {
    if (roomData) {
      router.push('/quiz');
    }
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
