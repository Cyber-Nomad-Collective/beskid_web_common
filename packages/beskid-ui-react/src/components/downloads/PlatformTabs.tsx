'use client';

import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { cn } from '../../lib/utils';
import type { PlatformId } from './types';

interface PlatformTabsProps {
  platforms: { id: PlatformId; label: string }[];
  active: PlatformId;
  onSelect: (id: PlatformId) => void;
}

export function PlatformTabs({ platforms, active, onSelect }: PlatformTabsProps) {
  const detected = getDetectedPlatform();

  return (
    <div className="flex flex-wrap gap-1" role="tablist" aria-label="Platform selector">
      {platforms.map((p) => {
        const isActive = p.id === active;
        const isDetected = p.id === detected;
        return (
          <Button
            key={p.id}
            variant="ghost"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelect(p.id)}
            className={cn(
              'gap-1.5',
              isActive && 'bg-muted text-foreground',
            )}
          >
            {p.label}
            {isDetected && (
              <Badge variant="secondary" className="ml-1">
                detected
              </Badge>
            )}
          </Button>
        );
      })}
    </div>
  );
}

function getDetectedPlatform(): PlatformId | null {
  if (typeof navigator === 'undefined') return null;
  const p = navigator.platform ?? '';
  if (p.includes('Win')) return 'windows-amd64';
  if (p.includes('Mac')) return 'darwin-arm64';
  if (p.includes('Linux')) return 'linux-amd64';
  return null;
}
