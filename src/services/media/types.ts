import { MediaType, ProcessingStatus, ModerationStatus, ModerationRiskLevel, ModerationCategory } from '@/types/app.types';

export interface ProcessImageParams {
  storagePath: string;
  mimeType: string;
  width?: number;
  height?: number;
}

export interface ProcessVideoParams {
  storagePath: string;
  mimeType: string;
  durationSeconds?: number;
}

export interface ProcessedVariantsResult {
  thumbnailPath: string;
  cardPath: string;
  profilePath: string;
  fullPath: string;
  videoThumbnailPath?: string;
  width: number;
  height: number;
  fileSize: number;
  exifStripped: boolean;
}

export interface ModerationScanParams {
  mediaId: string;
  mediaType: MediaType;
  storagePath: string;
  contentHash: string;
}

export interface ModerationScanResult {
  provider: string;
  providerReference: string;
  riskLevel: ModerationRiskLevel;
  categories: ModerationCategory[];
  isFlagged: boolean;
  isBlocked: boolean;
  reason?: string;
  summary: string;
}
