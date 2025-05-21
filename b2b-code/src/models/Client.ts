import mongoose from '../config/mongodb';
const { Schema, model } = mongoose;
import { Document } from 'mongoose';

export interface IClient extends Document {
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  company?: string;
  notes?: string;
  userId: mongoose.Types.ObjectId; // Reference to the lawyer
  createdAt: Date;
  updatedAt: Date;
}

const ClientSchema = new Schema<IClient>({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  address: { type: String },
  company: { type: String },
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedAt field
ClientSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Client = model<IClient>('Client', ClientSchema);

export default Client; 