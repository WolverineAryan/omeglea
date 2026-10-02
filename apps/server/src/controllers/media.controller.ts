import { Request, Response } from 'express';
import { uploadImageToCloudinary, getSignedUploadParams } from '../services/cloudinary.service.js';
import { UserProfile } from '../models/UserProfile.js';
import { logger } from '../utils/logger.js';

export async function uploadMedia(req: Request, res: Response): Promise<void> {
  const userId = req.user!.userId;
  const { image, folder } = req.body;

  if (!image || typeof image !== 'string') {
    res.status(400).json({ success: false, error: { message: 'Image data is required' } });
    return;
  }

  try {
    const targetFolder = folder ? `omeglea/${folder}` : `omeglea/users/${userId}`;
    const result = await uploadImageToCloudinary(image, targetFolder);

    res.status(200).json({
      success: true,
      data: {
        url: result.url,
        publicId: result.publicId,
      },
    });
  } catch (error: any) {
    logger.error('Error in uploadMedia controller:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Media upload failed' },
    });
  }
}

export async function getUploadConfig(req: Request, res: Response): Promise<void> {
  const folder = req.query.folder as string || 'omeglea/profiles';
  const config = getSignedUploadParams(folder);

  res.status(200).json({
    success: true,
    data: config,
  });
}
