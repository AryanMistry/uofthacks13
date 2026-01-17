export type IdentityTrait = 
  | 'minimalist'
  | 'creative'
  | 'professional'
  | 'cozy'
  | 'energetic'
  | 'calm'
  | 'adventurous'
  | 'sophisticated'
  | 'bohemian'
  | 'modern'
  | 'vintage'
  | 'industrial';

export interface IdentityProfile {
  primaryTraits: IdentityTrait[];
  secondaryTraits: IdentityTrait[];
  colorPreferences: string[];
  stylePreferences: string[];
  lifestyle: 'active' | 'relaxed' | 'balanced';
  workFromHome: boolean;
  hobbies: string[];
  budget: {
    min: number;
    max: number;
    currency: string;
  };
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IdentityQuiz {
  answers: QuizAnswer[];
  completedAt?: Date;
}
