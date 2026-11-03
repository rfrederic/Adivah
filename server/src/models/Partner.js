import { Schema, model } from 'mongoose';
import { imageSchema, localized, workflowPlugin } from './shared.js';

const partnerSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: localized(), default: () => ({}) },
    website: { type: String, default: '' },
    image: { type: imageSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
partnerSchema.index({ published: 1, order: 1 });
partnerSchema.plugin(workflowPlugin);

export const Partner = model('Partner', partnerSchema);
