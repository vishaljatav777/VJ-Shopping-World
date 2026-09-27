import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';
dotenv.config();
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'vj_shopping_cloud',
    api_key: process.env.CLOUDINARY_API_KEY || '167119875251373',
    api_secret: process.env.CLOUDINARY_API_SECRET || '7id1lLuuKFuNh3NQLW9PHgn96KI',
    secure: true
});
export default cloudinary;
