import mongoose from '../config/mongodb';
const { Schema, model } = mongoose;
import { Document as MongoDocument } from 'mongoose';

export interface IDocument extends MongoDocument {
  title: string;
  description?: string;
  fileUrl: string;
  fileType?: string;
  fileSize?: number;
  caseId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  tags?: string[];
  userId: mongoose.Types.ObjectId; // Reference to the lawyer
  createdAt: Date;
  updatedAt: Date;
}

const DocumentSchema = new Schema<IDocument>({
  title: { type: String, required: true },
  description: { type: String },
  fileUrl: { type: String, required: true },
  fileType: { type: String },
  fileSize: { type: Number },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  tags: [{ type: String }],
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedAt field
DocumentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const DocumentModel = model<IDocument>('Document', DocumentSchema);

export default DocumentModel; 