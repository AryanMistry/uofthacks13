'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, FileImage } from 'lucide-react';
import { useDesignStore } from '@/lib/store/design-store';
import { RoomData } from '@/lib/types/room';

export function FloorplanUpload() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const setRoomData = useDesignStore((state) => state.setRoomData);

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
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      // Create room data from analysis
      const roomData: RoomData = {
        dimensions: data.dimensions || {
          length: 12,
          width: 10,
          height: 9,
          unit: 'ft',
        },
        shape: data.shape || { type: 'rectangle' },
        floorplanImageUrl: preview || undefined,
        doors: data.doors,
        windows: data.windows,
      };

      setRoomData(roomData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload floorplan. Please try again.');
    } finally {
      setUploading(false);
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
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? 'Analyzing...' : 'Analyze Floorplan'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
