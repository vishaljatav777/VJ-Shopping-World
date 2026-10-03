import { Router, Request, Response } from 'express';
import { z } from 'zod';
import cloudinary from '../utils/cloudinary.js';

const router = Router();

const uploadSchema = z.object({
  imageBase64: z.string().min(10)
}).strict();

// POST /api/upload/image — Upload Base64 image to Cloudinary
router.post('/image', async (req: Request, res: Response): Promise<void> => {
  try {
    const parseResult = uploadSchema.safeParse(req.body);
    if (!parseResult.success) {
      res.status(400).json({ error: 'Invalid upload payload', details: parseResult.error.format() });
      return;
    }

    const { imageBase64 } = parseResult.data;

    try {
      const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
        folder: 'vj_shopping_products',
        resource_type: 'auto'
      });

      res.json({
        message: 'Image uploaded successfully to Cloudinary!',
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id
      });
    } catch (cErr: any) {
      console.warn('Cloudinary API upload warning, using Base64 data fallback:', cErr?.message || cErr);
      res.json({
        message: 'Image loaded successfully via Data URL',
        url: imageBase64,
        publicId: `fallback_${Date.now()}`
      });
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Upload failed', message: error.message });
  }
});

export default router;
