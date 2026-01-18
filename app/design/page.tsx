'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDesignStore } from '@/lib/store/design-store';
import { useSegmentationStore } from '@/lib/store/segmentation-store';
import { RoomData } from '@/lib/types/room';
import { IdentityProfile } from '@/lib/types/identity';
import { BeforeAfter } from '@/components/results/BeforeAfter';
import { ReasoningPanel } from '@/components/results/ReasoningPanel';
import { ProductCard } from '@/components/results/ProductCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Product } from '@/lib/types/product';
import { DesignResult } from '@/lib/types/design';
import { Loader2, Box } from 'lucide-react';
import Link from 'next/link';
import { getDefaultRoomResult } from '@/lib/defaults/bedroom-layout';

export default function DesignPage() {
  const router = useRouter();
  const { roomData, identityProfile, designResult, setDesignResult, setRoomData, setIdentityProfile } = useDesignStore();
  const generatedModels = useSegmentationStore((state) => state.generatedModels);
  const segmentationResult = useSegmentationStore((state) => state.segmentationResult);
  const setSegmentationResult = useSegmentationStore((state) => state.setSegmentationResult);
  const setGeneratedModels = useSegmentationStore((state) => state.setGeneratedModels);
  const [loading, setLoading] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDemo, setIsDemo] = useState(false);

  useEffect(() => {
    // Check URL params for demo mode
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const isDemoMode = params.get('demo') === 'true';

      if (isDemoMode && (!roomData || !identityProfile)) {
        // Load demo data
        loadDemoData();
        setIsDemo(true);
        return;
      }
    }

    if (!roomData || !identityProfile) {
      router.push('/upload');
      return;
    }

    if (!designResult) {
      generateDesign();
    }
  }, [roomData, identityProfile, designResult]);

  // Separate effect to handle demo design generation after data is loaded
  useEffect(() => {
    if (isDemo && roomData && identityProfile && !designResult) {
      generateDesignWithData(roomData, identityProfile);
    }
  }, [isDemo, roomData, identityProfile, designResult]);

  const loadDemoData = () => {
    // Set demo room data - this is just for demo purposes
    // The actual quiz responses will override these when user goes through the quiz
    const demoRoomData = {
      dimensions: { length: 18, width: 14, height: 10, unit: 'ft' as const },
      shape: { type: 'rectangle' as const },
    };
    
    // Demo profile - shows a cool/modern aesthetic
    // Real users will have their actual quiz responses
    const demoIdentityProfile: IdentityProfile = {
      primaryTraits: ['modern', 'sophisticated'],
      secondaryTraits: [],
      colorPreferences: ['cool'],
      stylePreferences: [],
      lifestyle: 'balanced' as const,
      workFromHome: true,
      hobbies: [],
      budget: { min: 3000, max: 8000, currency: 'USD' },
      // New quiz fields for demo
      socialStyle: 'introvert',
      isHost: false,
      chaosLevel: 'minimalist',
      emptySpaceFeeling: 'calming',
      chronotype: ['night'],
      viewPreference: 'urban',
      materialPreference: 'futurist',
      techVisibility: 'hidden',
    };

    setRoomData(demoRoomData);
    setIdentityProfile(demoIdentityProfile);
    
    // Load default layout with identity-based colors
    const defaultLayout = getDefaultRoomResult('living-room', demoIdentityProfile);
    setSegmentationResult(defaultLayout);
    setGeneratedModels(defaultLayout.objects);
  };

  const generateDesignWithData = async (currentRoomData: RoomData, currentIdentityProfile: IdentityProfile) => {
    if (!currentRoomData || !currentIdentityProfile) return;

    setLoading(true);
    try {
      // If no segmentation result, load default layout with identity colors
      if (!segmentationResult) {
        const defaultLayout = getDefaultRoomResult('living-room', currentIdentityProfile);
        setSegmentationResult(defaultLayout);
        setGeneratedModels(defaultLayout.objects);
      }

      const response = await fetch('/api/generate-design', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          roomData: currentRoomData,
          identityProfile: currentIdentityProfile,
        }),
      });

      if (!response.ok) throw new Error('Failed to generate design');

      const result: DesignResult = await response.json();
      setDesignResult(result);

    } catch (error) {
      console.error('Design generation error:', error);
      alert('Failed to generate design. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateDesign = async () => {
    if (!roomData || !identityProfile) return;
    await generateDesignWithData(roomData, identityProfile);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="h-12 w-12 animate-spin text-primary" />
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">Generating Your Design</h3>
                <p className="text-sm text-muted-foreground">
                  Our AI is creating a personalized room design based on your identity profile...
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentRoomData = roomData || useDesignStore.getState().roomData;
  const currentDesignResult = designResult || useDesignStore.getState().designResult;

  if (!currentDesignResult || !currentRoomData) {
    return null;
  }

  const furniture = [
    ...currentDesignResult.designLayout.furniture,
    ...currentDesignResult.designLayout.lighting,
    ...currentDesignResult.designLayout.decorations,
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">
                {isDemo ? 'Demo: Your Redesigned Room' : 'Your Redesigned Room'}
              </h1>
              <p className="text-gray-600">
                {isDemo ? 'Explore this demo design - Upload your room to get started!' : 'Explore your new space and shop the products'}
              </p>
            </div>
            <Link href="/">
              <Button variant="outline">Start Over</Button>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main 3D View */}
          <div className="lg:col-span-2 space-y-6">
            <BeforeAfter
              roomData={currentRoomData}
              furniture={furniture}
              onFurnitureClick={setSelectedProduct}
            />

            {selectedProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Product Details</CardTitle>
                </CardHeader>
                <CardContent>
                  <ProductCard
                    product={selectedProduct}
                    onSelect={() => setSelectedProduct(null)}
                  />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Reasoning Sidebar */}
          <div className="space-y-6">
            {identityProfile && (
              <ReasoningPanel identityProfile={identityProfile} />
            )}

            <Card>
              <CardHeader>
                <CardTitle>Design Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Style</div>
                  <div className="text-lg">
                    {identityProfile?.primaryTraits.join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Color Palette</div>
                  <div className="text-lg">
                    {identityProfile?.colorPreferences.join(', ')}
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Budget</div>
                  <div className="text-lg">
                    ${identityProfile?.budget.min.toLocaleString()} - ${identityProfile?.budget.max.toLocaleString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Segmented Objects */}
            {generatedModels && generatedModels.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Box className="h-5 w-5" />
                    Detected Objects
                  </CardTitle>
                  <CardDescription>
                    Objects from your room converted to 3D
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generatedModels.map((model: any) => (
                      <div
                        key={model.id}
                        className="flex items-center justify-between p-2 bg-secondary rounded-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: model.geometry?.color || '#888' }}
                          />
                          <span className="text-sm capitalize">{model.label}</span>
                        </div>
                        <span className="text-xs text-muted-foreground capitalize">
                          {model.category}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
