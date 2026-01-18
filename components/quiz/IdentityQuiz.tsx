'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useDesignStore } from '@/lib/store/design-store';
import { IdentityProfile, IdentityTrait } from '@/lib/types/identity';
import { ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const questions = [
  // Social & Energy Dynamics
  {
    id: 'socialStyle',
    category: 'Social & Energy',
    question: 'When you need to recharge, where do you go?',
    type: 'single',
    options: [
      { 
        value: 'extrovert', 
        label: '🎉 A crowded cafe or a party with friends',
        description: 'Open-concept layouts, social seating arrangements'
      },
      { 
        value: 'introvert', 
        label: '📚 A quiet corner with a book or a solo walk',
        description: 'Cozy nooks, privacy screens, sanctuary-style layouts'
      },
    ],
  },
  {
    id: 'isHost',
    category: 'Social & Energy',
    question: 'Do you enjoy being the "host" for your friend group?',
    type: 'single',
    options: [
      { 
        value: 'true', 
        label: '🏠 Yes, I love hosting!',
        description: 'Modular seating, larger tables, open floor space'
      },
      { 
        value: 'false', 
        label: '🛋️ No, I prefer intimate spaces',
        description: 'Single high-quality seating, personal comfort focus'
      },
    ],
  },
  // The "Chaos" Scale
  {
    id: 'chaosLevel',
    category: 'Chaos Scale',
    question: 'How does your digital desktop look right now?',
    type: 'single',
    options: [
      { 
        value: 'minimalist', 
        label: '✨ Completely clear or organized into neat folders',
        description: 'Ultra-minimalism, hidden storage, clean lines'
      },
      { 
        value: 'maximalist', 
        label: '📁 Covered in files, screenshots, and active projects',
        description: 'Eclectic style, open shelving, productive clutter'
      },
    ],
  },
  {
    id: 'emptySpaceFeeling',
    category: 'Chaos Scale',
    question: 'Do you find "empty space" to be calming or boring?',
    type: 'single',
    options: [
      { 
        value: 'calming', 
        label: '🧘 Calming - I appreciate breathing room',
        description: 'High negative space, fewer decorative items'
      },
      { 
        value: 'boring', 
        label: '🌸 Boring - Fill it with personality!',
        description: 'More plants, art, accessories, and character'
      },
    ],
  },
  // Routine & Chronotype
  {
    id: 'chronotype',
    category: 'Routine & Lighting',
    question: 'When are you most productive? (Select all that apply)',
    type: 'multiple',
    options: [
      { value: 'morning', label: '🌅 Golden Hour (Sunrise/Early morning)', description: 'Warm, natural lighting' },
      { value: 'afternoon', label: '☀️ The heat of the afternoon', description: 'Bright, energetic lighting' },
      { value: 'night', label: '🌙 Deep Night (After 10 PM)', description: 'Ambient, cool-toned lighting' },
    ],
  },
  {
    id: 'viewPreference',
    category: 'Routine & Lighting',
    question: 'If you could only have one view from your window, what would it be?',
    type: 'single',
    options: [
      { 
        value: 'urban', 
        label: '🌃 A dense, neon-lit forest of skyscrapers',
        description: 'High-contrast lighting, cold tones, sleek materials'
      },
      { 
        value: 'nature', 
        label: '🌲 A foggy, quiet forest or mountain range',
        description: 'Low-contrast, warm woods, organic textures'
      },
    ],
  },
  // Tactile & Tech Preferences
  {
    id: 'materialPreference',
    category: 'Materials & Tech',
    question: 'Which of these sounds more like a "perfect" object?',
    type: 'single',
    options: [
      { 
        value: 'analog', 
        label: '⌚ A vintage mechanical watch or a leather-bound journal',
        description: 'Analog materials: brass, leather, worn wood'
      },
      { 
        value: 'futurist', 
        label: '📱 A sleek, seamless glass smartphone or a carbon-fiber bike',
        description: 'Futurist materials: brushed metal, glass, plastic'
      },
    ],
  },
  {
    id: 'techVisibility',
    category: 'Materials & Tech',
    question: 'Do you prefer "Smart" tech to be visible or invisible?',
    type: 'single',
    options: [
      { 
        value: 'visible', 
        label: '💡 Visible - Show off the RGB and smart features',
        description: 'LED accent lighting, visible tech accessories'
      },
      { 
        value: 'hidden', 
        label: '🎭 Invisible - Clean, integrated, hidden tech',
        description: 'Hidden cables, built-in charging, minimal gadgets'
      },
    ],
  },
  // Color preferences
  {
    id: 'colorPreferences',
    category: 'Color & Style',
    question: 'What color palette draws you in?',
    type: 'multiple',
    options: [
      { value: 'neutral', label: '🤍 Neutral (beiges, grays, whites)', description: 'Timeless and sophisticated' },
      { value: 'warm', label: '🧡 Warm (oranges, reds, yellows)', description: 'Cozy and inviting' },
      { value: 'cool', label: '💙 Cool (blues, greens, purples)', description: 'Calm and refreshing' },
      { value: 'bold', label: '💜 Bold (bright, vibrant colors)', description: 'Energetic and expressive' },
      { value: 'pastel', label: '🩷 Pastel (soft, muted colors)', description: 'Gentle and dreamy' },
    ],
  },
  // Budget
  {
    id: 'budget',
    category: 'Budget',
    question: 'What is your budget range for the redesign?',
    type: 'range',
  },
];

export function IdentityQuiz() {
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [budgetRange, setBudgetRange] = useState([5000]);
  const router = useRouter();
  const setIdentityProfile = useDesignStore((state) => state.setIdentityProfile);
  const roomData = useDesignStore((state) => state.roomData);

  if (!roomData) {
    router.push('/upload');
    return null;
  }

  const currentQuestion = questions[currentStep];
  const isLastStep = currentStep === questions.length - 1;

  const handleAnswer = (value: any) => {
    if (currentQuestion.type === 'multiple') {
      const currentAnswers = answers[currentQuestion.id] || [];
      const newAnswers = currentAnswers.includes(value)
        ? currentAnswers.filter((a: any) => a !== value)
        : [...currentAnswers, value];
      setAnswers({ ...answers, [currentQuestion.id]: newAnswers });
    } else {
      setAnswers({ ...answers, [currentQuestion.id]: value });
    }
  };

  const handleNext = () => {
    if (isLastStep) {
      handleSubmit();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    // Map chaos level to traits
    const traitsFromAnswers: IdentityTrait[] = [];
    if (answers.chaosLevel === 'minimalist') traitsFromAnswers.push('minimalist');
    if (answers.chaosLevel === 'maximalist') traitsFromAnswers.push('creative');
    if (answers.materialPreference === 'analog') traitsFromAnswers.push('vintage');
    if (answers.materialPreference === 'futurist') traitsFromAnswers.push('modern');
    if (answers.viewPreference === 'nature') traitsFromAnswers.push('cozy');
    if (answers.viewPreference === 'urban') traitsFromAnswers.push('sophisticated');

    const profile: IdentityProfile = {
      primaryTraits: traitsFromAnswers.slice(0, 3) as IdentityTrait[],
      secondaryTraits: [] as IdentityTrait[],
      colorPreferences: answers.colorPreferences || [],
      stylePreferences: [],
      lifestyle: answers.socialStyle === 'extrovert' ? 'active' : 'relaxed',
      workFromHome: true,
      hobbies: [],
      budget: {
        min: Math.max(500, budgetRange[0] * 0.5),
        max: budgetRange[0] * 2,
        currency: 'USD',
      },
      // New fields
      socialStyle: answers.socialStyle,
      isHost: answers.isHost === 'true',
      chaosLevel: answers.chaosLevel,
      emptySpaceFeeling: answers.emptySpaceFeeling,
      chronotype: answers.chronotype || [],
      viewPreference: answers.viewPreference,
      materialPreference: answers.materialPreference,
      techVisibility: answers.techVisibility,
    };

    setIdentityProfile(profile);
    router.push('/design');
  };

  const canProceed = () => {
    if (currentQuestion.type === 'range') {
      return budgetRange[0] > 0;
    }
    if (currentQuestion.type === 'multiple') {
      const selected = answers[currentQuestion.id] || [];
      return selected.length >= 1; // At least 1 for multiple choice
    }
    return answers[currentQuestion.id] !== undefined;
  };

  // Calculate progress percentage
  const progress = ((currentStep + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Progress header */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-white/60 text-sm mb-3">
            <span className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-xs text-white">
                {currentStep + 1}
              </span>
              {currentQuestion.category}
            </span>
            <span>{currentStep + 1} / {questions.length}</span>
          </div>
          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20 text-white">
          <CardHeader className="pb-4">
            <CardTitle className="text-2xl font-light leading-relaxed">
              {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentQuestion.type === 'range' ? (
              <div className="space-y-6 py-4">
                <div className="text-center">
                  <div className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    ${budgetRange[0].toLocaleString()}
                  </div>
                  <p className="text-white/50 text-sm">Estimated total budget</p>
                </div>
                <div className="px-4">
                  <Slider
                    value={budgetRange}
                    onValueChange={setBudgetRange}
                    min={1000}
                    max={50000}
                    step={500}
                    className="w-full"
                  />
                </div>
                <div className="flex justify-between text-xs text-white/40 px-4">
                  <span>$1,000</span>
                  <span>$50,000</span>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentQuestion.options?.map((option) => {
                  const isSelected =
                    currentQuestion.type === 'multiple'
                      ? (answers[currentQuestion.id] || []).includes(option.value)
                      : answers[currentQuestion.id] === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                        isSelected
                          ? 'border-purple-400 bg-purple-500/20 shadow-lg shadow-purple-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10'
                      }`}
                    >
                      <div className="font-medium text-lg">{option.label}</div>
                      {option.description && (
                        <div className={`text-sm mt-1 ${isSelected ? 'text-purple-200' : 'text-white/40'}`}>
                          {option.description}
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-8">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
                className="bg-transparent border-white/20 text-white hover:bg-white/10 disabled:opacity-30"
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
                className={`${
                  isLastStep 
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                    : 'bg-white/20 hover:bg-white/30'
                } text-white border-0`}
              >
                {isLastStep ? (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Generate Design
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick summary of selections */}
        {Object.keys(answers).length > 0 && (
          <div className="mt-6 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Your selections</div>
            <div className="flex flex-wrap gap-2">
              {Object.entries(answers).map(([key, value]) => {
                if (!value || (Array.isArray(value) && value.length === 0)) return null;
                const displayValue = Array.isArray(value) ? value.join(', ') : value;
                return (
                  <span 
                    key={key}
                    className="px-3 py-1 bg-purple-500/20 text-purple-200 text-xs rounded-full"
                  >
                    {displayValue}
                  </span>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
