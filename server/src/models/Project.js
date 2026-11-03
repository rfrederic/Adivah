import { Schema, model } from 'mongoose';
import { AREAS, PROJECT_STATUSES } from '../constants.js';
import { imageSchema, localized, photoSchema, workflowPlugin } from './shared.js';

const projectSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: localized(true), required: true },
    summary: { type: localized(), default: () => ({}) },
    body: { type: localized(), default: () => ({}) },
    location: { type: localized(), default: () => ({}) },
    date: { type: Date, default: null },
    datePrecision: { type: String, enum: ['day', 'month', 'year'], default: 'day' },
    gallery: [photoSchema],
    status: { type: String, enum: PROJECT_STATUSES, default: 'to-confirm' },
    category: { type: String, enum: AREAS, required: true },
    image: { type: imageSchema, default: () => ({}) },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
projectSchema.index({ published: 1, category: 1, status: 1, date: -1 });
projectSchema.plugin(workflowPlugin);

export const Project = model('Project', projectSchema);
