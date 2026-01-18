'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon, Map, Loader2, CheckCircle } from 'lucide-react';
import { useDesignStore } from '@/lib/store/design-store';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { RoomData } from '@/lib/types/room';

export function PhotoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [floorplanFile, setFloorplanFile] = useState<File | null>(null);
  const [floorplanPreview, setFloorplanPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analysisStep, setAnalysisStep] = useState<string>('');
  
  const setRoomData = useDesignStore((state) => state.setRoomData);
  const setSegmentationResult = useSegmentationStore((state) => state.setSegmentationResult);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, 6);
    setFiles(newFiles);
    
    const newPreviews: string[] = [];
    newFiles.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === newFiles.length) {
          setPreviews([...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    });
  }, [files]);

  const onFloorplanDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setFloorplanFile(file);
      const reader = new FileReader();
      reader.onload = () => setFloorplanPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'] },
    maxSize: 10 * 1024 * 1024,
    multiple: true,
  });

  const { getRootProps: getFloorplanRootProps, getInputProps: getFloorplanInputProps, isDragActive: isFloorplanDragActive } = useDropzone({
    onDrop: onFloorplanDrop,
    accept: { 'image/*': ['.png', '.jpg', '.jpeg'], 'application/pdf': ['.pdf'] },
    maxSize: 10 * 1024 * 1024,
    multiple: false,
  });

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (files.length < 1) {
      alert('Please upload at least 1 photo');
      return;
    }

    if (!floorplanFile) {
      alert('Please upload a floorplan - it is required for accurate 3D layout generation');
      return;
    }

    setUploading(true);
    
    try {
      // Step 1: Analyze floorplan to generate 3D room layout
      setAnalysisStep('Analyzing floorplan for 3D layout generation...');
      const floorplanFormData = new FormData();
      floorplanFormData.append('floorplan', floorplanFile!);
      floorplanFormData.append('roomPhoto', files[0]); // Include room photo for context

      const floorplanResponse = await fetch('/api/generate-room-from-floorplan', {
        method: 'POST',
        body: floorplanFormData,
      });

      if (!floorplanResponse.ok) {
        throw new Error('Failed to analyze floorplan');
      }

      const floorplanData = await floorplanResponse.json();
      
      // 🔍 LOG OPENAI FLOORPLAN ANALYSIS RESULTS
      console.log('========================================');
      console.log('🏠 OPENAI GPT-4 VISION FLOORPLAN ANALYSIS RESULTS:');
      console.log('========================================');
      console.log('📐 Dimensions:', floorplanData.dimensions);
      console.log('🔷 Room Shape:', floorplanData.shape);
      console.log('🚪 Doors:', floorplanData.doors);
      console.log('🪟 Windows:', floorplanData.windows);
      console.log('🧭 Cardinal Orientation:', floorplanData.cardinal);
      console.log('🏷️ Room Type:', floorplanData.roomType);
      console.log('⚠️ Error (if any):', floorplanData.error);
      console.log('========================================');
      console.log('📦 Full Floorplan Data:', JSON.stringify(floorplanData, null, 2));
      console.log('========================================');
      
      setAnalysisStep('Generating 3D room geometry...');

      // Step 2: Detect furniture in room photo (optional, for reference)
      setAnalysisStep('Detecting furniture in photos...');
      const segmentFormData = new FormData();
      segmentFormData.append('file', files[0]);

      const segmentResponse = await fetch('/api/segment-room', {
        method: 'POST',
        body: segmentFormData,
      });

      let detectedObjects = [];
      if (segmentResponse.ok) {
        const segmentData = await segmentResponse.json();
        detectedObjects = segmentData.objects || [];
        setAnalysisStep(`Found ${detectedObjects.length} furniture items!`);
      }
      
      // Store the complete room layout with floorplan data
      setSegmentationResult({
        originalImageUrl: previews[0],
        objects: detectedObjects,
        roomDimensions: floorplanData.dimensions,
        wallColor: floorplanData.wallColor || '#FAF0E6',
        floorColor: floorplanData.floorColor || '#B8860B',
        lighting: 'natural',
        // Store floorplan-specific data
        roomShape: floorplanData.shape,
        doors: floorplanData.doors,
        windows: floorplanData.windows,
        cardinal: floorplanData.cardinal,
      });
      
      // Set room data with floorplan information
      const roomData: RoomData = {
        dimensions: floorplanData.dimensions,
        shape: floorplanData.shape,
        photoUrls: previews,
        floorplanImageUrl: floorplanPreview || undefined,
        doors: floorplanData.doors,
        windows: floorplanData.windows,
        cardinal: floorplanData.cardinal,
      };

      setRoomData(roomData);
      
    } catch (error) {
      console.error('Upload error:', error);
      setAnalysisStep('Analysis complete (with fallbacks)');
      
      // Set basic room data even on error
      const roomData: RoomData = {
        dimensions: { length: 15, width: 12, height: 9, unit: 'ft' },
        shape: { type: 'rectangle' },
        photoUrls: previews,
      };
      setRoomData(roomData);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Room Photos */}
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <ImageIcon className="h-5 w-5" />
            Room Photos
          </CardTitle>
          <CardDescription className="text-white/50">
            Upload 1-6 photos of your room (more angles = better analysis)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.length < 6 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-white/20 hover:border-indigo-400/60'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-white/60 mb-3" />
              <p className="text-sm font-medium mb-1 text-white">
                {isDragActive ? 'Drop photos here' : 'Drag & drop room photos here'}
              </p>
              <p className="text-xs text-white/50">
                or click to browse ({files.length}/6 uploaded)
              </p>
            </div>
          )}

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border border-white/10 group">
                  <img
                    src={preview}
                    alt={`Room photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full shadow-lg hover:bg-white opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="h-3 w-3" />
                  </button>
                  {index === 0 && (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs py-1 px-2">
                      Primary photo (used for analysis)
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Required Floorplan */}
      <Card className="bg-white/5 border-white/10 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base text-white">
            <Map className="h-4 w-4" />
            Floorplan (Required) <span className="text-red-400 text-xs ml-1">*</span>
          </CardTitle>
          <CardDescription className="text-xs text-white/50">
            Upload your floorplan for accurate 3D room generation with exact dimensions and features
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!floorplanPreview ? (
            <div
              {...getFloorplanRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isFloorplanDragActive
                  ? 'border-indigo-400 bg-indigo-500/10'
                  : 'border-white/20 hover:border-indigo-400/60'
              }`}
            >
              <input {...getFloorplanInputProps()} />
              <p className="text-xs text-white/50">
                Drop floorplan image or click to upload
              </p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={floorplanPreview}
                alt="Floorplan"
                className="h-24 w-auto rounded border border-white/20"
              />
              <button
                onClick={() => {
                  setFloorplanFile(null);
                  setFloorplanPreview(null);
                }}
                className="absolute -top-2 -right-2 p-1 bg-white/90 rounded-full shadow-lg hover:bg-white"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-1 mt-1 text-xs text-green-400">
                <CheckCircle className="h-3 w-3" />
                Floorplan added
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Status */}
      {analysisStep && (
        <div className="p-3 bg-white/10 border border-white/10 rounded-lg text-sm text-white/80 flex items-center gap-2">
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {analysisStep}
        </div>
      )}

      {/* Upload Button */}
      {files.length >= 1 && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full bg-indigo-600 hover:bg-indigo-500"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Room...
            </>
          ) : (
            <>
              Analyze Images
            </>
          )}
        </Button>
      )}
    </div>
  );
}
