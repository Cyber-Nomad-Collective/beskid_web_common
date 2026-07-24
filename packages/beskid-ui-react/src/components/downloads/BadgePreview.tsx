'use client';

import type { BadgeConfig } from './types';

interface BadgePreviewProps {
  config: BadgeConfig;
}

function buildShieldsUrl(config: BadgeConfig): string {
  const label = encodeURIComponent(config.label);
  const message = encodeURIComponent(config.message);
  const color = encodeURIComponent(config.color);
  let url = `https://img.shields.io/badge/${label}-${message}-${color}?style=${config.style}`;
  if (config.logo) {
    url += `&logo=${encodeURIComponent(config.logo)}`;
  }
  return url;
}

export function BadgePreview({ config }: BadgePreviewProps) {
  const src = buildShieldsUrl(config);

  return (
    <div className="flex items-center justify-center rounded-lg border border-border bg-muted/30 p-4">
      <img
        src={src}
        alt={`Badge: ${config.label} — ${config.message}`}
        className="h-5"
      />
    </div>
  );
}
