import { Schema, model } from 'mongoose';
import { PUBLICATION_TYPES } from '../constants.js';
import { localized, workflowPlugin } from './shared.js';

const publicationSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: localized(true), required: true },
    description: { type: localized(), default: () => ({}) },
    type: { type: String, enum: PUBLICATION_TYPES, required: true },
    fileUrl: { type: String, default: '' },
    fileSize: { type: Number, default: 0 },
    year: { type: Number, default: null },
    language: { type: String, enum: ['fr', 'en', 'both'], default: 'fr' },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
publicationSchema.index({ published: 1, type: 1, year: -1 });
publicationSchema.plugin(workflowPlugin);

export const Publication = model('Publication', publicationSchema);
