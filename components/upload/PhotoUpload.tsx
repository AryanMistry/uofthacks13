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

    setUploading(true);
    
    try {
      // Step 1: Analyze room photo for dimensions (use first photo)
      setAnalysisStep('Analyzing room dimensions...');
      const analyzeFormData = new FormData();
      analyzeFormData.append('file', files[0]);

      const analyzeResponse = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        body: analyzeFormData,
      });

      let roomDimensions = { length: 15, width: 12, height: 9, unit: 'ft' as const };
      
      if (analyzeResponse.ok) {
        const analyzeData = await analyzeResponse.json();
        roomDimensions = analyzeData.dimensions || roomDimensions;
      }

      // Step 2: Segment objects in the room photo
      setAnalysisStep('Detecting furniture and objects...');
      const segmentFormData = new FormData();
      segmentFormData.append('file', files[0]);
      
      // Add floorplan if provided for better spatial reasoning
      if (floorplanFile) {
        segmentFormData.append('floorplan', floorplanFile);
        setAnalysisStep('Analyzing floorplan + photo together...');
      }

      const segmentResponse = await fetch('/api/segment-room', {
        method: 'POST',
        body: segmentFormData,
      });

      if (segmentResponse.ok) {
        const segmentData = await segmentResponse.json();
        
        // Update room dimensions from segmentation if available
        if (segmentData.roomDimensions) {
          roomDimensions = segmentData.roomDimensions;
        }
        
        // Store segmentation result
        setSegmentationResult({
          originalImageUrl: segmentData.originalImageUrl,
          objects: segmentData.objects || [],
          roomDimensions: segmentData.roomDimensions,
          wallColor: segmentData.wallColor,
          floorColor: segmentData.floorColor,
          lightingType: segmentData.lightingType,
        });
        
        setAnalysisStep(`Found ${segmentData.objects?.length || 0} objects!`);
      }
      
      // Set room data
      const roomData: RoomData = {
        dimensions: roomDimensions,
        shape: { type: 'rectangle' },
        photoUrls: previews,
        floorplanUrl: floorplanPreview || undefined,
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
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ImageIcon className="h-5 w-5" />
            Room Photos
          </CardTitle>
          <CardDescription>
            Upload 1-6 photos of your room (more angles = better analysis)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {files.length < 6 && (
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-300 hover:border-primary/50'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-medium mb-1">
                {isDragActive ? 'Drop photos here' : 'Drag & drop room photos here'}
              </p>
              <p className="text-xs text-gray-500">
                or click to browse ({files.length}/6 uploaded)
              </p>
            </div>
          )}

          {previews.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {previews.map((preview, index) => (
                <div key={index} className="relative rounded-lg overflow-hidden border group">
                  <img
                    src={preview}
                    alt={`Room photo ${index + 1}`}
                    className="w-full h-32 object-cover"
                  />
                  <button
                    onClick={() => handleRemove(index)}
                    className="absolute top-2 right-2 p-1.5 bg-white rounded-full shadow-lg hover:bg-gray-100 opacity-0 group-hover:opacity-100 transition-opacity"
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

      {/* Optional Floorplan */}
      <Card className="border-dashed">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <Map className="h-4 w-4" />
            Floorplan (Optional)
          </CardTitle>
          <CardDescription className="text-xs">
            Adding a floorplan significantly improves furniture positioning accuracy
          </CardDescription>
        </CardHeader>
        <CardContent>
          {!floorplanPreview ? (
            <div
              {...getFloorplanRootProps()}
              className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                isFloorplanDragActive
                  ? 'border-primary bg-primary/5'
                  : 'border-gray-200 hover:border-primary/30'
              }`}
            >
              <input {...getFloorplanInputProps()} />
              <p className="text-xs text-gray-500">
                Drop floorplan image or click to upload
              </p>
            </div>
          ) : (
            <div className="relative inline-block">
              <img
                src={floorplanPreview}
                alt="Floorplan"
                className="h-24 w-auto rounded border"
              />
              <button
                onClick={() => {
                  setFloorplanFile(null);
                  setFloorplanPreview(null);
                }}
                className="absolute -top-2 -right-2 p-1 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <X className="h-3 w-3" />
              </button>
              <div className="flex items-center gap-1 mt-1 text-xs text-green-600">
                <CheckCircle className="h-3 w-3" />
                Floorplan added
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analysis Status */}
      {analysisStep && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700 flex items-center gap-2">
          {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
          {analysisStep}
        </div>
      )}

      {/* Upload Button */}
      {files.length >= 1 && (
        <Button
          onClick={handleUpload}
          disabled={uploading}
          className="w-full"
          size="lg"
        >
          {uploading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Room...
            </>
          ) : (
            <>
              Analyze {files.length} Photo{files.length > 1 ? 's' : ''}
              {floorplanFile && ' + Floorplan'}
            </>
          )}
        </Button>
      )}
    </div>
  );
}
