import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  sku: string;
  title: string;
  description: string;
  category: string;
  pricePaise: number;
  stockQuantity: number;
  isAvailable: boolean;
  images: string[];
  merchantId: string;
  createdAt: Date;
  updatedAt: Date;
}

const ProductSchema: Schema = new Schema(
  {
    sku: { type: String, required: true, unique: true, index: true },
    title: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String, required: true, index: true },
    pricePaise: { type: Number, required: true, min: 0 },
    stockQuantity: { type: Number, required: true, min: 0 },
    isAvailable: { type: Boolean, default: true, index: true },
    images: [{ type: String }],
    merchantId: { type: String, required: true, index: true }
  },
  { timestamps: true }
);

export default mongoose.model<IProduct>('Product', ProductSchema);
