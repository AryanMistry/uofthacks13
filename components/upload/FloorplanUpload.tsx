'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage, Loader2, CheckCircle } from 'lucide-react';
import { useDesignStore } from '@/lib/store/design-store';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { RoomData } from '@/lib/types/room';

export function FloorplanUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [segmenting, setSegmenting] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [segmentationComplete, setSegmentationComplete] = useState(false);
  const setRoomData = useDesignStore((state) => state.setRoomData);
  const setSegmentationResult = useSegmentationStore((state) => state.setSegmentationResult);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onload = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
      'application/pdf': ['.pdf'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false,
  });

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setAnalysisComplete(false);
    setSegmentationComplete(false);

    try {
      const formData = new FormData();
      formData.append('file', file);

      // Step 1: Analyze room dimensions and layout
      const analysisResponse = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        body: formData,
      });

      if (!analysisResponse.ok) throw new Error('Analysis failed');

      const analysisData = await analysisResponse.json();
      
      // Create room data from analysis
      const roomData: RoomData = {
        dimensions: analysisData.dimensions || {
          length: 12,
          width: 10,
          height: 9,
          unit: 'ft',
        },
        shape: analysisData.shape || { type: 'rectangle' },
        floorplanImageUrl: preview || undefined,
        doors: analysisData.doors,
        windows: analysisData.windows,
      };

      setRoomData(roomData);
      setAnalysisComplete(true);
      setUploading(false);

      // Step 2: Segment objects in the image
      setSegmenting(true);
      
      const segmentFormData = new FormData();
      segmentFormData.append('file', file);

      const segmentResponse = await fetch('/api/segment-room', {
        method: 'POST',
        body: segmentFormData,
      });

      if (segmentResponse.ok) {
        const segmentData = await segmentResponse.json();
        setSegmentationResult(segmentData);
        setSegmentationComplete(true);
      } else {
        console.warn('Segmentation failed, continuing without it');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to process image. Please try again.');
    } finally {
      setUploading(false);
      setSegmenting(false);
    }
  };

  const handleRemove = () => {
    setFile(null);
    setPreview(null);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Floorplan</CardTitle>
        <CardDescription>
          Upload a floorplan image (PNG, JPG) or PDF. Max size: 10MB
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!file ? (
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-gray-300 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Drop the file here' : 'Drag & drop your floorplan here'}
            </p>
            <p className="text-sm text-gray-500">
              or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Supports: PNG, JPG, PDF (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="relative rounded-lg overflow-hidden border">
              {preview && (
                <img
                  src={preview}
                  alt="Floorplan preview"
                  className="w-full h-auto max-h-96 object-contain"
                />
              )}
              <button
                onClick={handleRemove}
                className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <FileImage className="h-4 w-4" />
              <span>{file.name}</span>
              <span className="text-gray-400">
                ({(file.size / 1024 / 1024).toFixed(2)} MB)
              </span>
            </div>
            {/* Progress Steps */}
            {(uploading || segmenting || analysisComplete) && (
              <div className="space-y-2 p-4 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  {analysisComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={analysisComplete ? 'text-green-600' : ''}>
                    Analyzing room dimensions...
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {segmentationComplete ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : segmenting ? (
                    <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                  )}
                  <span className={segmentationComplete ? 'text-green-600' : ''}>
                    Detecting furniture & objects...
                  </span>
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={uploading || segmenting}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing Room...
                </>
              ) : segmenting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Detecting Objects...
                </>
              ) : (
                'Analyze & Detect Objects'
              )}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
