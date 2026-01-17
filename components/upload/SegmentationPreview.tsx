'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { SegmentedObject } from '@/lib/types/segmentation';
import { Check, X, Loader2 } from 'lucide-react';

interface SegmentationPreviewProps {
  onComplete: () => void;
}

const categoryColors: Record<string, string> = {
  furniture: 'bg-amber-500',
  lighting: 'bg-yellow-400',
  textile: 'bg-purple-500',
  decoration: 'bg-teal-500',
  storage: 'bg-orange-600',
  unknown: 'bg-gray-500',
};

const categoryLabels: Record<string, string> = {
  furniture: 'Furniture',
  lighting: 'Lighting',
  textile: 'Textile',
  decoration: 'Decoration',
  storage: 'Storage',
  unknown: 'Other',
};

export function SegmentationPreview({ onComplete }: SegmentationPreviewProps) {
  const {
    segmentationResult,
    selectedObjects,
    toggleObjectSelection,
    selectAllObjects,
    deselectAllObjects,
    setGeneratedModels,
    setProcessing,
    isProcessing,
  } = useSegmentationStore();

  const [generating, setGenerating] = useState(false);

  if (!segmentationResult) {
    return null;
  }

  const handleGenerate3D = async () => {
    setGenerating(true);
    setProcessing(true);

    try {
      const selectedObjs = segmentationResult.objects.filter((obj) =>
        selectedObjects.includes(obj.id)
      );

      const response = await fetch('/api/generate-3d-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: selectedObjs,
          roomDimensions: segmentationResult.roomDimensions,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate 3D models');

      const data = await response.json();
      setGeneratedModels(data.models);
      onComplete();
    } catch (error) {
      console.error('Error generating 3D models:', error);
      alert('Failed to generate 3D models. Please try again.');
    } finally {
      setGenerating(false);
      setProcessing(false);
    }
  };

  const isSelected = (id: string) => selectedObjects.includes(id);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Detected Objects</CardTitle>
        <CardDescription>
          We found {segmentationResult.objects.length} objects in your room.
          Select the ones you want to include in your 3D design.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Selection Controls */}
        <div className="flex gap-2 mb-4">
          <Button variant="outline" size="sm" onClick={selectAllObjects}>
            Select All
          </Button>
          <Button variant="outline" size="sm" onClick={deselectAllObjects}>
            Deselect All
          </Button>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground self-center">
            {selectedObjects.length} of {segmentationResult.objects.length} selected
          </span>
        </div>

        {/* Objects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {segmentationResult.objects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => toggleObjectSelection(obj.id)}
              className={`relative p-3 rounded-lg border-2 transition-all text-left ${
                isSelected(obj.id)
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-gray-300 bg-white'
              }`}
            >
              {/* Selection indicator */}
              <div
                className={`absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center ${
                  isSelected(obj.id) ? 'bg-primary text-white' : 'bg-gray-200'
                }`}
              >
                {isSelected(obj.id) && <Check className="w-3 h-3" />}
              </div>

              {/* Category badge */}
              <div
                className={`inline-block px-2 py-0.5 rounded text-xs text-white mb-2 ${
                  categoryColors[obj.category]
                }`}
              >
                {categoryLabels[obj.category]}
              </div>

              {/* Object name */}
              <div className="font-medium text-sm capitalize">{obj.label}</div>

              {/* Dimensions */}
              {obj.estimatedDimensions && (
                <div className="text-xs text-muted-foreground mt-1">
                  {obj.estimatedDimensions.length}×{obj.estimatedDimensions.width}×
                  {obj.estimatedDimensions.height} {obj.estimatedDimensions.unit}
                </div>
              )}

              {/* Position */}
              <div className="text-xs text-muted-foreground">
                Position: {Math.round(obj.boundingBox.x)}%, {Math.round(obj.boundingBox.y)}%
              </div>
            </button>
          ))}
        </div>

        {segmentationResult.objects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No objects detected in the image. Try uploading a clearer photo.
          </div>
        )}

        {/* Room Dimensions */}
        {segmentationResult.roomDimensions && (
          <div className="p-4 bg-secondary rounded-lg">
            <h4 className="font-medium mb-2">Estimated Room Dimensions</h4>
            <div className="text-sm text-muted-foreground">
              {segmentationResult.roomDimensions.length}×{segmentationResult.roomDimensions.width}×
              {segmentationResult.roomDimensions.height} {segmentationResult.roomDimensions.unit}
            </div>
          </div>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGenerate3D}
          disabled={generating || selectedObjects.length === 0}
          className="w-full"
          size="lg"
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Generating 3D Models...
            </>
          ) : (
            `Generate 3D Models (${selectedObjects.length} objects)`
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
