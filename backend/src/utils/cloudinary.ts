import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.CLOUDINARY_URL) {
  cloudinary.config({ secure: true });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'doz9gfotx',
    api_key: process.env.CLOUDINARY_API_KEY || '167119875251373',
    api_secret: process.env.CLOUDINARY_API_SECRET || '7id1lLuuKFuNh3NQLW9PHgn96KI',
    secure: true
  });
}

export default cloudinary;
