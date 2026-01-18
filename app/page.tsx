import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Box, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0B0F14] text-white relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

      <div className="relative z-10">
        <header className="container mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
              <Box className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold text-lg">SpaceIdentity</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-white/70">
            <Link href="#features" className="hover:text-white">Features</Link>
            <Link href="#how" className="hover:text-white">How it Works</Link>
            <Link href="#pricing" className="hover:text-white">Pricing</Link>
            <Link href="#contact" className="hover:text-white">Contact</Link>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-white/80 hover:text-white">Sign In</Button>
            <Link href="/upload">
              <Button className="bg-indigo-600 hover:bg-indigo-500">Get Started</Button>
            </Link>
          </div>
        </header>

        <main className="container mx-auto px-6 pt-16 pb-24">
          <div className="text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 mb-6">
              <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
              AI-Powered Interior Design
            </div>
            <h1 className="text-5xl md:text-6xl font-semibold tracking-tight">
              Transform Your Space with
              <span className="block text-indigo-400 mt-2">Intelligent Design</span>
            </h1>
            <p className="text-white/70 mt-6 text-lg max-w-2xl mx-auto">
              Discover your perfect room through personality-driven AI. Create a stunning 3D model of your ideal space with precision.
            </p>
            <div className="flex items-center justify-center gap-4 mt-8">
              <Link href="/upload">
                <Button size="lg" className="bg-indigo-600 hover:bg-indigo-500 px-8">Get Started</Button>
              </Link>
              <Link href="/design?demo=true">
                <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 px-8">View Demo</Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-10 text-xs text-white/50">
              <span>• 3D Rendering Engine</span>
              <span>• AI Personality Analysis</span>
              <span>• Real-time Visualization</span>
            </div>
          </div>

          <section id="features" className="mt-24 grid md:grid-cols-3 gap-6">
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                  <Brain className="w-5 h-5 text-indigo-300" />
                </div>
                <CardTitle>Personality Analysis</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/60">
                Advanced psychological profiling to understand your design preferences and lifestyle needs.
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                  <Box className="w-5 h-5 text-indigo-300" />
                </div>
                <CardTitle>3D Visualization</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/60">
                Photorealistic 3D models that bring your personalized space to life with precision.
              </CardContent>
            </Card>
            <Card className="bg-white/5 border-white/10 text-white">
              <CardHeader>
                <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center mb-3">
                  <Sparkles className="w-5 h-5 text-indigo-300" />
                </div>
                <CardTitle>AI Design Engine</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-white/60">
                Machine learning algorithms trained on thousands of professional interior designs.
              </CardContent>
            </Card>
          </section>
        </main>
      </div>
    </div>
  );
}
