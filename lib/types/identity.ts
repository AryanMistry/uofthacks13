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

export type SocialStyle = 'extrovert' | 'introvert';
export type ChaosLevel = 'minimalist' | 'maximalist';
export type Chronotype = 'morning' | 'afternoon' | 'night';
export type MaterialPreference = 'analog' | 'futurist';
export type TechVisibility = 'visible' | 'hidden';
export type ColorTemperature = 'warm' | 'cool' | 'neutral';
export type ViewPreference = 'urban' | 'nature';

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
  // New enhanced profile fields
  socialStyle?: SocialStyle; // extrovert = open layout, introvert = cozy nooks
  isHost?: boolean; // true = more seating, false = single throne
  chaosLevel?: ChaosLevel; // minimalist = fewer items, maximalist = more decorations
  emptySpaceFeeling?: 'calming' | 'boring'; // affects asset density
  chronotype?: Chronotype[]; // affects lighting temperature
  viewPreference?: ViewPreference; // urban = cold tones, nature = warm tones
  materialPreference?: MaterialPreference; // analog = wood/leather, futurist = metal/glass
  techVisibility?: TechVisibility; // visible = RGB, hidden = clean look
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IdentityQuiz {
  answers: QuizAnswer[];
  completedAt?: Date;
}

// Helper to derive design parameters from profile
export function getDesignParameters(profile: IdentityProfile) {
  const params = {
    // Lighting
    lightingTemp: 'neutral' as 'warm' | 'cool' | 'neutral',
    lightingIntensity: 1.0,
    
    // Asset density
    furnitureCount: 'medium' as 'minimal' | 'medium' | 'dense',
    decorationCount: 'medium' as 'minimal' | 'medium' | 'dense',
    
    // Materials
    primaryMaterial: 'wood' as 'wood' | 'metal' | 'fabric' | 'glass',
    materialStyle: 'modern' as 'vintage' | 'modern' | 'industrial',
    
    // Colors
    colorPalette: 'neutral' as 'warm' | 'cool' | 'neutral' | 'bold',
    
    // Layout
    layoutStyle: 'balanced' as 'open' | 'cozy' | 'balanced',
    seatingCapacity: 'standard' as 'minimal' | 'standard' | 'social',
    
    // Tech
    hasRGBLighting: false,
    hasVisibleTech: true,
  };

  // Social style affects layout
  if (profile.socialStyle === 'extrovert' || profile.isHost) {
    params.layoutStyle = 'open';
    params.seatingCapacity = 'social';
  } else if (profile.socialStyle === 'introvert') {
    params.layoutStyle = 'cozy';
    params.seatingCapacity = 'minimal';
  }

  // Chaos level affects density
  if (profile.chaosLevel === 'minimalist' || profile.emptySpaceFeeling === 'calming') {
    params.furnitureCount = 'minimal';
    params.decorationCount = 'minimal';
  } else if (profile.chaosLevel === 'maximalist' || profile.emptySpaceFeeling === 'boring') {
    params.furnitureCount = 'dense';
    params.decorationCount = 'dense';
  }

  // Chronotype affects lighting
  if (profile.chronotype?.includes('morning')) {
    params.lightingTemp = 'warm';
    params.lightingIntensity = 1.2;
  } else if (profile.chronotype?.includes('night')) {
    params.lightingTemp = 'cool';
    params.lightingIntensity = 0.8;
  }

  // View preference affects colors
  if (profile.viewPreference === 'urban') {
    params.colorPalette = 'cool';
    params.lightingTemp = 'cool';
  } else if (profile.viewPreference === 'nature') {
    params.colorPalette = 'warm';
    params.lightingTemp = 'warm';
  }

  // Material preference
  if (profile.materialPreference === 'analog') {
    params.primaryMaterial = 'wood';
    params.materialStyle = 'vintage';
  } else if (profile.materialPreference === 'futurist') {
    params.primaryMaterial = 'metal';
    params.materialStyle = 'modern';
  }

  // Tech visibility
  if (profile.techVisibility === 'visible') {
    params.hasRGBLighting = true;
    params.hasVisibleTech = true;
  } else if (profile.techVisibility === 'hidden') {
    params.hasRGBLighting = false;
    params.hasVisibleTech = false;
  }

  // Color preferences from quiz
  if (profile.colorPreferences.includes('warm')) {
    params.colorPalette = 'warm';
  } else if (profile.colorPreferences.includes('cool')) {
    params.colorPalette = 'cool';
  } else if (profile.colorPreferences.includes('bold')) {
    params.colorPalette = 'bold';
  }

  return params;
}
