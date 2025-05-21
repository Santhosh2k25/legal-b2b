import mongoose from '../config/mongodb';
const { Schema, model } = mongoose;
import { Document } from 'mongoose';

export interface ICase extends Document {
  title: string;
  description?: string;
  caseNumber?: string;
  court?: string;
  status: 'active' | 'closed' | 'pending' | 'won' | 'lost';
  client: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId; // Reference to the lawyer
  filingDate?: Date;
  hearingDate?: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CaseSchema = new Schema<ICase>({
  title: { type: String, required: true },
  description: { type: String },
  caseNumber: { type: String },
  court: { type: String },
  status: { 
    type: String, 
    enum: ['active', 'closed', 'pending', 'won', 'lost'], 
    default: 'active' 
  },
  client: { type: Schema.Types.ObjectId, ref: 'Client', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  filingDate: { type: Date },
  hearingDate: { type: Date },
  notes: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedAt field
CaseSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Case = model<ICase>('Case', CaseSchema);

export default Case; 