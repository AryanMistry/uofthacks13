'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useDesignStore } from '@/lib/store/design-store';
import { RoomData } from '@/lib/types/room';

export function PhotoUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [previews, setPreviews] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const setRoomData = useDesignStore((state) => state.setRoomData);

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

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg'],
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: true,
  });

  const handleRemove = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleUpload = async () => {
    if (files.length < 4) {
      alert('Please upload at least 4 photos');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      files.forEach((file) => {
        formData.append('photos', file);
      });

      const response = await fetch('/api/analyze-floorplan', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) throw new Error('Upload failed');

      const data = await response.json();
      
      const roomData: RoomData = {
        dimensions: data.dimensions || {
          length: 12,
          width: 10,
          height: 9,
          unit: 'ft',
        },
        shape: data.shape || { type: 'rectangle' },
        photoUrls: previews,
        doors: data.doors,
        windows: data.windows,
      };

      setRoomData(roomData);
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload photos. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Upload Room Photos</CardTitle>
        <CardDescription>
          Upload 4-6 photos of your room from different angles
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
              {isDragActive ? 'Drop photos here' : 'Drag & drop photos here'}
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
              </div>
            ))}
          </div>
        )}

        {files.length >= 4 && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Analyzing...' : `Analyze ${files.length} Photos`}
          </Button>
        )}

        {files.length > 0 && files.length < 4 && (
          <p className="text-sm text-amber-600 text-center">
            Please upload at least 4 photos ({files.length}/4)
          </p>
        )}
      </CardContent>
    </Card>
  );
}
