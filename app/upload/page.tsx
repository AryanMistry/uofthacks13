'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { PhotoUpload } from '@/components/upload/PhotoUpload';
import { SegmentationPreview } from '@/components/upload/SegmentationPreview';
import { Button } from '@/components/ui/button';
import { useDesignStore } from '@/lib/store/design-store';
import { useSegmentationStore } from '@/lib/store/segmentation-store';

export default function UploadPage() {
  const router = useRouter();
  const { roomData } = useDesignStore();
  const { segmentationResult } = useSegmentationStore();

  const handleContinue = () => {
    if (roomData) {
      router.push('/quiz');
    }
  };

  const handleSegmentationComplete = () => {
    // Continue flow handled by segmentation preview
  };

  return (
    <div className="min-h-screen bg-[#0B0F14] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

      <div className="relative z-10 container mx-auto px-6 py-10 max-w-5xl">
        <div className="flex items-center justify-between text-sm text-white/60 mb-6">
          <div className="flex items-center gap-2">
            <span>Step 2 of 3</span>
            <span className="text-white/30">•</span>
            <span>Room Analysis</span>
          </div>
          <Link href="/" className="hover:text-white">Back to Home</Link>
        </div>

        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-10">
          <div className="h-full w-[55%] bg-indigo-500" />
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 mb-4">
            Room Analysis
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold">Upload Your Room Images</h1>
          <p className="text-white/60 mt-3">
            Upload photos of your current room and floor plan to help our AI understand your space.
          </p>
        </div>

        <div className="space-y-8">
          <PhotoUpload />
        </div>

        {segmentationResult && segmentationResult.objects.length > 0 && (
          <div className="mt-8">
            <SegmentationPreview onComplete={handleSegmentationComplete} />
          </div>
        )}

        <div className="flex items-center justify-between mt-10">
          <Button variant="ghost" className="text-white/70" onClick={() => router.back()}>
            ← Back
          </Button>
          <Button
            onClick={handleContinue}
            disabled={!roomData}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            Continue →
          </Button>
        </div>
      </div>
    </div>
  );
}
