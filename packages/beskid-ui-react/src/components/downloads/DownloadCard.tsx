'use client';

import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { InstallCommand } from './InstallCommand';
import type { AssetInfo, PackageInfo } from './types';

interface DownloadCardProps {
  asset: AssetInfo;
  packages: PackageInfo[];
  installCommand: string;
  installLabel: string;
  active: boolean;
}

export function DownloadCard({ asset, packages, installCommand, installLabel, active }: DownloadCardProps) {
  if (!active) return null;

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge>{asset.platform}</Badge>
          <span>{asset.arch}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {/* Direct download */}
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Binary download:</span>
          <Button variant="outline" size="sm" asChild>
            <a href={asset.url} download={asset.filename}>
              {asset.filename}
            </a>
          </Button>
        </div>

        {/* Package manager installs */}
        {packages.length > 0 && (
          <div className="flex flex-col gap-2">
            <span className="text-sm text-muted-foreground">Package managers:</span>
            {packages.map((pkg) => (
              <div key={pkg.label} className="flex items-center gap-3">
                <Badge variant="outline">{pkg.label}</Badge>
                <code className="text-xs bg-muted/50 px-2 py-0.5 rounded">{pkg.command}</code>
                <Button variant="link" size="xs" asChild>
                  <a href={pkg.url} target="_blank" rel="noopener noreferrer">
                    view package
                  </a>
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Install command */}
        <InstallCommand command={installCommand} label={installLabel} badgeLabel="install" />
      </CardContent>
    </Card>
  );
}
