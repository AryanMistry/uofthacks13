'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IdentityProfile } from '@/lib/types/identity';

interface ReasoningPanelProps {
  identityProfile: IdentityProfile;
}

function buildReasoning(profile: IdentityProfile): string[] {
  const lines: string[] = [];

  if (profile.socialStyle === 'extrovert' || profile.isHost) {
    lines.push('Added extra seating to support your social, host-friendly vibe.');
  } else if (profile.socialStyle === 'introvert') {
    lines.push('Kept the layout calm and cozy to create a personal sanctuary.');
  }

  if (profile.chaosLevel === 'minimalist' || profile.emptySpaceFeeling === 'calming') {
    lines.push('Reduced clutter and decor to match your minimalist comfort with open space.');
  } else if (profile.chaosLevel === 'maximalist' || profile.emptySpaceFeeling === 'boring') {
    lines.push('Layered decor and accents to match your preference for a lively space.');
  }

  if (profile.chronotype?.includes('morning') || profile.preferNaturalLight) {
    lines.push('Oriented key pieces toward windows to amplify morning light energy.');
  } else if (profile.chronotype?.includes('night') || profile.preferDarkRoom) {
    lines.push('Added darker window treatments to support restful late-night routines.');
  }

  if (profile.viewPreference === 'urban') {
    lines.push('Used cooler tones and sleek materials to reflect your city-inspired taste.');
  } else if (profile.viewPreference === 'nature') {
    lines.push('Chose warmer tones and organic textures to echo your nature preference.');
  }

  if (profile.materialPreference === 'analog') {
    lines.push('Prioritized warm wood and tactile finishes to fit your analog material preference.');
  } else if (profile.materialPreference === 'futurist') {
    lines.push('Leaned into sleek, modern materials to fit your futurist aesthetic.');
  }

  if (profile.techVisibility === 'visible') {
    lines.push('Added visible tech accents like LED lighting to match your tech-forward style.');
  } else if (profile.techVisibility === 'hidden') {
    lines.push('Kept tech subtle and integrated for a clean, low-visual-noise look.');
  }

  if (profile.activities?.includes('work') || profile.workFromHome) {
    lines.push('Included a focused desk setup to support your work rhythm.');
  }
  if (profile.activities?.includes('fitness')) {
    lines.push('Reserved a compact zone for fitness gear to reflect your active lifestyle.');
  }
  if (profile.activities?.includes('reading')) {
    lines.push('Added a reading nook vibe with a chair and soft lighting for quiet focus.');
  }
  if (profile.activities?.includes('gaming')) {
    lines.push('Made space for a gaming setup that fits your high-energy play style.');
  }
  if (profile.activities?.includes('music')) {
    lines.push('Planned room flow to accommodate music gear without crowding the space.');
  }
  if (profile.activities?.includes('meditation')) {
    lines.push('Left a small calm zone for breathing space and mindful routines.');
  }

  return lines.length > 0
    ? lines
    : ['Designed a balanced layout based on your identity profile and preferences.'];
}

export function ReasoningPanel({ identityProfile }: ReasoningPanelProps) {
  const [activeTab, setActiveTab] = useState<'reasoning' | 'profile'>('reasoning');

  const reasoningLines = useMemo(
    () => buildReasoning(identityProfile),
    [identityProfile]
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between">
          <span>AI Reasoning</span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant={activeTab === 'reasoning' ? 'default' : 'outline'}
              onClick={() => setActiveTab('reasoning')}
            >
              Reasoning
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'profile' ? 'default' : 'outline'}
              onClick={() => setActiveTab('profile')}
            >
              Profile
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {activeTab === 'reasoning' ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            {reasoningLines.map((line, idx) => (
              <div key={`${line}-${idx}`}>• {line}</div>
            ))}
          </div>
        ) : (
          <div className="space-y-2 text-sm">
            <div>
              <div className="text-xs font-medium text-muted-foreground">Traits</div>
              <div>{identityProfile.primaryTraits?.join(', ') || '—'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Color Palette</div>
              <div>{identityProfile.colorPreferences?.join(', ') || '—'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Activities</div>
              <div>{identityProfile.activities?.join(', ') || '—'}</div>
            </div>
            <div>
              <div className="text-xs font-medium text-muted-foreground">Budget</div>
              <div>
                ${identityProfile.budget.min.toLocaleString()} - ${identityProfile.budget.max.toLocaleString()}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
