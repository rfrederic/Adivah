import { Schema } from 'mongoose';
import { WORKFLOW_STATUSES } from '../constants.js';

/** Texte géré séparément en français et en anglais. */
export const localized = (required = false) =>
  new Schema(
    {
      fr: { type: String, default: '', trim: true, required },
      en: { type: String, default: '', trim: true },
    },
    { _id: false },
  );

export const imageSchema = new Schema(
  { url: { type: String, default: '' }, alt: { type: localized(), default: () => ({}) } },
  { _id: false },
);

/** Photographie d'une galerie, avec légende et description dans les deux langues. */
export const photoSchema = new Schema(
  {
    url: { type: String, required: true },
    width: { type: Number, default: null },
    height: { type: Number, default: null },
    alt: { type: localized(), default: () => ({}) },
    caption: { type: localized(), default: () => ({}) },
  },
  { _id: false },
);

const actorSchema = new Schema({ id: { type: Schema.Types.ObjectId }, name: { type: String, default: '' } }, { _id: false });

/** Champs du circuit de validation, communs à tous les contenus. `published` reste le seul critère d'affichage public. */
export function workflowPlugin(schema) {
  schema.add({
    workflowStatus: { type: String, enum: WORKFLOW_STATUSES, default: 'draft' },
    publishAt: { type: Date, default: null },
    createdBy: { type: actorSchema, default: null },
    updatedBy: { type: actorSchema, default: null },
    submittedBy: { type: actorSchema, default: null },
    approvedBy: { type: actorSchema, default: null },
    publishedBy: { type: actorSchema, default: null },
    history: [
      new Schema(
        { action: String, by: actorSchema, comment: { type: String, default: '' }, at: { type: Date, default: Date.now } },
        { _id: false },
      ),
    ],
  });
  schema.index({ workflowStatus: 1, publishAt: 1 });
}
