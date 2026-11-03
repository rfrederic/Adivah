import { Schema, model } from 'mongoose';
import { MEDIA_CATEGORIES } from '../constants.js';
import { localized } from './shared.js';

const mediaSchema = new Schema(
  {
    url: { type: String, required: true, unique: true },
    kind: { type: String, enum: ['image', 'document'], required: true },
    category: { type: String, enum: MEDIA_CATEGORIES, default: 'other' },
    originalName: { type: String, default: '' },
    size: { type: Number, default: 0 },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    alt: { type: localized(), default: () => ({}) },
    description: { type: localized(), default: () => ({}) },
    uploadedBy: { id: Schema.Types.ObjectId, name: String },
  },
  { timestamps: true },
);
mediaSchema.index({ kind: 1, category: 1, createdAt: -1 });

export const Media = model('Media', mediaSchema);
