'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useDesignStore } from '@/lib/store/design-store';
import { IdentityProfile, IdentityTrait } from '@/lib/types/identity';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const questions = [
  {
    id: 'lifestyle',
    question: 'How would you describe your lifestyle?',
    type: 'single',
    options: [
      { value: 'active', label: 'Active - Always on the go' },
      { value: 'relaxed', label: 'Relaxed - Prefer calm and peace' },
      { value: 'balanced', label: 'Balanced - Mix of both' },
    ],
  },
  {
    id: 'workFromHome',
    question: 'Do you work from home?',
    type: 'single',
    options: [
      { value: 'true', label: 'Yes, frequently' },
      { value: 'false', label: 'No, rarely' },
    ],
  },
  {
    id: 'primaryTraits',
    question: 'Select your primary identity traits (choose 2-3)',
    type: 'multiple',
    options: [
      { value: 'minimalist', label: 'Minimalist' },
      { value: 'creative', label: 'Creative' },
      { value: 'professional', label: 'Professional' },
      { value: 'cozy', label: 'Cozy' },
      { value: 'energetic', label: 'Energetic' },
      { value: 'calm', label: 'Calm' },
      { value: 'sophisticated', label: 'Sophisticated' },
      { value: 'modern', label: 'Modern' },
    ],
  },
  {
    id: 'colorPreferences',
    question: 'What color palette appeals to you?',
    type: 'multiple',
    options: [
      { value: 'neutral', label: 'Neutral (beiges, grays, whites)' },
      { value: 'warm', label: 'Warm (oranges, reds, yellows)' },
      { value: 'cool', label: 'Cool (blues, greens, purples)' },
      { value: 'bold', label: 'Bold (bright, vibrant colors)' },
      { value: 'pastel', label: 'Pastel (soft, muted colors)' },
    ],
  },
  {
    id: 'budget',
    question: 'What is your budget range?',
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
    const profile: IdentityProfile = {
      primaryTraits: (answers.primaryTraits || []).slice(0, 3) as IdentityTrait[],
      secondaryTraits: [] as IdentityTrait[],
      colorPreferences: answers.colorPreferences || [],
      stylePreferences: [],
      lifestyle: answers.lifestyle || 'balanced',
      workFromHome: answers.workFromHome === 'true',
      hobbies: [],
      budget: {
        min: Math.max(500, budgetRange[0] * 0.5),
        max: budgetRange[0] * 2,
        currency: 'USD',
      },
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
      return selected.length >= 2;
    }
    return answers[currentQuestion.id] !== undefined;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between mb-4">
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {questions.length}
              </div>
              <div className="w-32 h-2 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
                />
              </div>
            </div>
            <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentQuestion.type === 'range' ? (
              <div className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary mb-2">
                    ${budgetRange[0].toLocaleString()}
                  </div>
                  <p className="text-sm text-muted-foreground">Total budget</p>
                </div>
                <Slider
                  value={budgetRange}
                  onValueChange={setBudgetRange}
                  min={1000}
                  max={50000}
                  step={500}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
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
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/5'
                          : 'border-gray-200 hover:border-primary/50'
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex justify-between pt-6">
              <Button
                variant="outline"
                onClick={handlePrevious}
                disabled={currentStep === 0}
              >
                <ChevronLeft className="h-4 w-4 mr-2" />
                Previous
              </Button>
              <Button
                onClick={handleNext}
                disabled={!canProceed()}
              >
                {isLastStep ? 'Generate Design' : 'Next'}
                {!isLastStep && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
