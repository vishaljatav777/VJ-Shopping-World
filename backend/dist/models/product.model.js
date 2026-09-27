import mongoose, { Schema } from 'mongoose';
const ProductSchema = new Schema({
    sku: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    pricePaise: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    images: [{ type: String }],
    merchantId: { type: String, required: true, index: true }
}, { timestamps: true });
export default mongoose.model('Product', ProductSchema);
