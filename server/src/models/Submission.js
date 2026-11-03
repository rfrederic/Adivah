import { Schema, model } from 'mongoose';
import { SUBMISSION_STATUSES, SUBMISSION_TYPES } from '../constants.js';

// Volontairement minimal : aucune adresse IP ni donnée technique n'est conservée.
const submissionSchema = new Schema(
  {
    type: { type: String, enum: SUBMISSION_TYPES, default: 'contact' },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    phone: { type: String, default: '', trim: true },
    organization: { type: String, default: '', trim: true },
    subject: { type: String, default: '', trim: true },
    message: { type: String, required: true, trim: true },
    language: { type: String, enum: ['fr', 'en'], default: 'fr' },
    status: { type: String, enum: SUBMISSION_STATUSES, default: 'new' },
    consentAt: { type: Date, required: true },
  },
  { timestamps: true },
);
submissionSchema.index({ status: 1, createdAt: -1 });

export const Submission = model('Submission', submissionSchema);
