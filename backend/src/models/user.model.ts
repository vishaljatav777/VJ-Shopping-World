import mongoose, { Schema, Document } from 'mongoose';

export interface IUserMongo extends Document {
  phoneNumber: string;
  email?: string;
  passwordHash: string;
  name: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema: Schema = new Schema(
  {
    phoneNumber: { type: String, required: true, unique: true, index: true },
    email: { type: String, sparse: true, index: true },
    passwordHash: { type: String, required: true },
    name: { type: String, required: true },
    role: { type: String, default: 'BUYER' },
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

export default mongoose.models.UserMongo || mongoose.model<IUserMongo>('UserMongo', UserSchema);
