import { Schema, model } from 'mongoose';
import { CAMPAIGN_STATUSES } from '../constants.js';
import { imageSchema, localized, workflowPlugin } from './shared.js';

const campaignSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: localized(true), required: true },
    summary: { type: localized(), default: () => ({}) },
    body: { type: localized(), default: () => ({}) },
    campaignStatus: { type: String, enum: CAMPAIGN_STATUSES, default: 'upcoming' },
    startDate: { type: Date, default: null },
    endDate: { type: Date, default: null },
    image: { type: imageSchema, default: () => ({}) },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
  },
  { timestamps: true },
);
campaignSchema.index({ published: 1, startDate: -1 });
campaignSchema.plugin(workflowPlugin);

export const Campaign = model('Campaign', campaignSchema);
