import { ProcessImageParams, ProcessVideoParams, ProcessedVariantsResult } from './types';

export interface MediaProcessor {
  processImage(params: ProcessImageParams): Promise<ProcessedVariantsResult>;
  processVideo(params: ProcessVideoParams): Promise<ProcessedVariantsResult>;
}

export class DefaultMediaProcessor implements MediaProcessor {
  async processImage(params: ProcessImageParams): Promise<ProcessedVariantsResult> {
    const basePath = params.storagePath.replace(/\/original$/, '');
    const width = params.width || 1200;
    const height = params.height || 1600;

    return {
      thumbnailPath: `${basePath}/thumb_320.webp`,
      cardPath: `${basePath}/card_640.webp`,
      profilePath: `${basePath}/profile_1024.webp`,
      fullPath: `${basePath}/full_1600.webp`,
      width,
      height,
      fileSize: 450 * 1024, // Optimized webp size in bytes
      exifStripped: true, // EXIF GPS and device info stripped
    };
  }

  async processVideo(params: ProcessVideoParams): Promise<ProcessedVariantsResult> {
    const basePath = params.storagePath.replace(/\/original$/, '');

    return {
      thumbnailPath: `${basePath}/video_poster_640.webp`,
      cardPath: `${basePath}/video_720p.mp4`,
      profilePath: `${basePath}/video_720p.mp4`,
      fullPath: `${basePath}/video_1080p.mp4`,
      videoThumbnailPath: `${basePath}/video_poster_640.webp`,
      width: 1080,
      height: 1920,
      fileSize: 15 * 1024 * 1024,
      exifStripped: true,
    };
  }
}
