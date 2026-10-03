import { Router, Request, Response } from 'express';
import cloudinary from '../utils/cloudinary.js';

const router = Router();

// POST /api/upload/image — Upload Base64 image to Cloudinary (with Data URL fallback)
router.post('/image', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawImage = req.body?.imageBase64 || req.body?.image || req.body?.file || (typeof req.body === 'string' ? req.body : '');

    if (!rawImage || typeof rawImage !== 'string' || rawImage.length < 10) {
      res.status(400).json({ error: 'Invalid upload payload. Please select a valid image file.' });
      return;
    }

    try {
      const uploadResponse = await cloudinary.uploader.upload(rawImage, {
        folder: 'vj_shopping_products',
        resource_type: 'auto'
      });

      res.json({
        message: 'Image uploaded successfully to Cloudinary!',
        url: uploadResponse.secure_url,
        publicId: uploadResponse.public_id
      });
      return;
    } catch (cloudinaryErr: any) {
      console.warn('Cloudinary API upload warning, using Data URL fallback:', cloudinaryErr?.message || cloudinaryErr);
      res.json({
        message: 'Image processed successfully via Data URL',
        url: rawImage,
        publicId: `fallback_${Date.now()}`
      });
      return;
    }
  } catch (error: any) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Upload process failed', message: error?.message || 'Server error during upload.' });
  }
});

export default router;
