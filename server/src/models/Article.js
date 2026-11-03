import { Schema, model } from 'mongoose';
import { ARTICLE_CATEGORIES } from '../constants.js';
import { imageSchema, localized, photoSchema, workflowPlugin } from './shared.js';

const historySectionSchema = new Schema(
  {
    key: { type: String, required: true },
    hidden: { type: Boolean, default: false },
    date: { type: localized(), default: () => ({}) },
    location: { type: localized(), default: () => ({}) },
    heading: { type: localized(), default: () => ({}) },
    body: { type: localized(), default: () => ({}) },
    photos: [photoSchema],
  },
  { _id: false },
);

const articleSchema = new Schema(
  {
    slug: { type: String, required: true, unique: true },
    title: { type: localized(true), required: true },
    excerpt: { type: localized(), default: () => ({}) },
    body: { type: localized(), default: () => ({}) },
    category: { type: String, enum: ARTICLE_CATEGORIES, required: true },
    image: { type: imageSchema, default: () => ({}) },
    publishedAt: { type: Date, default: null },
    published: { type: Boolean, default: false },
    isSample: { type: Boolean, default: false },
    // Mise en page « publication historique » : introduction (body), image principale (image), chapô = sous-titre (excerpt).
    layout: { type: String, enum: ['standard', 'history'], default: 'standard' },
    logoUrl: { type: String, default: '' },
    heroCaption: { type: localized(), default: () => ({}) },
    timelineTitle: { type: localized(), default: () => ({}) },
    sections: [historySectionSchema],
    closingTitle: { type: localized(), default: () => ({}) },
    closingBody: { type: localized(), default: () => ({}) },
    closingHighlight: { type: localized(), default: () => ({}) },
    signature: { type: localized(), default: () => ({}) },
    finalMessage: { type: localized(), default: () => ({}) },
    seo: {
      title: { type: localized(), default: () => ({}) },
      description: { type: localized(), default: () => ({}) },
      keywords: { type: localized(), default: () => ({}) },
    },
    // Points à vérifier par la direction : jamais envoyés au public.
    reviewNotes: { type: String, default: '' },
  },
  { timestamps: true },
);
articleSchema.index({ published: 1, category: 1, publishedAt: -1 });
articleSchema.plugin(workflowPlugin);

export const Article = model('Article', articleSchema);
