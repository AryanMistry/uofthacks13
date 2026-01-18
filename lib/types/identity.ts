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

// Lifestyle activities that affect room design
export type LifestyleActivity = 
  | 'reading'
  | 'gaming'
  | 'fitness'
  | 'music'
  | 'art'
  | 'meditation'
  | 'work'
  | 'cooking'
  | 'movies';

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
  // Enhanced profile fields
  socialStyle?: SocialStyle;
  isHost?: boolean;
  chaosLevel?: ChaosLevel;
  emptySpaceFeeling?: 'calming' | 'boring';
  chronotype?: Chronotype[];
  viewPreference?: ViewPreference;
  materialPreference?: MaterialPreference;
  techVisibility?: TechVisibility;
  // Lifestyle activities
  activities?: LifestyleActivity[];
  // Sleep preferences (affects bedroom layout)
  preferNaturalLight?: boolean; // Morning person wants bed facing window
  preferDarkRoom?: boolean; // Night person wants blackout options
}

export interface QuizAnswer {
  questionId: string;
  answer: string | string[];
}

export interface IdentityQuiz {
  answers: QuizAnswer[];
  completedAt?: Date;
}

// Suggested items based on activities
export const ACTIVITY_ITEMS: Record<LifestyleActivity, { items: string[]; priority: number }> = {
  reading: {
    items: ['bookshelf', 'reading chair', 'floor lamp', 'side table'],
    priority: 1,
  },
  gaming: {
    items: ['gaming chair', 'desk', 'monitor', 'rgb lights'],
    priority: 2,
  },
  fitness: {
    items: ['yoga mat', 'dumbbells', 'mirror', 'exercise bench'],
    priority: 2,
  },
  music: {
    items: ['keyboard stand', 'guitar stand', 'speaker', 'music stand'],
    priority: 2,
  },
  art: {
    items: ['easel', 'art desk', 'storage cabinet', 'floor lamp'],
    priority: 2,
  },
  meditation: {
    items: ['meditation cushion', 'floor mat', 'candle holder', 'plant'],
    priority: 1,
  },
  work: {
    items: ['desk', 'office chair', 'bookshelf', 'desk lamp'],
    priority: 1,
  },
  cooking: {
    items: ['kitchen island', 'bar stool', 'herb planter'],
    priority: 3,
  },
  movies: {
    items: ['tv stand', 'tv', 'sofa', 'floor lamp'],
    priority: 1,
  },
};

// Get suggested items based on profile
export function getSuggestedItems(profile: IdentityProfile): string[] {
  const suggestions: string[] = [];
  
  // Add items based on activities
  if (profile.activities) {
    for (const activity of profile.activities) {
      const activityConfig = ACTIVITY_ITEMS[activity];
      if (activityConfig) {
        suggestions.push(...activityConfig.items);
      }
    }
  }
  
  // Add items based on work from home
  if (profile.workFromHome) {
    suggestions.push('desk', 'office chair', 'desk lamp', 'bookshelf');
  }
  
  // Add items based on social style
  if (profile.socialStyle === 'extrovert' || profile.isHost) {
    suggestions.push('extra seating', 'bar cart', 'coffee table');
  } else if (profile.socialStyle === 'introvert') {
    suggestions.push('reading nook chair', 'cozy throw blanket');
  }
  
  // Add items based on chronotype
  if (profile.chronotype?.includes('morning') && profile.preferNaturalLight) {
    suggestions.push('sheer curtains'); // Let light in
  } else if (profile.chronotype?.includes('night') || profile.preferDarkRoom) {
    suggestions.push('blackout curtains', 'dimmable lamp');
  }
  
  // Add items based on chaos level
  if (profile.chaosLevel === 'minimalist') {
    // Fewer items, focus on essentials
  } else if (profile.chaosLevel === 'maximalist') {
    suggestions.push('plant', 'wall art', 'decorative vase', 'throw pillows', 'bookshelf');
  }
  
  // Deduplicate
  return [...new Set(suggestions)];
}

// Helper to derive design parameters from profile
export function getDesignParameters(profile: IdentityProfile) {
  const params = {
    lightingTemp: 'neutral' as 'warm' | 'cool' | 'neutral',
    lightingIntensity: 1.0,
    furnitureCount: 'medium' as 'minimal' | 'medium' | 'dense',
    decorationCount: 'medium' as 'minimal' | 'medium' | 'dense',
    primaryMaterial: 'wood' as 'wood' | 'metal' | 'fabric' | 'glass',
    materialStyle: 'modern' as 'vintage' | 'modern' | 'industrial',
    colorPalette: 'neutral' as 'warm' | 'cool' | 'neutral' | 'bold',
    layoutStyle: 'balanced' as 'open' | 'cozy' | 'balanced',
    seatingCapacity: 'standard' as 'minimal' | 'standard' | 'social',
    hasRGBLighting: false,
    hasVisibleTech: true,
    windowTreatment: 'sheer' as 'sheer' | 'blackout' | 'blinds' | 'none',
    suggestedItems: [] as string[],
  };

  // Social style
  if (profile.socialStyle === 'extrovert' || profile.isHost) {
    params.layoutStyle = 'open';
    params.seatingCapacity = 'social';
  } else if (profile.socialStyle === 'introvert') {
    params.layoutStyle = 'cozy';
    params.seatingCapacity = 'minimal';
  }

  // Chaos level
  if (profile.chaosLevel === 'minimalist' || profile.emptySpaceFeeling === 'calming') {
    params.furnitureCount = 'minimal';
    params.decorationCount = 'minimal';
  } else if (profile.chaosLevel === 'maximalist' || profile.emptySpaceFeeling === 'boring') {
    params.furnitureCount = 'dense';
    params.decorationCount = 'dense';
  }

  // Chronotype - window treatment
  if (profile.chronotype?.includes('morning') || profile.preferNaturalLight) {
    params.lightingTemp = 'warm';
    params.lightingIntensity = 1.2;
    params.windowTreatment = 'sheer';
  } else if (profile.chronotype?.includes('night') || profile.preferDarkRoom) {
    params.lightingTemp = 'cool';
    params.lightingIntensity = 0.8;
    params.windowTreatment = 'blackout';
  }

  // View preference
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

  // Color preferences
  if (profile.colorPreferences.includes('warm')) {
    params.colorPalette = 'warm';
  } else if (profile.colorPreferences.includes('cool')) {
    params.colorPalette = 'cool';
  } else if (profile.colorPreferences.includes('bold')) {
    params.colorPalette = 'bold';
  }

  // Get suggested items
  params.suggestedItems = getSuggestedItems(profile);

  return params;
}
