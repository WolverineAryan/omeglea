import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';
import { logger } from '../utils/logger.js';

let isCloudinaryConfigured = false;

if (env.CLOUDINARY_CLOUD_NAME && env.CLOUDINARY_API_KEY && env.CLOUDINARY_API_SECRET) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
  isCloudinaryConfigured = true;
  logger.info('☁️ Cloudinary configured successfully for media storage');
} else {
  logger.warn('⚠️ Cloudinary credentials not found in env. Running in media fallback mode.');
}

export interface UploadResult {
  url: string;
  publicId?: string;
  format?: string;
  width?: number;
  height?: number;
}

/**
 * Upload an image (base64 data URI or remote URL) to Cloudinary
 */
export async function uploadImageToCloudinary(
  fileData: string,
  folder: string = 'omeglea/profiles'
): Promise<UploadResult> {
  if (!isCloudinaryConfigured) {
    // If not configured, fileData (e.g. data URI or direct URL) is returned as fallback
    logger.warn('Cloudinary not configured; using original file payload.');
    return {
      url: fileData,
    };
  }

  try {
    const result = await cloudinary.uploader.upload(fileData, {
      folder,
      resource_type: 'image',
      transformation: [
        { width: 800, height: 800, crop: 'limit' },
        { quality: 'auto', fetch_format: 'auto' },
      ],
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
    };
  } catch (error: any) {
    logger.error('Failed to upload image to Cloudinary:', error);
    throw new Error(error.message || 'Image upload failed');
  }
}

/**
 * Generate client-side signed upload parameters for direct Cloudinary uploads
 */
export function getSignedUploadParams(folder: string = 'omeglea/profiles') {
  if (!isCloudinaryConfigured) {
    return {
      isConfigured: false,
    };
  }

  const timestamp = Math.round(new Date().getTime() / 1000);
  const signature = cloudinary.utils.api_sign_request(
    {
      timestamp,
      folder,
    },
    env.CLOUDINARY_API_SECRET!
  );

  return {
    isConfigured: true,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    apiKey: env.CLOUDINARY_API_KEY,
    timestamp,
    folder,
    signature,
  };
}
