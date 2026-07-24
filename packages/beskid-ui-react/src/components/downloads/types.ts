export type PlatformId = 'linux-amd64' | 'darwin-arm64' | 'windows-amd64';

export interface AssetInfo {
  platform: string;
  arch: string;
  kind: 'binary';
  url: string;
  filename: string;
}

export interface PackageInfo {
  platform: string;
  label: string;
  command: string;
  url: string;
}

export interface ReleaseInfo {
  version: string;
  date: string;
  title: string;
  changelog: string;
  links: { label: string; url: string }[];
}

export interface VersionPayload {
  version: string;
  source: string;
  assets: AssetInfo[];
  packages: PackageInfo[];
  installScript: { sh: string; ps: string };
  containerImages: { base: string; runner: string };
}

export type BadgeStyle = 'flat' | 'flat-square' | 'plastic' | 'for-the-badge' | 'social';
export type BadgeKind = 'version' | 'platform' | 'download' | 'custom';

export interface BadgeConfig {
  kind: BadgeKind;
  label: string;
  message: string;
  color: string;
  style: BadgeStyle;
  logo?: string;
}
