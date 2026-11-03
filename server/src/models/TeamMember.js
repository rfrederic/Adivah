import { Schema, model } from 'mongoose';
import { imageSchema, localized, workflowPlugin } from './shared.js';

const teamMemberSchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    position: { type: localized(), default: () => ({}) },
    bio: { type: localized(), default: () => ({}) },
    image: { type: imageSchema, default: () => ({}) },
    order: { type: Number, default: 0 },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
teamMemberSchema.index({ published: 1, order: 1 });
teamMemberSchema.plugin(workflowPlugin);

export const TeamMember = model('TeamMember', teamMemberSchema);
