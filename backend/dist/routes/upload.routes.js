import { Router } from 'express';
import { z } from 'zod';
import cloudinary from '../utils/cloudinary.js';
const router = Router();
const uploadSchema = z.object({
    imageBase64: z.string().min(10)
}).strict();
// POST /api/upload/image — Upload Base64 image to Cloudinary
router.post('/image', async (req, res) => {
    try {
        const parseResult = uploadSchema.safeParse(req.body);
        if (!parseResult.success) {
            res.status(400).json({ error: 'Invalid upload payload', details: parseResult.error.format() });
            return;
        }
        const { imageBase64 } = parseResult.data;
        const uploadResponse = await cloudinary.uploader.upload(imageBase64, {
            folder: 'vj_shopping_products',
            resource_type: 'auto'
        });
        res.json({
            message: 'Image uploaded successfully to Cloudinary!',
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id
        });
    }
    catch (error) {
        console.error('Cloudinary Upload Error:', error);
        res.status(500).json({ error: 'Cloudinary upload failed', message: error.message });
    }
});
export default router;
