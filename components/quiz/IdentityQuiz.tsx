'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { useDesignStore } from '@/lib/store/design-store';
import { IdentityProfile, IdentityTrait, LifestyleActivity } from '@/lib/types/identity';
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
  // Lifestyle Activities
  {
    id: 'activities',
    category: 'Your Lifestyle',
    question: 'What activities do you enjoy at home? (Select all that apply)',
    type: 'multiple',
    options: [
      { value: 'reading', label: '📖 Reading', description: 'Cozy reading nook, bookshelf, good lighting' },
      { value: 'gaming', label: '🎮 Gaming', description: 'Gaming setup, ergonomic chair, monitor stand' },
      { value: 'fitness', label: '💪 Fitness/Exercise', description: 'Space for yoga mat, dumbbells, exercise equipment' },
      { value: 'music', label: '🎸 Playing Music', description: 'Instrument stands, acoustic considerations' },
      { value: 'art', label: '🎨 Art/Crafts', description: 'Art desk, storage, good natural light' },
      { value: 'meditation', label: '🧘 Meditation/Yoga', description: 'Zen corner, plants, calming atmosphere' },
      { value: 'work', label: '💼 Work from Home', description: 'Desk setup, ergonomic chair, good lighting' },
      { value: 'movies', label: '🎬 Watching Movies', description: 'TV setup, comfortable seating, ambient lighting' },
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
    id: 'sleepPreference',
    category: 'Routine & Lighting',
    question: 'How do you prefer to wake up?',
    type: 'single',
    options: [
      { 
        value: 'natural', 
        label: '☀️ With natural sunlight streaming in',
        description: 'Bed facing window, sheer curtains, sunrise alarm'
      },
      { 
        value: 'dark', 
        label: '🌑 In complete darkness until I\'m ready',
        description: 'Blackout curtains, blinds, cave-like bedroom'
      },
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
  const SKIP_VALUE = '__skipped__';
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

  const handleSkip = () => {
    const value = currentQuestion.type === 'multiple' ? [SKIP_VALUE] : SKIP_VALUE;
    setAnswers({ ...answers, [currentQuestion.id]: value });
    handleNext();
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = () => {
    const normalizeArray = (value: any) => {
      if (!Array.isArray(value)) return [];
      return value.filter((item) => item !== SKIP_VALUE);
    };
    const normalizeValue = (value: any) => (value === SKIP_VALUE ? undefined : value);

    // Map chaos level to traits
    const traitsFromAnswers: IdentityTrait[] = [];
    if (normalizeValue(answers.chaosLevel) === 'minimalist') traitsFromAnswers.push('minimalist');
    if (normalizeValue(answers.chaosLevel) === 'maximalist') traitsFromAnswers.push('creative');
    if (normalizeValue(answers.materialPreference) === 'analog') traitsFromAnswers.push('vintage');
    if (normalizeValue(answers.materialPreference) === 'futurist') traitsFromAnswers.push('modern');
    if (normalizeValue(answers.viewPreference) === 'nature') traitsFromAnswers.push('cozy');
    if (normalizeValue(answers.viewPreference) === 'urban') traitsFromAnswers.push('sophisticated');

    // Determine sleep preferences
    const preferNaturalLight = normalizeValue(answers.sleepPreference) === 'natural';
    const preferDarkRoom = normalizeValue(answers.sleepPreference) === 'dark';

    const profile: IdentityProfile = {
      primaryTraits: traitsFromAnswers.slice(0, 3) as IdentityTrait[],
      secondaryTraits: [] as IdentityTrait[],
      colorPreferences: normalizeArray(answers.colorPreferences),
      stylePreferences: [],
      lifestyle: normalizeValue(answers.socialStyle) === 'extrovert' ? 'active' : 'relaxed',
      workFromHome: normalizeArray(answers.activities).includes('work'),
      hobbies: normalizeArray(answers.activities),
      budget: {
        min: Math.max(500, budgetRange[0] * 0.5),
        max: budgetRange[0] * 2,
        currency: 'USD',
      },
      // New fields
      socialStyle: normalizeValue(answers.socialStyle),
      isHost: normalizeValue(answers.isHost) === 'true',
      chaosLevel: normalizeValue(answers.chaosLevel),
      emptySpaceFeeling: normalizeValue(answers.emptySpaceFeeling),
      chronotype: normalizeArray(answers.chronotype),
      viewPreference: normalizeValue(answers.viewPreference),
      materialPreference: normalizeValue(answers.materialPreference),
      techVisibility: normalizeValue(answers.techVisibility),
      // Activity-based fields
      activities: normalizeArray(answers.activities) as LifestyleActivity[],
      preferNaturalLight,
      preferDarkRoom,
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
    <div className="min-h-screen bg-[#0B0F14] text-white relative overflow-hidden py-10">
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-black/60" />

      <div className="relative z-10 container mx-auto px-6 max-w-5xl">
        <div className="flex items-center justify-between text-xs text-white/60 mb-4">
          <span>Question {currentStep + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% Complete</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden mb-10">
          <div className="h-full bg-indigo-500 transition-all" style={{ width: `${progress}%` }} />
        </div>

        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-xs text-white/80 mb-4">
            Personality Analysis
          </div>
          <h1 className="text-3xl md:text-4xl font-semibold">{currentQuestion.question}</h1>
          <p className="text-white/60 mt-3">
            Select all options that resonate with you. Your choices shape your personal design.
          </p>
        </div>

        <Card className="bg-white/5 border-white/10 text-white">
          <CardContent className="py-8">
            {currentQuestion.type === 'range' ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-5xl font-bold text-indigo-300 mb-2">
                    ${budgetRange[0].toLocaleString()}
                  </div>
                  <p className="text-white/50 text-sm">Total budget</p>
                </div>
                <Slider
                  value={budgetRange}
                  onValueChange={setBudgetRange}
                  min={1000}
                  max={50000}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-white/40">
                  <span>$1,000</span>
                  <span>$50,000</span>
                </div>
              </div>
            ) : (
              <div className="grid md:grid-cols-2 gap-4">
                {currentQuestion.options?.map((option) => {
                  const isSelected =
                    currentQuestion.type === 'multiple'
                      ? (answers[currentQuestion.id] || []).includes(option.value)
                      : answers[currentQuestion.id] === option.value;

                  return (
                    <button
                      key={option.value}
                      onClick={() => handleAnswer(option.value)}
                      className={`rounded-xl border px-5 py-4 text-left transition-all ${
                        isSelected
                          ? 'border-indigo-400 bg-indigo-500/20'
                          : 'border-white/10 bg-white/5 hover:border-white/30'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="font-medium text-base">{option.label}</div>
                          {option.description && (
                            <div className="text-sm text-white/50 mt-1">{option.description}</div>
                          )}
                        </div>
                        <div className={`w-4 h-4 rounded border ${isSelected ? 'bg-indigo-400 border-indigo-400' : 'border-white/30'}`} />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between mt-8 text-sm">
          <Button
            variant="ghost"
            className="text-white/70"
            onClick={handlePrevious}
            disabled={currentStep === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>
          <Button variant="ghost" className="text-white/50 hover:text-white" onClick={handleSkip}>
            Skip Question
          </Button>
          <Button
            onClick={handleNext}
            disabled={!canProceed()}
            className="bg-indigo-600 hover:bg-indigo-500"
          >
            {isLastStep ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Generate Design
              </>
            ) : (
              <>
                Next Question
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
