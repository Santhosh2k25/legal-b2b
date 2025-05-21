import mongoose from '../config/mongodb';
const { Schema, model } = mongoose;
import { Document } from 'mongoose';

export interface ITask extends Document {
  title: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate?: Date;
  caseId?: mongoose.Types.ObjectId;
  clientId?: mongoose.Types.ObjectId;
  notes?: string;
  userId: mongoose.Types.ObjectId; // Reference to the lawyer
  createdAt: Date;
  updatedAt: Date;
}

const TaskSchema = new Schema<ITask>({
  title: { type: String, required: true },
  description: { type: String },
  status: { 
    type: String, 
    enum: ['pending', 'in-progress', 'completed', 'cancelled'], 
    default: 'pending' 
  },
  priority: { 
    type: String, 
    enum: ['low', 'medium', 'high', 'urgent'], 
    default: 'medium' 
  },
  dueDate: { type: Date },
  caseId: { type: Schema.Types.ObjectId, ref: 'Case' },
  clientId: { type: Schema.Types.ObjectId, ref: 'Client' },
  notes: { type: String },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Pre-save middleware to update the updatedAt field
TaskSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

const Task = model<ITask>('Task', TaskSchema);

export default Task; 