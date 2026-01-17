import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          <h1 className="text-6xl font-bold tracking-tight text-gray-900">
            SpaceIdentity
          </h1>
          <p className="text-2xl text-gray-600 max-w-2xl mx-auto">
            Transform your living space to align with your aspirational identity
          </p>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Your environment shapes your identity. Let AI redesign your room to psychologically support the person you want to become.
          </p>
          
          <div className="flex gap-4 justify-center pt-4">
            <Link href="/upload">
              <Button size="lg" className="text-lg px-8 py-6">
                Get Started
              </Button>
            </Link>
            <Link href="/design?demo=true">
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                View Demo
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Analysis</CardTitle>
              <CardDescription>
                Upload your floorplan or photos and let AI understand your space
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Advanced vision AI analyzes your room dimensions, existing furniture, and layout to create the perfect redesign foundation.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Identity Assessment</CardTitle>
              <CardDescription>
                Discover your aspirational identity through our guided quiz
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Answer questions about your lifestyle, preferences, and goals to create a personalized identity profile.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>3D Visualization</CardTitle>
              <CardDescription>
                See your redesigned room in photorealistic 3D
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Interactive 3D rendering lets you explore your new space before making any purchases.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-24 max-w-4xl mx-auto">
          <h2 className="text-4xl font-bold text-center mb-12">How It Works</h2>
          <div className="space-y-8">
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                1
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Upload Your Room</h3>
                <p className="text-gray-600">
                  Upload a floorplan image or multiple photos of your room from different angles. Our AI will analyze the space and dimensions.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                2
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Complete Identity Quiz</h3>
                <p className="text-gray-600">
                  Answer questions about your lifestyle, preferences, and the person you want to become. Set your budget and style preferences.
                </p>
              </div>
            </div>
            <div className="flex gap-6 items-start">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xl">
                3
              </div>
              <div>
                <h3 className="text-2xl font-semibold mb-2">Get Your Design</h3>
                <p className="text-gray-600">
                  Receive a photorealistic 3D rendering of your redesigned room with shoppable product recommendations that fit your budget.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
