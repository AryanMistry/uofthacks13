'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { Check, Loader2, Box, Image as ImageIcon, Layout } from 'lucide-react';

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

export function SegmentationPreview({ onComplete }: SegmentationPreviewProps) {
  const {
    segmentationResult,
    selectedObjects,
    toggleObjectSelection,
    selectAllObjects,
    deselectAllObjects,
    setGeneratedModels,
    setProcessing,
  } = useSegmentationStore();

  const [generating, setGenerating] = useState(false);
  const [generationStatus, setGenerationStatus] = useState<string>('');

  if (!segmentationResult) {
    return null;
  }

  const handleGenerate3D = async () => {
    setGenerating(true);
    setProcessing(true);
    setGenerationStatus('Running smart layout algorithm...');

    try {
      const selectedObjs = segmentationResult.objects.filter((obj) =>
        selectedObjects.includes(obj.id)
      );

      // Use the smart layout API which positions furniture intelligently
      const response = await fetch('/api/generate-3d-model', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          objects: selectedObjs,
          roomDimensions: segmentationResult.roomDimensions || {
            length: 15,
            width: 12,
            height: 9,
            unit: 'ft',
          },
        }),
      });

      if (!response.ok) throw new Error('Failed to generate layout');

      const data = await response.json();
      
      if (data.success && data.models) {
        // The API returns objects with smart 3D positions
        const modelsWithLayout = data.models.map((model: any) => ({
          id: model.id,
          label: model.label,
          category: model.category,
          dimensions: model.estimatedDimensions || { length: 2, width: 2, height: 2 },
          position3D: model.position3D, // Smart-positioned
          modelUrl: model.modelUrl || null,
          croppedImageUrl: model.croppedImageUrl,
          detectedColor: model.detectedColor,
          generationType: model.generationType || 'procedural',
        }));

        setGeneratedModels(modelsWithLayout);
        setGenerationStatus(`Layout complete! ${modelsWithLayout.length} objects positioned.`);
      }
      
      setTimeout(() => {
        onComplete();
      }, 500);
    } catch (error) {
      console.error('Error generating layout:', error);
      setGenerationStatus('Using basic positioning...');
      
      // Fallback: use objects as-is with their initial positions
      const selectedObjs = segmentationResult.objects.filter((obj) =>
        selectedObjects.includes(obj.id)
      );
      
      const fallbackModels = selectedObjs.map((obj) => ({
        id: obj.id,
        label: obj.label,
        category: obj.category,
        dimensions: obj.estimatedDimensions || { length: 2, width: 2, height: 2 },
        position3D: obj.position3D,
        modelUrl: null,
        croppedImageUrl: obj.croppedImageUrl,
        detectedColor: obj.detectedColor,
        generationType: 'procedural',
      }));
      
      setGeneratedModels(fallbackModels);
      
      setTimeout(() => {
        onComplete();
      }, 1000);
    } finally {
      setGenerating(false);
      setProcessing(false);
    }
  };

  const isSelected = (id: string) => selectedObjects.includes(id);

  // Group objects by category for better visualization
  const groupedObjects = segmentationResult.objects.reduce((acc, obj) => {
    const cat = obj.category || 'unknown';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(obj);
    return acc;
  }, {} as Record<string, typeof segmentationResult.objects>);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Box className="h-5 w-5" />
          Detected Objects
        </CardTitle>
        <CardDescription>
          Found {segmentationResult.objects.length} objects. Smart positioning will place them logically in your room.
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

        {/* Category Legend */}
        <div className="flex flex-wrap gap-3 pb-2 border-b">
          {Object.entries(groupedObjects).map(([cat, items]) => (
            <div key={cat} className="flex items-center gap-1.5 text-xs">
              <div className={`w-3 h-3 rounded-full ${categoryColors[cat]}`} />
              <span className="capitalize">{cat}</span>
              <span className="text-muted-foreground">({items.length})</span>
            </div>
          ))}
        </div>

        {/* Objects Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {segmentationResult.objects.map((obj) => (
            <button
              key={obj.id}
              onClick={() => toggleObjectSelection(obj.id)}
              className={`relative rounded-lg border-2 transition-all overflow-hidden ${
                isSelected(obj.id)
                  ? 'border-primary ring-2 ring-primary/20'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              {/* Cropped image preview */}
              {obj.croppedImageUrl ? (
                <div className="aspect-square bg-gray-100">
                  <img
                    src={obj.croppedImageUrl}
                    alt={obj.label}
                    className="w-full h-full object-contain"
                  />
                </div>
              ) : (
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-gray-400" />
                </div>
              )}
              
              {/* Selection indicator */}
              <div
                className={`absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center shadow ${
                  isSelected(obj.id) ? 'bg-primary text-white' : 'bg-white'
                }`}
              >
                {isSelected(obj.id) && <Check className="w-4 h-4" />}
              </div>

              {/* Color swatch */}
              {obj.detectedColor && (
                <div 
                  className="absolute top-2 left-2 w-5 h-5 rounded-full border-2 border-white shadow"
                  style={{ backgroundColor: obj.detectedColor }}
                  title={`Color: ${obj.detectedColor}`}
                />
              )}
              
              {/* Info overlay */}
              <div className="p-2 bg-white">
                <div className="flex items-center gap-1 mb-1">
                  <div className={`w-2 h-2 rounded-full ${categoryColors[obj.category]}`} />
                  <span className="font-medium text-sm capitalize truncate">{obj.label}</span>
                </div>
                
                {obj.estimatedDimensions && (
                  <div className="text-xs text-muted-foreground">
                    {obj.estimatedDimensions.length.toFixed(1)}×
                    {obj.estimatedDimensions.width.toFixed(1)}×
                    {obj.estimatedDimensions.height.toFixed(1)} ft
                  </div>
                )}

                {obj.material && (
                  <div className="text-xs text-muted-foreground capitalize">
                    {obj.material}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>

        {segmentationResult.objects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            No objects detected. Try a clearer photo with visible furniture.
          </div>
        )}

        {/* Room Info */}
        {segmentationResult.roomDimensions && (
          <div className="p-4 bg-secondary rounded-lg">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="font-medium flex items-center gap-2">
                  <Layout className="w-4 h-4" />
                  Room Dimensions
                </h4>
                <div className="text-sm text-muted-foreground mt-1">
                  {segmentationResult.roomDimensions.length}×
                  {segmentationResult.roomDimensions.width}×
                  {segmentationResult.roomDimensions.height} ft
                </div>
              </div>
              <div className="flex gap-4">
                {segmentationResult.wallColor && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border shadow-sm"
                      style={{ backgroundColor: segmentationResult.wallColor }}
                    />
                    <span className="text-xs">Walls</span>
                  </div>
                )}
                {segmentationResult.floorColor && (
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-6 h-6 rounded border shadow-sm"
                      style={{ backgroundColor: segmentationResult.floorColor }}
                    />
                    <span className="text-xs">Floor</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Smart Layout Info */}
            <div className="mt-3 pt-3 border-t border-gray-300/50 text-xs text-muted-foreground">
              <strong>Smart Layout:</strong> Furniture will be positioned logically — sofas against walls, 
              coffee tables in front, beds centered, with proper spacing and no overlaps.
            </div>
          </div>
        )}

        {/* Generation Status */}
        {generationStatus && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
            {generating && <Loader2 className="w-4 h-4 animate-spin" />}
            {generationStatus}
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
              Creating Smart Layout...
            </>
          ) : (
            <>
              <Layout className="w-4 h-4 mr-2" />
              Create 3D Room ({selectedObjects.length} objects)
            </>
          )}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          Tip: Add a floorplan for even more accurate furniture placement
        </p>
      </CardContent>
    </Card>
  );
}
